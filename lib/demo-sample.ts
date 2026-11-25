import type { DemoSnapshot } from './demo-data';

// Clearly synthetic: shown only when the live demo account can't be read.
export const SAMPLE_SNAPSHOT: DemoSnapshot = {
  source: 'sample',
  handle: 'sample_dev',
  targetTier: 'INTERMEDIATE',
  followerCount: 1240,
  followingCount: 310,
  postsTracked: 30,
  lastScrapedAt: null,
  chartPosts: Array.from({ length: 12 }, (_, i) => ({
    postedAt: new Date(Date.UTC(2026, 0, 1 + i * 3)).toISOString(),
    likes: [8, 12, 5, 31, 9, 14, 7, 22, 11, 6, 18, 25][i],
    views: [420, 610, 300, 1900, 480, 750, 390, 1200, 560, 330, 900, 1400][i],
    shares: [1, 2, 0, 6, 1, 2, 1, 4, 2, 0, 3, 5][i],
    comments: [0, 1, 0, 4, 1, 2, 0, 3, 1, 0, 2, 3][i],
  })),
  report: {
    generatedAt: null,
    data: {
      overall_score: 68,
      relevance_score: 72,
      summary:
        'Sample data: a steady posting cadence with a few outlier posts carrying most of the engagement. Replies are rare, which caps conversation depth.',
      strengths: ['Consistent posting rhythm', 'Technical posts with concrete examples outperform generic ones', 'Clear niche'],
      areas_for_improvement: ['Ask questions that invite replies', 'Pin a post that explains what you build', 'Reply to larger accounts in the niche'],
      sentiment: { overall_sentiment: 'positive', sentiment_score: 0.42, top_keywords: ['python', 'ai', 'build'] },
      metrics: {
        total_tweets: 30,
        avg_likes: 13.2,
        avg_retweets: 2.1,
        avg_replies: 1.4,
        engagement_rate: 2.9,
        follower_count: 1240,
        following_count: 310,
      },
    },
  },
  suggestions: {
    generatedAt: null,
    data: {
      bio_suggestion: { suggested_bio: 'Building small AI tools in public. Python, FastAPI, Next.js.', reasoning: 'States what you build and the stack in one line.' },
      tweet_suggestions: [
        { content: 'Shipped a tiny eval harness today: 10 synthetic profiles, one command, honest numbers. What would you test first?', hashtags: ['buildinpublic'], best_time_to_post: 'Weekdays, mid-morning' },
      ],
      suggested_posting_volume: '4-5 posts per week',
      accounts_to_follow: [],
      engagement_strategy: 'Pair each project update with one concrete question so readers have an easy way to reply.',
    },
  },
};
