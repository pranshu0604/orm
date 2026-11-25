// Pure helpers that turn stored report/suggestion JSON into a small, whitelisted public shape.
// Anything not listed here (ids, free-form extras) is dropped, so stored rows can't leak through /demo.

export type DemoMetrics = {
  total_tweets: number;
  avg_likes: number;
  avg_retweets: number;
  avg_replies: number;
  engagement_rate: number;
  follower_count: number;
  following_count: number;
};

export type DemoReport = {
  overall_score: number;
  relevance_score: number | null;
  summary: string;
  strengths: string[];
  areas_for_improvement: string[];
  sentiment: { overall_sentiment: string; sentiment_score: number; top_keywords: string[] } | null;
  metrics: DemoMetrics | null;
};

export type DemoSuggestions = {
  bio_suggestion: { suggested_bio: string; reasoning: string } | null;
  tweet_suggestions: { content: string; hashtags: string[]; best_time_to_post: string }[];
  suggested_posting_volume: string;
  accounts_to_follow: string[];
  engagement_strategy: string;
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const str = (v: unknown, max = 600): string => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const strList = (v: unknown, maxItems = 8, maxLen = 400): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, maxItems).map((x) => x.slice(0, maxLen)) : [];

function parseJson(raw: string): Record<string, unknown> | null {
  try {
    return asRecord(JSON.parse(raw));
  } catch {
    return null;
  }
}

function parseMetrics(v: unknown): DemoMetrics | null {
  const m = asRecord(v);
  if (!m) return null;
  const fields = ['total_tweets', 'avg_likes', 'avg_retweets', 'avg_replies', 'engagement_rate', 'follower_count', 'following_count'] as const;
  const out: Partial<DemoMetrics> = {};
  for (const f of fields) {
    const n = num(m[f]);
    if (n === null) return null;
    out[f] = n;
  }
  return out as DemoMetrics;
}

export function parseReport(raw: string): DemoReport | null {
  const r = parseJson(raw);
  const overall = r && num(r.overall_score);
  if (!r || overall === null || overall === undefined) return null;
  const sentiment = asRecord(r.sentiment);
  const sentimentScore = sentiment ? num(sentiment.sentiment_score) : null;
  return {
    overall_score: Math.round(overall),
    relevance_score: num(r.relevance_score),
    summary: str(r.summary, 1200),
    strengths: strList(r.strengths),
    areas_for_improvement: strList(r.areas_for_improvement),
    sentiment:
      sentiment && sentimentScore !== null
        ? { overall_sentiment: str(sentiment.overall_sentiment, 20), sentiment_score: sentimentScore, top_keywords: strList(sentiment.top_keywords, 8, 40) }
        : null,
    metrics: parseMetrics(r.metrics),
  };
}

export function parseSuggestions(raw: string): DemoSuggestions | null {
  const s = parseJson(raw);
  if (!s) return null;
  const bio = asRecord(s.bio_suggestion);
  const tweets = Array.isArray(s.tweet_suggestions) ? s.tweet_suggestions : [];
  const result: DemoSuggestions = {
    bio_suggestion: bio && str(bio.suggested_bio) ? { suggested_bio: str(bio.suggested_bio, 200), reasoning: str(bio.reasoning, 600) } : null,
    tweet_suggestions: tweets
      .map(asRecord)
      .filter((t): t is Record<string, unknown> => t !== null && str(t.content).length > 0)
      .slice(0, 5)
      .map((t) => ({ content: str(t.content, 300), hashtags: strList(t.hashtags, 5, 40), best_time_to_post: str(t.best_time_to_post, 80) })),
    suggested_posting_volume: str(s.suggested_posting_volume, 200),
    accounts_to_follow: strList(s.accounts_to_follow, 8, 40),
    engagement_strategy: str(s.engagement_strategy ?? s.growth_strategy, 1200),
  };
  const empty = !result.bio_suggestion && result.tweet_suggestions.length === 0 && !result.engagement_strategy;
  return empty ? null : result;
}
