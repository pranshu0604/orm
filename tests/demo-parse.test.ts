import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseReport, parseSuggestions } from '../lib/demo-parse';

const metrics = {
  total_tweets: 10, avg_likes: 3.5, avg_retweets: 1, avg_replies: 0.5, engagement_rate: 2.1, follower_count: 100, following_count: 50,
};

test('parseReport keeps whitelisted fields and drops everything else', () => {
  const raw = JSON.stringify({
    id: 'internal-id', userId: 'user-1', email: 'a@b.com',
    overall_score: 71.4, relevance_score: 60, summary: 'ok', strengths: ['a', 3, 'b'], areas_for_improvement: ['c'],
    sentiment: { overall_sentiment: 'positive', sentiment_score: 0.3, top_keywords: ['x'], extra: 'no' },
    metrics,
  });
  const report = parseReport(raw);
  assert.ok(report);
  assert.equal(report.overall_score, 71);
  assert.deepEqual(report.strengths, ['a', 'b']);
  assert.deepEqual(report.metrics, metrics);
  assert.ok(!JSON.stringify(report).includes('internal-id'));
  assert.ok(!JSON.stringify(report).includes('a@b.com'));
});

test('parseReport rejects invalid input', () => {
  assert.equal(parseReport('not json'), null);
  assert.equal(parseReport('[]'), null);
  assert.equal(parseReport(JSON.stringify({ summary: 'no score' })), null);
});

test('parseReport tolerates missing sentiment/metrics', () => {
  const report = parseReport(JSON.stringify({ overall_score: 50, summary: 's', strengths: [], areas_for_improvement: [], metrics: { total_tweets: 1 } }));
  assert.ok(report);
  assert.equal(report.sentiment, null);
  assert.equal(report.metrics, null);
});

test('parseSuggestions handles the current shape and the legacy growth_strategy field', () => {
  const current = parseSuggestions(JSON.stringify({
    bio_suggestion: { suggested_bio: 'bio', reasoning: 'why' },
    tweet_suggestions: [{ content: 'hi', hashtags: ['a'], best_time_to_post: 'noon' }, { content: '' }],
    suggested_posting_volume: 'daily', accounts_to_follow: ['@x'], engagement_strategy: 'reply more',
  }));
  assert.ok(current);
  assert.equal(current.tweet_suggestions.length, 1);
  assert.equal(current.bio_suggestion?.suggested_bio, 'bio');

  const legacy = parseSuggestions(JSON.stringify({ growth_strategy: 'old field' }));
  assert.equal(legacy?.engagement_strategy, 'old field');
});

test('parseSuggestions returns null when there is nothing to show', () => {
  assert.equal(parseSuggestions(JSON.stringify({})), null);
  assert.equal(parseSuggestions('{'), null);
});
