import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getWorkingNitter } from '@/lib/scrapers/getWorkingNitter';
import { scrapeTweetsForUser, storeTweetsInDatabase } from '@/lib/scrapers/scrapeTweets';
import { apiActionLimiter } from '@/lib/rateLimit';

/**
 * POST /api/scrape/twitter
 * Manually trigger Twitter data scraping for a specific platform connection
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
    const { platformConnectionId } = body;

    if (!platformConnectionId) {
      return NextResponse.json(
        { error: 'Platform connection ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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

    if (!platformConnection.username) {
      return NextResponse.json(
        { error: 'Username not found for this connection' },
        { status: 400 }
      );
    }

    const nitterUrl = await getWorkingNitter();
    const tweets = await scrapeTweetsForUser(platformConnection.username, nitterUrl, 50);

    if (tweets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tweets found',
        tweetsScraped: 0,
        tweetsStored: 0,
      });
    }

    const { stored, updated } = await storeTweetsInDatabase(
      prisma,
      platformConnection.id,
      tweets
    );

    return NextResponse.json({
      success: true,
      message: 'Twitter data scraped successfully',
      tweetsScraped: tweets.length,
      tweetsStored: stored,
      tweetsUpdated: updated,
      nitterInstance: nitterUrl,
    });
  } catch (error) {
    console.error('Error scraping Twitter data:', error);
    return NextResponse.json(
      {
        error: 'Failed to scrape Twitter data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
