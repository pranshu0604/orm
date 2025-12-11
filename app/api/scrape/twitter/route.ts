import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { chromium } from 'playwright';
import { getWorkingNitter } from '@/lib/scrapers/getWorkingNitter';

/**
 * POST /api/scrape/twitter
 * Manually trigger Twitter data scraping for a specific platform connection
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

    const body = await req.json();
    const { platformConnectionId } = body;

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

    if (!platformConnection.username) {
      return NextResponse.json(
        { error: 'Username not found for this connection' },
        { status: 400 }
      );
    }

    // Get working Nitter instance
    const nitterUrl = await getWorkingNitter();

    // Scrape tweets
    const tweets = await scrapeTweetsForUser(
      platformConnection.username,
      nitterUrl,
      50
    );

    if (tweets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tweets found',
        tweetsScraped: 0,
        tweetsStored: 0,
      });
    }

    // Store in database
    let stored = 0;
    let updated = 0;

    for (const tweet of tweets) {
      const existing = await prisma.post.findFirst({
        where: {
          platformConnId: platformConnection.id,
          postId: tweet.tweetId,
        },
      });

      if (existing) {
        // Update metrics and metadata
        await prisma.metric.update({
          where: { postId: existing.id },
          data: {
            likes: tweet.likes,
            comments: tweet.replies,
            shares: tweet.retweets,
            views: tweet.views,
          },
        });

        await prisma.post.update({
          where: { id: existing.id },
          data: {
            isPinned: tweet.isPinned,
            isRetweet: tweet.isRetweet,
            isQuote: tweet.isQuote,
            hasMedia: tweet.hasMedia,
            mediaUrls: tweet.mediaUrls || [],
            videoDuration: tweet.videoDuration,
          },
        });
        updated++;
      } else {
        // Create new post
        await prisma.post.create({
          data: {
            platformConnId: platformConnection.id,
            postId: tweet.tweetId,
            url: tweet.url,
            content: tweet.content,
            postedAt: tweet.postedAt,
            isPinned: tweet.isPinned,
            isRetweet: tweet.isRetweet,
            isQuote: tweet.isQuote,
            hasMedia: tweet.hasMedia,
            mediaUrls: tweet.mediaUrls || [],
            videoDuration: tweet.videoDuration,
            metrics: {
              create: {
                likes: tweet.likes,
                comments: tweet.replies,
                shares: tweet.retweets,
                views: tweet.views,
              },
            },
          },
        });
        stored++;
      }
    }

    
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
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to scrape tweets
async function scrapeTweetsForUser(
  username: string,
  nitterUrl: string,
  limit: number = 50
) {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();
    const profileUrl = `${nitterUrl}/${username}`;

    await page.goto(profileUrl, { timeout: 30000 });
    await page.waitForSelector('.timeline-item', { timeout: 10000 });

    const tweets = await page.evaluate((maxTweets) => {
      const tweetElements = document.querySelectorAll('.timeline-item');
      const results: Array<{
        tweetId: string;
        content: string;
        likes: number;
        retweets: number;
        replies: number;
        views?: number;
        postedAt: string;
        url: string;
        isPinned: boolean;
        isRetweet: boolean;
        isQuote: boolean;
        hasMedia: boolean;
        mediaUrls?: string[];
        videoDuration?: string;
      }> = [];

      for (let i = 0; i < Math.min(tweetElements.length, maxTweets); i++) {
        const tweet = tweetElements[i];

        try {
          const tweetLink = tweet.querySelector('.tweet-link') as HTMLAnchorElement;
          const tweetPath = tweetLink?.getAttribute('href') || '';
          const tweetId = tweetPath.split('/').pop() || '';

          if (!tweetId || tweetId.includes('#')) continue;

          // Detect tweet types
          const isPinned = tweet.querySelector('.pinned') !== null;
          const isRetweet = tweet.querySelector('.retweet-header') !== null;
          const isQuote = tweet.querySelector('.quote') !== null;

          const contentEl = tweet.querySelector('.tweet-content');
          const content = contentEl?.textContent?.trim() || '';

          const getMetric = (iconClass: string): number => {
            const element = tweet.querySelector(`.icon-${iconClass}`)?.parentElement;
            const text = element?.textContent?.trim() || '0';
            if (text.includes('K')) return Math.floor(parseFloat(text) * 1000);
            if (text.includes('M')) return Math.floor(parseFloat(text) * 1000000);
            return parseInt(text.replace(/[^0-9]/g, '') || '0', 10);
          };

          const likes = getMetric('heart');
          const retweets = getMetric('retweet');
          const replies = getMetric('comment');
          const views = getMetric('views');

          // Extract media information
          const attachments = tweet.querySelector('.attachments');
          const hasMedia = attachments !== null;
          const mediaUrls: string[] = [];
          let videoDuration: string | undefined;

          if (hasMedia) {
            // Extract image URLs
            const images = attachments?.querySelectorAll('.still-image img');
            images?.forEach((img: Element) => {
              const src = img.getAttribute('src');
              if (src) mediaUrls.push(src);
            });

            // Extract video URL and duration
            const video = attachments?.querySelector('video source');
            if (video) {
              const videoSrc = video.getAttribute('src');
              if (videoSrc) mediaUrls.push(videoSrc);

              const durationEl = attachments?.querySelector('.overlay-duration');
              if (durationEl) {
                videoDuration = durationEl.textContent?.trim();
              }
            }
          }

          const dateEl = tweet.querySelector('.tweet-date a') as HTMLAnchorElement;
          const dateTitle = dateEl?.getAttribute('title') || '';
          const postedAt = dateTitle ? new Date(dateTitle) : new Date();

          results.push({
            tweetId,
            content,
            likes,
            retweets,
            replies,
            views: views > 0 ? views : undefined,
            postedAt: postedAt.toISOString(),
            url: `https://twitter.com${tweetPath}`,
            isPinned,
            isRetweet,
            isQuote,
            hasMedia,
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
            videoDuration,
          });
        } catch (err) {
          console.error('Error parsing tweet:', err);
        }
      }

      return results;
    }, limit);

    await browser.close();

    return tweets.map((t: { postedAt: string; tweetId: string; content: string; likes: number; retweets: number; replies: number; views?: number; url: string; isPinned: boolean; isRetweet: boolean; isQuote: boolean; hasMedia: boolean; mediaUrls?: string[]; videoDuration?: string }) => ({
      ...t,
      postedAt: new Date(t.postedAt),
    }));

  } catch (error) {
    await browser.close();
    throw error;
  }
}
