import NextAuth, { AuthOptions, Profile, Account, User } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import TwitterProvider from "next-auth/providers/twitter";
import { PlatformType } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { encryptToken } from "@/lib/encryption";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// extend interfaces for expected custom profile structures
interface GitHubProfile extends Profile {
    id?: number;
    login?: string;
}

interface TwitterProfile extends Profile {
    data?: {
        id?: string;
        username?: string;
        name?: string;
    }
}

// global logger to debug auth flows
const logger = {
  debug: (message: string, data?: any) => {
    console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
    if (error instanceof Error) {
      console.error(`Stack: ${error.stack}`);
    }
  }
};

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: "read:user user:email" } },
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_API_KEY!,
      clientSecret: process.env.TWITTER_API_SECRET!,
      version: "2.0",
      authorization: {
        url: "https://twitter.com/i/oauth2/authorize",
        params: {
          scope: "users.read tweet.read offline.access", 
          get redirect_uri() {
            if (!process.env.NEXTAUTH_URL) 
              throw new Error("NEXTAUTH_URL environment variable is not set - Twitter OAuth will fail");
            return `${process.env.NEXTAUTH_URL}/api/auth/callback/twitter`;
          }
        }
      },
      token: {
        url: "https://api.twitter.com/2/oauth2/token",
        async request({ client, params, checks, provider }) {
          try {
            const callbackUrl = process.env.NEXTAUTH_URL 
              ? `${process.env.NEXTAUTH_URL}/api/auth/callback/twitter`
              : null; 
            
            if (!callbackUrl) {
              throw new Error("NEXTAUTH_URL env var missing - callback will fail");
            }
            
            const response = await client.oauthCallback(
              provider.callbackUrl || callbackUrl, 
              params, 
              checks, 
              {
                exchangeBody: {
                  client_id: client.client_id,
                  redirect_uri: callbackUrl,
                }
              }
            );
            return { tokens: response };
          } catch (error: any) {
            logger.error('Twitter token exchange error:', error);
            throw error;
          }
        }
      },
      userinfo: {
        url: "https://api.twitter.com/2/users/me",
        params: {
          "user.fields": "profile_image_url,name,username"
        }
      },
      profile(profile) {
        return {
          id: profile.data.id,
          name: profile.data.name,
          email: null,
          image: profile.data.profile_image_url,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user: User, account: Account | null, profile?: Profile | GitHubProfile | TwitterProfile }) {
      logger.info(`SignIn callback started for provider: ${account?.provider}`, { 
        userId: user?.id, 
        accountId: account?.providerAccountId,
        hasProfile: !!profile 
      });
      
      if (!account || !profile) {
        logger.error("NextAuth signIn: Missing account or profile info.");
        return '/settings/connections?error=provider_data_missing';
      }

      const authData = await auth();
      const clerkId = authData.userId;

      if (!clerkId) {
        logger.error("NextAuth signIn: Clerk user ID not found. User must be logged in.");
        return '/sign-in?error=ClerkSessionNotFound';
      }

      logger.info(`Clerk authentication successful, userId: ${clerkId}`);

      const dbUser = await prisma.user.findUnique({ where: { clerkId } });
      if (!dbUser) {
        logger.error(`NextAuth signIn: DB User not found for Clerk ID: ${clerkId}. Sync issue?`);
        return '/settings/connections?error=db_user_not_found';
      }

      logger.info(`Found database user: ${dbUser.id}`);

      let platform: PlatformType;
      let platformProfileId: string | undefined;
      let platformUsername: string | undefined;
      let scopes = account.scope || '';

      switch (account.provider) {
        case "github":
          const ghProfile = profile as GitHubProfile;
          platform = PlatformType.GITHUB;
          if (!ghProfile.id && !account.providerAccountId) {
            logger.error("Missing GitHub profile ID", { profile: ghProfile });
            return '/settings/connections?error=missing_profile_id';
          }
          platformProfileId = ghProfile.id?.toString() ?? account.providerAccountId;
          platformUsername = ghProfile.login;
          break;
        case "twitter":
          const twProfile = profile as TwitterProfile;
          platform = PlatformType.X;
          if (!twProfile.data?.id && !account.providerAccountId) {
            logger.error("Missing Twitter profile ID", { profile: twProfile });
            return '/settings/connections?error=missing_profile_id';
          }
          platformProfileId = twProfile.data?.id?.toString() ?? account.providerAccountId;
          platformUsername = twProfile.data?.username;
          break;
        default:
          logger.error(`NextAuth signIn: Unsupported provider: ${account.provider}`);
          return '/settings/connections?error=unsupported_provider';
      }

      if (!platformProfileId) {
          logger.error(`NextAuth signIn: Could not determine profile ID for ${account.provider}`);
          return '/settings/connections?error=profile_id_missing';
      }

      const expiresAt = account.expires_at ? new Date(account.expires_at * 1000) : null;

      const encryptedAccessToken = encryptToken(account.access_token);
      const encryptedRefreshToken = encryptToken(account.refresh_token);

      try {
        await prisma.platformConnection.upsert({
          where: {
             userId_platform: {
                 userId: dbUser.id,
                 platform: platform
             }
          },
          update: {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            profileId: platformProfileId,
            username: platformUsername,
            scopes: scopes,
            expiresAt: expiresAt,
            connectedAt: new Date(),
          },
          create: {
            userId: dbUser.id,
            platform: platform,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            profileId: platformProfileId,
            username: platformUsername,
            scopes: scopes,
            expiresAt: expiresAt,
          },
        });

        return '/settings/connections?success=true';

      } catch (error) {
        logger.error(`NextAuth signIn: Error saving platform connection for ${platform}:`, error);
        return '/settings/connections?error=db_error';
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.includes('/api/auth/callback/twitter')) {
        return baseUrl + '/settings/connections';
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  jwt: { maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: {
    signIn: '/sign-in',
    error: '/settings/connections',
  },
  logger: {
    error(code, metadata) {
      logger.error(`NextAuth Error [${code}]:`, metadata);
    },
    warn(code) {
      logger.info(`NextAuth Warning [${code}]`);
    },
    debug(code, metadata) {
      logger.debug(`NextAuth Debug [${code}]:`, metadata);
    },
  },
};

// Create the NextAuth handler
const nextAuthHandler = NextAuth(authOptions);

// Simplified request handlers
export async function GET(req: NextRequest, context: any) {
  try {
    const response = await nextAuthHandler(req, context);
    return response;
  } catch (error) {
    logger.error('Error in NextAuth handler:', error);
    return NextResponse.redirect(new URL('/settings/connections?error=auth_failed', req.url));
  }
}

export async function POST(req: NextRequest, context: any) {
  try {
    const response = await nextAuthHandler(req, context);
    return response;
  } catch (error) {
    logger.error('Error in NextAuth handler:', error);
    return NextResponse.redirect(new URL('/settings/connections?error=auth_failed', req.url));
  }
}