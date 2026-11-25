import 'server-only';
import { prisma } from './prisma';
import { parseReport, parseSuggestions, type DemoReport, type DemoSuggestions } from './demo-parse';
import { SAMPLE_SNAPSHOT } from './demo-sample';

export type DemoSnapshot = {
  source: 'live' | 'sample';
  handle: string;
  targetTier: string;
  followerCount: number | null;
  followingCount: number | null;
  postsTracked: number;
  lastScrapedAt: string | null;
  chartPosts: { postedAt: string; likes: number; views: number; shares: number; comments: number }[];
  report: { generatedAt: string | null; data: DemoReport } | null;
  suggestions: { generatedAt: string | null; data: DemoSuggestions } | null;
};

const QUERY_TIMEOUT_MS = 8000;

async function readLiveSnapshot(ownerClerkId: string): Promise<DemoSnapshot | null> {
  const owner = await prisma.user.findUnique({ where: { clerkId: ownerClerkId }, select: { id: true } });
  if (!owner) return null;

  const connection = await prisma.platformConnection.findUnique({
    where: { userId_platform: { userId: owner.id, platform: 'X' } },
    select: {
      id: true,
      username: true,
      targetTier: true,
      followerCount: true,
      followingCount: true,
      lastScrapedAt: true,
      _count: { select: { posts: true } },
      posts: {
        orderBy: { postedAt: 'desc' },
        take: 30,
        select: { postedAt: true, metrics: { select: { likes: true, views: true, shares: true, comments: true } } },
      },
    },
  });
  if (!connection?.username) return null;

  const [reportRow, suggestionRow] = await Promise.all([
    prisma.performanceReport.findFirst({
      where: { platformConnectionId: connection.id },
      orderBy: { generatedAt: 'desc' },
      select: { content: true, generatedAt: true },
    }),
    prisma.contentSuggestion.findFirst({
      where: { platformConnectionId: connection.id, customPrompt: null },
      orderBy: { generatedAt: 'desc' },
      select: { content: true, generatedAt: true },
    }),
  ]);

  const report = reportRow ? parseReport(reportRow.content) : null;
  const suggestions = suggestionRow ? parseSuggestions(suggestionRow.content) : null;
  if (!report && !suggestions) return null;

  return {
    source: 'live',
    handle: connection.username,
    targetTier: connection.targetTier,
    followerCount: connection.followerCount,
    followingCount: connection.followingCount,
    postsTracked: connection._count.posts,
    lastScrapedAt: connection.lastScrapedAt?.toISOString() ?? null,
    chartPosts: connection.posts.map((p) => ({
      postedAt: p.postedAt.toISOString(),
      likes: p.metrics?.likes ?? 0,
      views: p.metrics?.views ?? 0,
      shares: p.metrics?.shares ?? 0,
      comments: p.metrics?.comments ?? 0,
    })),
    report: report && reportRow ? { generatedAt: reportRow.generatedAt.toISOString(), data: report } : null,
    suggestions: suggestions && suggestionRow ? { generatedAt: suggestionRow.generatedAt.toISOString(), data: suggestions } : null,
  };
}

/** Read-only snapshot of the demo owner's latest stored output; falls back to labelled sample data. */
export async function getDemoSnapshot(): Promise<DemoSnapshot> {
  const ownerClerkId = process.env.DEMO_OWNER_CLERK_USER_ID;
  if (!ownerClerkId || !process.env.DATABASE_URL) return SAMPLE_SNAPSHOT;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const live = await Promise.race([
      readLiveSnapshot(ownerClerkId),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), QUERY_TIMEOUT_MS);
      }),
    ]);
    return live ?? SAMPLE_SNAPSHOT;
  } catch (error) {
    console.warn('Demo snapshot unavailable:', error instanceof Error ? error.name : 'Unknown error');
    return SAMPLE_SNAPSHOT;
  } finally {
    clearTimeout(timer);
  }
}
