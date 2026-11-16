import NextAuth, { type AuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import TwitterProvider from 'next-auth/providers/twitter';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { isDemoOwner } from '@/lib/demo-access';
import { prisma } from '@/lib/prisma';

function getAuthOptions(): AuthOptions {
  const providers: AuthOptions['providers'] = [];
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push(GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: { params: { scope: 'read:user' } },
      checks: ['state'],
      userinfo: {
        url: 'https://api.github.com/user',
        request: ({ client, tokens }) => client.userinfo(tokens.access_token!),
      },
    }));
  }
  if (process.env.NODE_ENV === 'development' && process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET) {
    providers.push(TwitterProvider({
      clientId: process.env.TWITTER_API_KEY,
      clientSecret: process.env.TWITTER_API_SECRET,
      version: '2.0',
    }));
  }

  return {
    secret: process.env.NEXTAUTH_SECRET,
    providers,
    session: { strategy: 'jwt' },
    pages: { signIn: '/settings/connections', error: '/settings/connections' },
    logger: {
      error(code) { console.error('OAuth failed:', code); },
      warn(code) { console.warn('OAuth warning:', code); },
      debug() {},
    },
    callbacks: {
      async signIn({ account, profile }) {
        const { userId } = await auth();
        if (!userId || !isDemoOwner(userId) || !account || !profile) return false;
        const platform = account.provider === 'github' ? 'GITHUB' : account.provider === 'twitter' ? 'X' : null;
        if (!platform || !account.providerAccountId) return false;
        const providerProfile = profile as { login?: string; data?: { username?: string } };
        const username = platform === 'GITHUB' ? providerProfile.login : providerProfile.data?.username;
        if (!username) return false;
        if (platform === 'GITHUB' && username.toLowerCase() !== process.env.DEMO_OWNER_GITHUB_LOGIN?.toLowerCase()) {
          return false;
        }

        let user = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!user) {
          const clerkUser = await (await clerkClient()).users.getUser(userId);
          const email = clerkUser.primaryEmailAddress;
          if (!email || email.verification?.status !== 'verified') return false;
          user = await prisma.user.upsert({
            where: { clerkId: userId },
            create: { clerkId: userId, email: email.emailAddress },
            update: {},
          });
        }

        // Reports use public profile data. No OAuth credentials need to be stored.
        const identity = { profileId: account.providerAccountId, username };
        await prisma.platformConnection.upsert({
          where: { userId_platform: { userId: user.id, platform } },
          update: { ...identity, connectedAt: new Date(), accessToken: null, refreshToken: null },
          create: { ...identity, userId: user.id, platform },
        });
        return true;
      },
    },
  };
}

async function handler(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDemoOwner(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!process.env.NEXTAUTH_SECRET || !process.env.NEXTAUTH_URL) {
    return NextResponse.json({ error: 'OAuth is not configured' }, { status: 503 });
  }
  return NextAuth(getAuthOptions())(req, { params: await context.params });
}

export { handler as GET, handler as POST };
