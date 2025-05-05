import NextAuth, { AuthOptions, Profile, Account, User } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import TwitterProvider from "next-auth/providers/twitter";
import { PrismaClient, PlatformType } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { encryptToken } from "@/lib/encryption";

const prisma = new PrismaClient();

// Define interfaces for expected profile structures
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

export const authOptions: AuthOptions = {
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
        params: {
          scope: "users.read",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user: User, account: Account | null, profile?: Profile | GitHubProfile | TwitterProfile }) {
      if (!account || !profile) {
        console.error("NextAuth signIn: Missing account or profile info.");
        return '/settings/connections?error=provider_data_missing';
      }

      const authData = await auth();
      const clerkId = authData.userId;

      if (!clerkId) {
        console.error("NextAuth signIn: Clerk user ID not found. User must be logged in.");
        return '/sign-in?error=ClerkSessionNotFound';
      }

      const dbUser = await prisma.user.findUnique({ where: { clerkId } });
      if (!dbUser) {
        console.error(`NextAuth signIn: DB User not found for Clerk ID: ${clerkId}. Sync issue?`);
        return '/settings/connections?error=db_user_not_found';
      }

      let platform: PlatformType;
      let platformProfileId: string | undefined;
      let platformUsername: string | undefined;
      let scopes = account.scope;

      switch (account.provider) {
        case "github":
          const ghProfile = profile as GitHubProfile;
          platform = PlatformType.GITHUB;
          platformProfileId = ghProfile.id?.toString() ?? account.providerAccountId;
          platformUsername = ghProfile.login;
          break;
        case "twitter":
          const twProfile = profile as TwitterProfile;
          platform = PlatformType.X;
          platformProfileId = twProfile.data?.id?.toString() ?? account.providerAccountId;
          platformUsername = twProfile.data?.username;
          break;
        default:
          console.error(`NextAuth signIn: Unsupported provider: ${account.provider}`);
          return '/settings/connections?error=unsupported_provider';
      }

      if (!platformProfileId) {
          console.error(`NextAuth signIn: Could not determine profile ID for ${account.provider}`);
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

        console.log(`Successfully connected ${platform} for user ${dbUser.id} (Profile ID: ${platformProfileId}, Username: ${platformUsername})`);
        return '/settings/connections?success=true';

      } catch (error) {
        console.error(`NextAuth signIn: Error saving platform connection for ${platform}:`, error);
        if (error instanceof Error) {
            console.error("Prisma Error Details:", (error as any).code, (error as any).meta);
        }
        return '/settings/connections?error=db_error';
      }
    },
  },
  session: { strategy: "jwt", maxAge: 0 },
  jwt: { maxAge: 0 },
  pages: {
    signIn: '/sign-in',
    error: '/settings/connections',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };