import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { aiClient } from '@/lib/ai-client';
import { hasCreditAvailable, recordUsage, recordFailedUsage } from '@/lib/credits';
import { apiActionLimiter } from '@/lib/rateLimit';

/**
 * POST /api/suggestions/twitter
 * Generate Twitter/X content suggestions
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { success } = await apiActionLimiter.limit(userId);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { platformConnectionId, basedOnReportId, customPrompt } = body;

    if (!platformConnectionId) {
      return NextResponse.json(
        { error: 'Platform connection ID is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if custom prompt is used (paid feature)
    if (customPrompt && user.tier === 'FREE') {
      return NextResponse.json(
        { error: 'Custom prompts are a paid feature' },
        { status: 403 }
      );
    }

    // Check credits
    const canProceed = await hasCreditAvailable(
      user.id,
      user.tier,
      user.creditsRemaining,
      'CONTENT_SUGGESTION'
    );
    if (!canProceed) {
      return NextResponse.json(
        { error: 'Credit limit reached. Please upgrade or purchase more credits.' },
        { status: 403 }
      );
    }

    // Get platform connection
    const platformConnection = await prisma.platformConnection.findUnique({
      where: { id: platformConnectionId },
    });

    if (!platformConnection || platformConnection.userId !== user.id) {
      return NextResponse.json(
        { error: 'Platform connection not found' },
        { status: 404 }
      );
    }

    if (platformConnection.platform !== 'X') {
      return NextResponse.json(
        { error: 'Invalid platform. Expected X/Twitter.' },
        { status: 400 }
      );
    }

    // Get the performance report if specified
    let basedOnReport: string | undefined;
    if (basedOnReportId) {
      const report = await prisma.performanceReport.findUnique({
        where: { id: basedOnReportId },
      });

      if (report && report.userId === user.id) {
        basedOnReport = report.content;
      }
    }

    // Get previous suggestions for context
    const previousSuggestions = await prisma.contentSuggestion.findMany({
      where: {
        userId: user.id,
        platformConnectionId,
        includedInContext: true,
      },
      orderBy: { generatedAt: 'desc' },
      take: 3,
      select: { content: true },
    });

    // Prepare data for AI service
    const userData = {
      username: platformConnection.username || 'Unknown',
      bio: platformConnection.platformAspiration || user.aspiration || '',
      role_aspiration: platformConnection.platformRole || user.role || '',
    };

    // Call AI service
    let suggestions;
    let errorMessage: string | undefined;

    try {
      suggestions = await aiClient.generateTwitterSuggestions({
        userData,
        targetTier: platformConnection.targetTier,
        basedOnReport,
        customPrompt,
        previousSuggestions: previousSuggestions.map(s => s.content),
      });
    } catch (error) {
      console.error('AI Service Error:', error);
      errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed usage
      await recordFailedUsage({
        userId: user.id,
        usageType: customPrompt ? 'CUSTOM_PROMPT' : 'CONTENT_SUGGESTION',
        platformType: 'X',
        errorMessage,
      });

      throw error;
    }

    // Save suggestions to database
    const savedSuggestion = await prisma.contentSuggestion.create({
      data: {
        userId: user.id,
        platformConnectionId,
        suggestionType: 'TWEET', // Primary type
        content: JSON.stringify(suggestions),
        customPrompt,
        basedOnReportId,
        includedInContext: true,
      },
    });

    // Log usage and atomically deduct credits if paid user. The suggestion is already
    // generated at this point, so a lost credit race still needs a clean 403 + audit trail.
    try {
      await recordUsage({
        userId: user.id,
        tier: user.tier,
        usageType: customPrompt ? 'CUSTOM_PROMPT' : 'CONTENT_SUGGESTION',
        platformType: 'X',
      });
    } catch (creditError) {
      await recordFailedUsage({
        userId: user.id,
        usageType: customPrompt ? 'CUSTOM_PROMPT' : 'CONTENT_SUGGESTION',
        platformType: 'X',
        errorMessage: creditError instanceof Error ? creditError.message : 'Credit deduction failed',
      });
      return NextResponse.json(
        { error: 'No credits remaining. Please purchase more credits.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      suggestion: {
        id: savedSuggestion.id,
        ...suggestions,
        generatedAt: savedSuggestion.generatedAt,
      },
    });

  } catch (error) {
    console.error('Error generating Twitter suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/suggestions/twitter?platformConnectionId=xxx
 * Get Twitter/X content suggestions for a platform connection
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const platformConnectionId = searchParams.get('platformConnectionId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!platformConnectionId) {
      return NextResponse.json(
        { error: 'Platform connection ID is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get suggestions
    const suggestions = await prisma.contentSuggestion.findMany({
      where: {
        userId: user.id,
        platformConnectionId,
      },
      orderBy: { generatedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      suggestions: suggestions.map(suggestion => ({
        id: suggestion.id,
        type: suggestion.suggestionType,
        content: JSON.parse(suggestion.content),
        generatedAt: suggestion.generatedAt,
      })),
    });

  } catch (error) {
    console.error('Error fetching Twitter suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
