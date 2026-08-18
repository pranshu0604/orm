import NextAuth, { AuthOptions, Profile, Account, User } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { PlatformType } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { encryptToken } from "@/lib/encryption";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { publicActionLimiter, getClientIp } from "@/lib/rateLimit";

// signIn() callers set a callbackUrl cookie; use it to send onboarding-initiated
// connections back to /onboarding instead of always landing on /settings/connections.
async function getPostConnectRedirectBase(): Promise<string> {
  const cookieStore = await cookies();
  const callbackUrl =
    cookieStore.get('next-auth.callback-url')?.value ||
    cookieStore.get('__Secure-next-auth.callback-url')?.value ||
    '';
  return callbackUrl.includes('/onboarding') ? '/onboarding' : '/settings/connections';
}

// extend interfaces for expected custom profile structures
interface TwitterProfile extends Profile {
    data?: {
        id?: string;
        username?: string;
        name?: string;
    }
}

// global logger to debug auth flows
const logger = {
  debug: (message: string, data?: unknown) => {
    console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error);
    if (error instanceof Error) {
      console.error(`Stack: ${error.stack}`);
    }
  }
};

const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  providers: [
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
          } catch (error: unknown) {
            logger.error('Twitter token exchange error:', error);
            throw error;
          }
        }
      },
      userinfo: {
        url: "https://api.twitter.com/2/users/me",
        params: {
          "user.fields": "profile_image_url,name,username"
        },
        async request({ tokens }) {
          const url = new URL("https://api.twitter.com/2/users/me");
          url.searchParams.set("user.fields", "profile_image_url,name,username");
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const body = await res.text();
          if (!res.ok) {
            logger.error(`Twitter userinfo error (${res.status}):`, body);
            throw new Error(`Twitter userinfo request failed: ${res.status} ${body}`);
          }
          return JSON.parse(body);
        },
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
    async signIn({ user, account, profile }: { user: User, account: Account | null, profile?: Profile | TwitterProfile }) {
      logger.info(`SignIn callback started for provider: ${account?.provider}`, {
        userId: user?.id,
        accountId: account?.providerAccountId,
        hasProfile: !!profile
      });

      const redirectBase = await getPostConnectRedirectBase();

      if (!account || !profile) {
        logger.error("NextAuth signIn: Missing account or profile info.");
        return redirectBase + '?error=provider_data_missing';
      }

      const authData = await auth();
      const clerkId = authData.userId;

      if (!clerkId) {
        logger.error("NextAuth signIn: Clerk user ID not found. User must be logged in.");
        return '/sign-in?error=ClerkSessionNotFound';
      }

      logger.info(`Clerk authentication successful, userId: ${clerkId}`);

      let dbUser = await prisma.user.findUnique({ where: { clerkId } });
      if (!dbUser) {
        logger.info(`DB user not found for Clerk ID ${clerkId}. Attempting automatic sync/upsert from Clerk.`);
        try {
          const clerkUser = await clerkClient.users.getUser(clerkId);
          const email: string = clerkUser.emailAddresses?.[0]?.emailAddress || "";
          const name: string = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ");
          const image: string = clerkUser.imageUrl || "";

          dbUser = await prisma.user.upsert({
            where: { clerkId },
            update: { email, name, image },
            create: { clerkId, email, name, image },
          });

          logger.info(`Successfully upserted DB user for Clerk ID ${clerkId}`, { userId: dbUser.id });
        } catch (err) {
          logger.error(`Automatic sync failed for Clerk ID ${clerkId}:`, err);
          return redirectBase + '?error=db_user_not_found';
        }
      }

      logger.info(`Found database user: ${dbUser.id}`);

      if (account.provider !== "twitter") {
        logger.error(`NextAuth signIn: Unsupported provider: ${account.provider}`);
        return redirectBase + '?error=unsupported_provider';
      }

      const twProfile = profile as TwitterProfile;
      const platform: PlatformType = PlatformType.X;
      const scopes = account.scope || '';
      if (!twProfile.data?.id && !account.providerAccountId) {
        logger.error("Missing Twitter profile ID", { profile: twProfile });
        return redirectBase + '?error=missing_profile_id';
      }
      const platformProfileId = twProfile.data?.id?.toString() ?? account.providerAccountId;
      const platformUsername = twProfile.data?.username;

      if (!platformProfileId) {
          logger.error(`NextAuth signIn: Could not determine profile ID for ${account.provider}`);
          return redirectBase + '?error=profile_id_missing';
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

        return redirectBase + '?success=true';

      } catch (error: unknown) {
        logger.error(`NextAuth signIn: Error saving platform connection for ${platform}:`, error);
        return redirectBase + '?error=db_error';
      }
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  jwt: { maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: {
    // No dedicated /sign-in route exists (Clerk uses modal auth) — route NextAuth's
    // own error/sign-in redirects to a real page instead of 404ing.
    signIn: '/settings/connections',
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

// Only the OAuth-initiating and callback legs are worth rate limiting — session/csrf/providers
// reads happen on every page load and aren't an abuse vector.
function isRateLimitedPath(pathname: string): boolean {
  return pathname.includes('/api/auth/signin/') || pathname.includes('/api/auth/callback/');
}

// Simplified request handlers
export async function GET(req: NextRequest, context: unknown) {
  try {
    if (isRateLimitedPath(req.nextUrl.pathname)) {
      const { success } = await publicActionLimiter.limit(getClientIp(req));
      if (!success) {
        return NextResponse.redirect(new URL('/settings/connections?error=rate_limited', req.url));
      }
    }
    const response = await nextAuthHandler(req, context);
    return response;
  } catch (error) {
    logger.error('Error in NextAuth handler:', error);
    return NextResponse.redirect(new URL('/settings/connections?error=auth_failed', req.url));
  }
}

export async function POST(req: NextRequest, context: unknown) {
  try {
    if (isRateLimitedPath(req.nextUrl.pathname)) {
      const { success } = await publicActionLimiter.limit(getClientIp(req));
      if (!success) {
        return NextResponse.redirect(new URL('/settings/connections?error=rate_limited', req.url));
      }
    }
    const response = await nextAuthHandler(req, context);
    return response;
  } catch (error) {
    logger.error('Error in NextAuth handler:', error);
    return NextResponse.redirect(new URL('/settings/connections?error=auth_failed', req.url));
  }
}