import { prisma } from './prisma';

export type NotablePost = {
  postId: string;
  content: string;
  postedAt: Date;
  likes: number;
  views: number;
  multiplier: number; // how many times the account's recent-post baseline this post's likes are
};

const BASELINE_SAMPLE_SIZE = 30;
const NOTABLE_MULTIPLIER = 2; // a post needs 2x the account's recent average likes to count as notable
const MIN_POSTS_FOR_BASELINE = 3;

async function getRecentPostsWithBaseline(connectionId: string) {
  const posts = await prisma.post.findMany({
    where: { platformConnId: connectionId },
    orderBy: { postedAt: 'desc' },
    take: BASELINE_SAMPLE_SIZE,
    include: { metrics: true },
  });

  const likesValues = posts.map((p) => p.metrics?.likes ?? 0);
  const baseline = likesValues.length ? likesValues.reduce((a, b) => a + b, 0) / likesValues.length : 0;

  return { posts, baseline };
}

/** Posts among the account's recent activity that meaningfully outperform its own baseline. */
export async function findNotablePosts(connectionId: string): Promise<NotablePost[]> {
  const { posts, baseline } = await getRecentPostsWithBaseline(connectionId);
  if (posts.length < MIN_POSTS_FOR_BASELINE || baseline <= 0) return [];

  return posts
    .map((post) => ({ post, likes: post.metrics?.likes ?? 0 }))
    .filter(({ likes }) => likes >= baseline * NOTABLE_MULTIPLIER)
    .map(({ post, likes }) => ({
      postId: post.id,
      content: post.content || '',
      postedAt: post.postedAt,
      likes,
      views: post.metrics?.views ?? 0,
      multiplier: Math.round((likes / baseline) * 10) / 10,
    }))
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, 5);
}

/** Notable posts not yet covered by a previous digest email, for cron-driven sending. */
export async function findUnnotifiedNotablePosts(
  connectionId: string
): Promise<{ posts: NotablePost[]; isFirstDigest: boolean }> {
  const connection = await prisma.platformConnection.findUnique({
    where: { id: connectionId },
    select: { lastDigestAt: true },
  });
  const notable = await findNotablePosts(connectionId);
  const sinceDate = connection?.lastDigestAt ?? null;
  const posts = sinceDate ? notable.filter((p) => p.postedAt > sinceDate) : notable;
  return { posts, isFirstDigest: sinceDate === null };
}

export async function markDigestSent(connectionId: string): Promise<void> {
  await prisma.platformConnection.update({
    where: { id: connectionId },
    data: { lastDigestAt: new Date() },
  });
}
