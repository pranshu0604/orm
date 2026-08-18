/**
 * AI Service Client
 * Communicates with the FastAPI AI service for reports and suggestions
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

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
export type PlatformType = 'X';

class AIServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = AI_SERVICE_URL;
  }

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
    const response = await fetch(`${this.baseUrl}/v1/reports/twitter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_data: params.userData,
        posts_data: params.postsData,
        target_tier: params.targetTier,
        previous_reports: params.previousReports,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(`AI Service Error: ${error.detail || response.statusText}`);
    }

    return response.json();
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
    const response = await fetch(`${this.baseUrl}/v1/suggestions/twitter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_data: params.userData,
        target_tier: params.targetTier,
        based_on_report: params.basedOnReport,
        custom_prompt: params.customPrompt,
        previous_suggestions: params.previousSuggestions,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(`AI Service Error: ${error.detail || response.statusText}`);
    }

    return response.json();
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
    const response = await fetch(`${this.baseUrl}/v1/suggestions/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tweet_context: params.tweetContext,
        user_profile: params.userProfile,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(`AI Service Error: ${error.detail || response.statusText}`);
    }

    return response.json();
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
    const response = await fetch(`${this.baseUrl}/v1/custom-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        custom_prompt: params.customPrompt,
        platform_type: params.platformType,
        user_context: params.userContext,
        previous_reports: params.previousReports,
        previous_suggestions: params.previousSuggestions,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(`AI Service Error: ${error.detail || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; service: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/v1/health`);

    if (!response.ok) {
      throw new Error('AI Service is not responding');
    }

    return response.json();
  }
}

// Export singleton instance
export const aiClient = new AIServiceClient();
