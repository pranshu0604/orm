import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { findNotablePosts } from '@/lib/digest';
import { getSystemStatus } from '@/lib/systemStatus';
import DashboardView from './dashboard/_components/DashboardView';
import HomeLanding from './_components/HomeLanding';

const FREE_LIMITS = { PERFORMANCE_REPORT: 10, CONTENT_SUGGESTION: 20 } as const;
const ACTIVITY_FEED_SIZE = 8;

export default async function Home() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return <HomeLanding />;

  let dbUser = await prisma.user.findUnique({ where: { clerkId } });

  // The Clerk webhook usually creates this row, but don't strand a first-time
  // visitor if the webhook hasn't fired yet (e.g. local dev without a tunnel).
  if (!dbUser) {
    const clerkUser = await currentUser();
    dbUser = await prisma.user.create({
      data: {
        clerkId,
        email: clerkUser?.emailAddresses[0]?.emailAddress || '',
        name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' '),
        image: clerkUser?.imageUrl || '',
      },
    });
  }

  if (!dbUser.onboardingCompleted) redirect('/onboarding');

  const [connections, reportsUsed, suggestionsUsed, totalReports, totalSuggestions, recentReports, recentSuggestions, systemStatus] =
    await Promise.all([
      prisma.platformConnection.findMany({
        where: { userId: dbUser.id },
        select: {
          id: true,
          platform: true,
          username: true,
          setupCompleted: true,
          targetTier: true,
          lastScrapedAt: true,
          _count: { select: { posts: true } },
          posts: {
            orderBy: { postedAt: 'desc' },
            take: 30,
            select: {
              postedAt: true,
              metrics: { select: { likes: true, views: true, shares: true, comments: true } },
            },
          },
        },
        orderBy: { platform: 'asc' },
      }),
      prisma.usageHistory.count({
        where: { userId: dbUser.id, usageType: 'PERFORMANCE_REPORT', successful: true },
      }),
      prisma.usageHistory.count({
        where: { userId: dbUser.id, usageType: 'CONTENT_SUGGESTION', successful: true },
      }),
      prisma.performanceReport.count({ where: { userId: dbUser.id } }),
      prisma.contentSuggestion.count({ where: { userId: dbUser.id } }),
      prisma.performanceReport.findMany({
        where: { userId: dbUser.id },
        orderBy: { generatedAt: 'desc' },
        take: ACTIVITY_FEED_SIZE,
        select: { id: true, generatedAt: true, score: true, platformConnection: { select: { username: true } } },
      }),
      prisma.contentSuggestion.findMany({
        where: { userId: dbUser.id },
        orderBy: { generatedAt: 'desc' },
        take: ACTIVITY_FEED_SIZE,
        select: {
          id: true,
          generatedAt: true,
          suggestionType: true,
          platformConnection: { select: { username: true } },
        },
      }),
      getSystemStatus(),
    ]);

  const notablePostsByConnection = Object.fromEntries(
    await Promise.all(connections.map(async (c) => [c.id, await findNotablePosts(c.id)] as const))
  );

  const notableActivityItems = Object.values(notablePostsByConnection)
    .flat()
    .map((p) => ({
      id: p.postId,
      type: 'notable' as const,
      timestamp: p.postedAt,
      summary: p.content || 'Untitled post',
      meta: `${p.multiplier}x baseline`,
    }));

  const activityItems = [
    ...recentReports.map((r) => ({
      id: r.id,
      type: 'report' as const,
      timestamp: r.generatedAt,
      summary: `Performance report generated for @${r.platformConnection.username || 'account'}`,
      meta: `score ${r.score}`,
    })),
    ...recentSuggestions.map((s) => ({
      id: s.id,
      type: 'suggestion' as const,
      timestamp: s.generatedAt,
      summary: `${s.suggestionType.toLowerCase()} suggestion generated for @${s.platformConnection.username || 'account'}`,
      meta: undefined,
    })),
    ...notableActivityItems,
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, ACTIVITY_FEED_SIZE);

  const totalPostsTracked = connections.reduce((sum, c) => sum + c._count.posts, 0);
  const lastScrapedAt = connections.reduce<Date | null>((latest, c) => {
    if (!c.lastScrapedAt) return latest;
    return !latest || c.lastScrapedAt > latest ? c.lastScrapedAt : latest;
  }, null);
  const latestScores = recentReports.slice(0, connections.length).map((r) => r.score);
  const avgScore = latestScores.length ? Math.round(latestScores.reduce((a, b) => a + b, 0) / latestScores.length) : null;

  return (
    <DashboardView
      tier={dbUser.tier}
      creditsRemaining={dbUser.creditsRemaining}
      freeReportsRemaining={Math.max(0, FREE_LIMITS.PERFORMANCE_REPORT - reportsUsed)}
      freeSuggestionsRemaining={Math.max(0, FREE_LIMITS.CONTENT_SUGGESTION - suggestionsUsed)}
      connections={connections}
      lifetimeStats={{
        totalPostsTracked,
        totalReports,
        totalSuggestions,
        avgScore,
      }}
      systemStatus={systemStatus}
      lastScrapedAt={lastScrapedAt}
      activityItems={activityItems}
    />
  );
}
