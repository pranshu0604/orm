/**
 * Twitter Data Scraper using Nitter
 * Scrapes tweets for all connected Twitter accounts and stores in database
 *
 * Usage:
 *   ts-node scripts/scrape-twitter-data.ts
 *   or
 *   npm run scrape:twitter
 */

import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { getWorkingNitter } from '../lib/scrapers/getWorkingNitter';

const prisma = new PrismaClient();

interface ScrapedTweet {
  tweetId: string;
  content: string;
  likes: number;
  retweets: number;
  replies: number;
  views?: number;
  postedAt: Date;
  url: string;
  isPinned?: boolean;
  isRetweet?: boolean;
  isQuote?: boolean;
  hasMedia?: boolean;
  mediaUrls?: string[];
  videoDuration?: string;
}

async function scrapeTweetsForUser(
  username: string,
  nitterUrl: string,
  limit: number = 50
): Promise<ScrapedTweet[]> {
  console.log(`📡 Scraping tweets for @${username} from ${nitterUrl}`);

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // Visit user's Nitter profile
    const profileUrl = `${nitterUrl}/${username}`;
    await page.goto(profileUrl, { timeout: 30000 });

    // Wait for tweets to load
    await page.waitForSelector('.timeline-item', { timeout: 10000 });

    // Extract tweet data
    const tweets = await page.evaluate((maxTweets) => {
      const tweetElements = document.querySelectorAll('.timeline-item');
      const results: any[] = [];

      for (let i = 0; i < Math.min(tweetElements.length, maxTweets); i++) {
        const tweet = tweetElements[i];

        try {
          // Extract tweet ID from link
          const tweetLink = tweet.querySelector('.tweet-link') as HTMLAnchorElement;
          const tweetPath = tweetLink?.getAttribute('href') || '';
          const tweetId = tweetPath.split('/').pop() || '';

          if (!tweetId || tweetId.includes('#')) continue;

          // Detect tweet types
          const isPinned = tweet.querySelector('.pinned') !== null;
          const isRetweet = tweet.querySelector('.retweet-header') !== null;
          const isQuote = tweet.querySelector('.quote') !== null;

          // Extract content
          const contentEl = tweet.querySelector('.tweet-content');
          const content = contentEl?.textContent?.trim() || '';

          // Extract metrics
          const getMetric = (iconClass: string): number => {
            const element = tweet.querySelector(`.icon-${iconClass}`)?.parentElement;
            const text = element?.textContent?.trim() || '0';
            // Handle K, M suffixes
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
            images?.forEach((img: any) => {
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

          // Extract timestamp
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

    console.log(`✅ Scraped ${tweets.length} tweets for @${username}`);
    return tweets.map(t => ({
      ...t,
      postedAt: new Date(t.postedAt),
    }));

  } catch (error) {
    await browser.close();
    console.error(`❌ Error scraping @${username}:`, error);
    throw error;
  }
}

async function storeTweetsInDatabase(
  platformConnId: string,
  tweets: ScrapedTweet[]
): Promise<void> {
  console.log(`💾 Storing ${tweets.length} tweets in database...`);

  let stored = 0;
  let skipped = 0;

  for (const tweet of tweets) {
    try {
      // Check if tweet already exists
      const existing = await prisma.post.findFirst({
        where: {
          platformConnId,
          postId: tweet.tweetId,
        },
      });

      if (existing) {
        // Update metrics and metadata if they changed
        await prisma.metric.update({
          where: { postId: existing.id },
          data: {
            likes: tweet.likes,
            comments: tweet.replies,
            shares: tweet.retweets,
            views: tweet.views,
          },
        });

        // Update post metadata
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
        skipped++;
      } else {
        // Create new post
        await prisma.post.create({
          data: {
            platformConnId,
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
    } catch (error) {
      console.error(`Error storing tweet ${tweet.tweetId}:`, error);
    }
  }

  console.log(`✅ Stored: ${stored} new, Updated: ${skipped} existing tweets`);
}

async function main() {
  console.log('🚀 Starting Twitter data scraping...\n');

  try {
    // Get working Nitter instance
    const nitterUrl = await getWorkingNitter();
    console.log(`✅ Using Nitter instance: ${nitterUrl}\n`);

    // Fetch all Twitter platform connections
    const connections = await prisma.platformConnection.findMany({
      where: {
        platform: 'X',
        setupCompleted: true,
      },
      select: {
        id: true,
        username: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (connections.length === 0) {
      console.log('ℹ️  No Twitter accounts connected yet.');
      return;
    }

    console.log(`📊 Found ${connections.length} Twitter account(s) to scrape\n`);

    // Scrape each account
    for (const conn of connections) {
      if (!conn.username) {
        console.log(`⚠️  Skipping connection ${conn.id} - no username found`);
        continue;
      }

      try {
        console.log(`\n📱 Processing @${conn.username} (${conn.user.email})`);

        // Scrape tweets
        const tweets = await scrapeTweetsForUser(conn.username, nitterUrl, 50);

        if (tweets.length === 0) {
          console.log(`⚠️  No tweets found for @${conn.username}`);
          continue;
        }

        // Store in database
        await storeTweetsInDatabase(conn.id, tweets);

      } catch (error) {
        console.error(`❌ Failed to process @${conn.username}:`, error);
        // Continue with next account
      }

      // Small delay between accounts to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✅ Twitter scraping completed successfully!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { scrapeTweetsForUser, storeTweetsInDatabase };
