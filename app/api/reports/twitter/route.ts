import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { aiClient } from '@/lib/ai-client';
import { hasCreditAvailable, recordUsage, recordFailedUsage } from '@/lib/credits';
import { apiActionLimiter } from '@/lib/rateLimit';

/**
 * POST /api/reports/twitter
 * Generate a Twitter/X performance report
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
    const { platformConnectionId } = body;

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

    // Check if user has credits (free tier limits or purchased credits)
    const canProceed = await hasCreditAvailable(
      user.id,
      user.tier,
      user.creditsRemaining,
      'PERFORMANCE_REPORT'
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
      include: {
        posts: {
          include: {
            metrics: true,
            sentiment: true,
          },
          orderBy: { postedAt: 'desc' },
          take: 50, // Last 50 posts
        },
      },
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

    // Get previous reports for context
    const previousReports = await prisma.performanceReport.findMany({
      where: {
        userId: user.id,
        platformConnectionId,
        includedInContext: true,
      },
      orderBy: { generatedAt: 'desc' },
      take: 3, // Last 3 reports for context
      select: { content: true },
    });

    // Prepare data for AI service
    const userData = {
      username: platformConnection.username || 'Unknown',
      bio: platformConnection.platformAspiration || user.aspiration || '',
      followers: 0, // You'll need to fetch this from actual Twitter data
      following: 0,
    };

    const postsData = platformConnection.posts.map(post => ({
      content: post.content || '',
      likes: post.metrics?.likes || 0,
      retweets: post.metrics?.shares || 0, // shares = retweets for Twitter
      replies: post.metrics?.comments || 0,
      views: post.metrics?.views ?? undefined,
      isPinned: post.isPinned ?? undefined,
      isRetweet: post.isRetweet ?? undefined,
      isQuote: post.isQuote ?? undefined,
      hasMedia: post.hasMedia ?? undefined,
    }));

    // Call AI service
    let report;
    let errorMessage: string | undefined;

    try {
      report = await aiClient.generateTwitterReport({
        userData,
        postsData,
        targetTier: platformConnection.targetTier,
        previousReports: previousReports.map(r => r.content),
      });
    } catch (error) {
      console.error('AI Service Error:', error);
      errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed usage (doesn't count toward limits)
      await recordFailedUsage({
        userId: user.id,
        usageType: 'PERFORMANCE_REPORT',
        platformType: 'X',
        errorMessage,
      });

      throw error;
    }

    // Save report to database
    const savedReport = await prisma.performanceReport.create({
      data: {
        userId: user.id,
        platformConnectionId,
        content: JSON.stringify(report),
        score: report.overall_score,
        metrics: report.metrics as never, // Store as JSON
        includedInContext: true,
      },
    });

    // Log usage and atomically deduct credits if paid user. The report is already
    // generated at this point, so a lost credit race still needs a clean 403 + audit trail.
    try {
      await recordUsage({
        userId: user.id,
        tier: user.tier,
        usageType: 'PERFORMANCE_REPORT',
        platformType: 'X',
      });
    } catch (creditError) {
      await recordFailedUsage({
        userId: user.id,
        usageType: 'PERFORMANCE_REPORT',
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
      report: {
        id: savedReport.id,
        ...report,
        generatedAt: savedReport.generatedAt,
      },
    });

  } catch (error) {
    console.error('Error generating Twitter report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/twitter?platformConnectionId=xxx
 * Get Twitter/X performance reports for a platform connection
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

    // Get reports
    const reports = await prisma.performanceReport.findMany({
      where: {
        userId: user.id,
        platformConnectionId,
      },
      orderBy: { generatedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      reports: reports.map(report => ({
        id: report.id,
        content: JSON.parse(report.content),
        score: report.score,
        generatedAt: report.generatedAt,
      })),
    });

  } catch (error) {
    console.error('Error fetching Twitter reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
