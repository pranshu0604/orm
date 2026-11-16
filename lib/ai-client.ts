/**
 * AI Service Client
 * Communicates with the FastAPI AI service for reports and suggestions
 */

import 'server-only';

export class AIServiceError extends Error {}

async function requestAI<T>(path: string, body: object): Promise<T> {
  const token = process.env.AI_SERVICE_TOKEN;
  const url = process.env.AI_SERVICE_URL;
  if (!url || !token || token.length < 32) {
    throw new AIServiceError('The AI service is not configured.');
  }

  let endpoint: URL;
  try {
    endpoint = new URL(path, url);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname);
    if (endpoint.protocol !== 'https:' && !(loopback && endpoint.protocol === 'http:')) {
      throw new Error('Invalid scheme');
    }
  } catch {
    throw new AIServiceError('The AI service address is invalid.');
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(90_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('AI service request failed:', error instanceof Error ? error.name : 'Unknown error');
    throw new AIServiceError('The AI service is unavailable. If it is waking up, wait a minute and try again.');
  }
}

export interface TwitterMetrics {
  total_tweets: number;
  avg_likes: number;
  avg_retweets: number;
  avg_replies: number;
  engagement_rate: number;
  follower_count: number;
  following_count: number;
}

export interface SentimentAnalysis {
  overall_sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  top_keywords: string[];
}

export interface TwitterPerformanceReport {
  metrics: TwitterMetrics;
  sentiment: SentimentAnalysis;
  relevance_score: number;
  overall_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  summary: string;
}

export interface GitHubMetrics {
  total_commits: number;
  total_prs: number;
  total_issues: number;
  total_stars: number;
  total_forks: number;
  follower_count: number;
  following_count: number;
  active_repos: number;
  contribution_streak: number;
}

export interface GitHubPerformanceReport {
  metrics: GitHubMetrics;
  overall_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  top_languages: string[];
  activity_pattern: string;
  summary: string;
}

export interface TwitterBioSuggestion {
  suggested_bio: string;
  reasoning: string;
}

export interface TweetSuggestion {
  content: string;
  hashtags: string[];
  best_time_to_post: string;
}

export interface TwitterContentSuggestions {
  bio_suggestion?: TwitterBioSuggestion;
  tweet_suggestions: TweetSuggestion[];
  suggested_posting_volume: string;
  accounts_to_follow: string[];
  engagement_strategy: string;
}

export interface GitHubBioSuggestion {
  suggested_bio: string;
  reasoning: string;
}

export interface CommitSuggestion {
  focus_area: string;
  specific_suggestion: string;
  example: string;
}

export interface PRSuggestion {
  focus_area: string;
  specific_suggestion: string;
  example: string;
}

export interface IssueSuggestion {
  suggestion_type: 'create' | 'participate' | 'organize';
  specific_suggestion: string;
  impact: string;
}

export interface GitHubContentSuggestions {
  bio_suggestion?: GitHubBioSuggestion;
  commit_suggestions: CommitSuggestion[];
  pr_suggestions: PRSuggestion[];
  issue_suggestions: IssueSuggestion[];
  accounts_to_follow: string[];
  recommended_projects: string[];
  growth_strategy: string;
}

export interface ReplySuggestion {
  original_tweet_context: string;
  suggested_reply: string;
  reasoning: string;
}

export interface CustomPromptResponse {
  response: string;
  context_used: string[];
  confidence_score: number;
}

export type TargetTier = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type PlatformType = 'X' | 'GITHUB';

class AIServiceClient {
  /**
   * Generate Twitter/X performance report
   */
  async generateTwitterReport(params: {
    userData: {
      username: string;
      bio?: string;
      followers: number;
      following: number;
    };
    postsData: Array<{
      content?: string;
      likes: number;
      retweets: number;
      replies: number;
      views?: number;
      isPinned?: boolean;
      isRetweet?: boolean;
      isQuote?: boolean;
      hasMedia?: boolean;
    }>;
    targetTier: TargetTier;
    previousReports?: string[];
  }): Promise<TwitterPerformanceReport> {
    return requestAI('/v1/reports/twitter', {
      user_data: params.userData,
      posts_data: params.postsData,
      target_tier: params.targetTier,
      previous_reports: params.previousReports,
    });
  }

  /**
   * Generate GitHub performance report
   */
  async generateGitHubReport(params: {
    userData: {
      username: string;
      bio?: string;
      followers: number;
      following: number;
      public_repos: number;
      total_commits: number;
      total_prs: number;
      total_issues: number;
    };
    reposData: Array<{
      name: string;
      description?: string;
      stars: number;
      language?: string;
    }>;
    targetTier: TargetTier;
    previousReports?: string[];
  }): Promise<GitHubPerformanceReport> {
    return requestAI('/v1/reports/github', {
      user_data: params.userData,
      repos_data: params.reposData,
      target_tier: params.targetTier,
      previous_reports: params.previousReports,
    });
  }

  /**
   * Generate Twitter content suggestions
   */
  async generateTwitterSuggestions(params: {
    userData: {
      username: string;
      bio?: string;
      role_aspiration?: string;
    };
    targetTier: TargetTier;
    basedOnReport?: string;
    customPrompt?: string;
    previousSuggestions?: string[];
  }): Promise<TwitterContentSuggestions> {
    return requestAI('/v1/suggestions/twitter', {
      user_data: params.userData,
      target_tier: params.targetTier,
      based_on_report: params.basedOnReport,
      custom_prompt: params.customPrompt,
      previous_suggestions: params.previousSuggestions,
    });
  }

  /**
   * Generate GitHub content suggestions
   */
  async generateGitHubSuggestions(params: {
    userData: {
      username: string;
      bio?: string;
      role_aspiration?: string;
    };
    targetTier: TargetTier;
    basedOnReport?: string;
    customPrompt?: string;
    previousSuggestions?: string[];
  }): Promise<GitHubContentSuggestions> {
    return requestAI('/v1/suggestions/github', {
      user_data: params.userData,
      target_tier: params.targetTier,
      based_on_report: params.basedOnReport,
      custom_prompt: params.customPrompt,
      previous_suggestions: params.previousSuggestions,
    });
  }

  /**
   * Generate reply suggestion for a tweet
   */
  async generateReplySuggestion(params: {
    tweetContext: string;
    userProfile: {
      username: string;
      bio?: string;
      role?: string;
    };
  }): Promise<ReplySuggestion> {
    return requestAI('/v1/suggestions/reply', {
      tweet_context: params.tweetContext,
      user_profile: params.userProfile,
    });
  }

  /**
   * Generate custom prompt response (paid feature)
   */
  async generateCustomResponse(params: {
    customPrompt: string;
    platformType: PlatformType;
    userContext: {
      username: string;
      role_aspiration?: string;
    };
    previousReports?: string[];
    previousSuggestions?: string[];
  }): Promise<CustomPromptResponse> {
    return requestAI('/v1/custom-prompt', {
      custom_prompt: params.customPrompt,
      platform_type: params.platformType,
      user_context: params.userContext,
      previous_reports: params.previousReports,
      previous_suggestions: params.previousSuggestions,
    });
  }

}

// Export singleton instance
export const aiClient = new AIServiceClient();
