import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { aiClient } from '@/lib/ai-client';
import { hasCreditAvailable, recordUsage, recordFailedUsage } from '@/lib/credits';
import { apiActionLimiter } from '@/lib/rateLimit';

/**
 * POST /api/suggestions/reply
 * Suggest a reply to a specific tweet, in the user's voice
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await apiActionLimiter.limit(userId);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const body = await req.json();
    const { platformConnectionId, tweetContext } = body;

    if (!platformConnectionId || !tweetContext?.trim()) {
      return NextResponse.json(
        { error: 'Platform connection ID and tweet content are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const canProceed = await hasCreditAvailable(user.id, user.tier, user.creditsRemaining, 'CONTENT_SUGGESTION');
    if (!canProceed) {
      return NextResponse.json(
        { error: 'Credit limit reached. Please upgrade or purchase more credits.' },
        { status: 403 }
      );
    }

    const platformConnection = await prisma.platformConnection.findUnique({
      where: { id: platformConnectionId },
    });
    if (!platformConnection || platformConnection.userId !== user.id) {
      return NextResponse.json({ error: 'Platform connection not found' }, { status: 404 });
    }
    if (platformConnection.platform !== 'X') {
      return NextResponse.json({ error: 'Invalid platform. Expected X/Twitter.' }, { status: 400 });
    }

    let suggestion;
    try {
      suggestion = await aiClient.generateReplySuggestion({
        tweetContext,
        userProfile: {
          username: platformConnection.username || 'Unknown',
          bio: platformConnection.platformAspiration || user.aspiration || '',
          role: platformConnection.platformRole || user.role || '',
        },
      });
    } catch (error) {
      console.error('AI Service Error:', error);
      await recordFailedUsage({
        userId: user.id,
        usageType: 'CONTENT_SUGGESTION',
        platformType: 'X',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }

    const savedSuggestion = await prisma.contentSuggestion.create({
      data: {
        userId: user.id,
        platformConnectionId,
        suggestionType: 'REPLY',
        content: JSON.stringify(suggestion),
        includedInContext: false,
      },
    });

    try {
      await recordUsage({ userId: user.id, tier: user.tier, usageType: 'CONTENT_SUGGESTION', platformType: 'X' });
    } catch (creditError) {
      await recordFailedUsage({
        userId: user.id,
        usageType: 'CONTENT_SUGGESTION',
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
      suggestion: { id: savedSuggestion.id, ...suggestion, generatedAt: savedSuggestion.generatedAt },
    });
  } catch (error) {
    console.error('Error generating reply suggestion:', error);
    return NextResponse.json({ error: 'Failed to generate reply suggestion. Please try again.' }, { status: 500 });
  }
}
