import { launchChromium } from './launchChromium';
import type { PrismaClient } from '@prisma/client';
import { NITTER_USER_AGENT } from './constants';

export interface ScrapedTweet {
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

export interface ScrapedProfileStats {
  tweets?: number;
  following?: number;
  followers?: number;
  likes?: number;
}

function parseCompactNumber(value: string): number {
  const cleaned = value.replace(/,/g, '').trim();
  const match = cleaned.match(/([\d.]+)\s*([KMB])?/i);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  const suffix = match[2]?.toUpperCase();
  if (suffix === 'K') return Math.round(num * 1_000);
  if (suffix === 'M') return Math.round(num * 1_000_000);
  if (suffix === 'B') return Math.round(num * 1_000_000_000);
  return Math.round(num);
}

export async function scrapeProfileStatsForUser(
  username: string,
  nitterUrl: string
): Promise<ScrapedProfileStats> {
  const browser = await launchChromium();

  try {
    const context = await browser.newContext({ userAgent: NITTER_USER_AGENT });
    const page = await context.newPage();
    await page.goto(`${nitterUrl}/${username}`, { timeout: 30000 });
    await page.waitForSelector('.profile-card, .profile-card-tabs', { timeout: 10000 });

    const stats = await page.evaluate(() => {
      // esbuild (via tsx) injects `__name(fn, "fn")` calls for named functions; since this callback is
      // serialized via toString() and re-run inside the page's isolated realm, that global is missing there.
      (globalThis as unknown as { __name?: (fn: unknown, name?: string) => unknown }).__name ??= (fn) => fn;

      const parseStat = (label: string): number | undefined => {
        const tabsText = [
          document.querySelector('.profile-card')?.textContent || '',
          document.querySelector('.profile-card-tabs')?.textContent || '',
        ].join(' ');
        const valueBeforeLabel = new RegExp(`([\\d.,]+\\s*[KMB]?)\\s+${label}`, 'i');
        const labelBeforeValue = new RegExp(`${label}\\s+([\\d.,]+\\s*[KMB]?)`, 'i');
        const match = tabsText.match(labelBeforeValue) || tabsText.match(valueBeforeLabel);
        if (!match) return undefined;

        const cleaned = match[1].replace(/,/g, '').trim();
        const compact = cleaned.match(/([\d.]+)\s*([KMB])?/i);
        if (!compact) return undefined;
        const num = parseFloat(compact[1]);
        const suffix = compact[2]?.toUpperCase();
        if (suffix === 'K') return Math.round(num * 1000);
        if (suffix === 'M') return Math.round(num * 1000000);
        if (suffix === 'B') return Math.round(num * 1000000000);
        return Math.round(num);
      };

      return {
        tweets: parseStat('Tweets'),
        following: parseStat('Following'),
        followers: parseStat('Followers'),
        likes: parseStat('Likes'),
      };
    });

    await browser.close();

    return {
      tweets: stats.tweets ?? parseCompactNumber('0'),
      following: stats.following ?? parseCompactNumber('0'),
      followers: stats.followers ?? parseCompactNumber('0'),
      likes: stats.likes ?? parseCompactNumber('0'),
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

export async function scrapeTweetsForUser(
  username: string,
  nitterUrl: string,
  limit: number = 50
): Promise<ScrapedTweet[]> {
  const browser = await launchChromium();

  try {
    const context = await browser.newContext({ userAgent: NITTER_USER_AGENT });
    const page = await context.newPage();
    const profileUrl = `${nitterUrl}/${username}`;

    await page.goto(profileUrl, { timeout: 30000 });
    await page.waitForSelector('.timeline-item', { timeout: 10000 });

    const tweets = await page.evaluate((maxTweets) => {
      // esbuild (via tsx) injects `__name(fn, "fn")` calls for named functions; since this callback is
      // serialized via toString() and re-run inside the page's isolated realm, that global is missing there.
      (globalThis as unknown as { __name?: (fn: unknown, name?: string) => unknown }).__name ??= (fn) => fn;

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
          // Real tweet links always end in a "#m" fragment (e.g. "/user/status/123#m") — strip it, don't reject it.
          const tweetId = (tweetPath.split('/').pop() || '').split('#')[0];

          if (!tweetId) continue;

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

          const attachments = tweet.querySelector('.attachments');
          const hasMedia = attachments !== null;
          const mediaUrls: string[] = [];
          let videoDuration: string | undefined;

          if (hasMedia) {
            const images = attachments?.querySelectorAll('.still-image img');
            images?.forEach((img: Element) => {
              const src = img.getAttribute('src');
              if (src) mediaUrls.push(src);
            });

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
          // Nitter formats this as "Jul 8, 2026 · 4:30 PM UTC" — the "·" isn't parseable by Date().
          const dateTitle = (dateEl?.getAttribute('title') || '').replace('·', '');
          const parsedDate = dateTitle ? new Date(dateTitle) : null;
          const postedAt = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : new Date();

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

    return tweets.map((t) => ({
      ...t,
      postedAt: new Date(t.postedAt),
    }));
  } catch (error) {
    await browser.close();
    throw error;
  }
}

export async function storeTweetsInDatabase(
  prisma: PrismaClient,
  platformConnId: string,
  tweets: ScrapedTweet[],
  profileStats?: ScrapedProfileStats
): Promise<{ stored: number; updated: number }> {
  let stored = 0;
  let updated = 0;

  for (const tweet of tweets) {
    try {
      const existing = await prisma.post.findFirst({
        where: { platformConnId, postId: tweet.tweetId },
      });

      if (existing) {
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

  // Reaching here means the scrape itself succeeded (even if it found 0 new tweets) —
  // record that for the dashboard's "last scraped" status, independent of tweet count.
  await prisma.platformConnection.update({
    where: { id: platformConnId },
    data: {
      lastScrapedAt: new Date(),
      followerCount: profileStats?.followers,
      followingCount: profileStats?.following,
      tweetCount: profileStats?.tweets,
      likesCount: profileStats?.likes,
      profileMetricsUpdatedAt: profileStats ? new Date() : undefined,
    },
  });

  return { stored, updated };
}
