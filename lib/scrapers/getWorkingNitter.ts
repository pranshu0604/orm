import { isAlive } from './isAlive';
import { KNOWN_NITTER_INSTANCES, NITTER_USER_AGENT } from './constants';

const CACHE_KEY = 'nitter:base_url';
const CACHE_TTL_SECONDS = 60 * 60 * 8; // 8 hours

async function getRedisClient() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  try {
    const mod = await import('@upstash/redis');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Redis = (mod as any).Redis;
    return new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
  } catch {
    return null;
  }
}

async function getFromCache(): Promise<string | null> {
  const client = await getRedisClient();
  if (!client) return null;
  try {
    const val = await client.get(CACHE_KEY);
    return val ?? null;
  } catch {
    return null;
  }
}

async function updateCache(url: string): Promise<void> {
  const client = await getRedisClient();
  if (!client) return;
  try {
    await client.set(CACHE_KEY, url, { ex: CACHE_TTL_SECONDS });
  } catch {
    // ignore cache write failures
  }
}

async function getAllHealthyInstances(): Promise<string[]> {
  // Live-discover instances from the status page; the tweet-scraping path already
  // depends on Playwright in every environment, so there's no reason to gate this to dev.
  try {
    const playwright = await import('playwright');
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent: NITTER_USER_AGENT });
    const page = await context.newPage();
    await page.goto('https://status.d420.de/', { timeout: 30000 });
    await page.waitForSelector('table tr', { timeout: 5000 });
    const instances = await page.evaluate(() => {
      // status.d420.de columns: [0] domain, [1] region, [2] up-flag, [3] history,
      // [4] response time, [5] uptime %, [6] search-works flag, [7] version, [8] connectivity, [9] score.
      const rows = Array.from(document.querySelectorAll('table tr')).slice(1);
      const valid: { url: string; uptime: number }[] = [];
      for (const row of rows) {
        const tds = row.querySelectorAll('td');
        const instance = tds[0]?.textContent?.trim() ?? '';
        const searchWorks = tds[6]?.textContent?.trim();
        const uptimeStr = tds[5]?.textContent?.trim() ?? '0%';
        const uptime = parseInt(uptimeStr.replace('%', ''), 10) || 0;
        if (searchWorks === '✅' && uptime >= 80) valid.push({ url: `https://${instance}`, uptime });
      }
      valid.sort((a, b) => b.uptime - a.uptime);
      return valid.map(i => i.url);
    });
    await browser.close();
    if (instances && instances.length) return instances;
  } catch {
    // fall back to known list
  }

  return KNOWN_NITTER_INSTANCES.filter(i => i.uptime >= 80).sort((a, b) => b.uptime - a.uptime).map(i => i.url);
}

async function findWorkingNitter(instances?: string[]): Promise<string> {
  const list = instances ?? (await getAllHealthyInstances());
  if (!list.length) throw new Error('No Nitter instances available');
  for (const candidate of list) {
    try {
      if (await isAlive(candidate)) return candidate;
    } catch {
      // try the next one
    }
  }
  throw new Error('No reachable Nitter instances');
}

export async function getWorkingNitter(): Promise<string> {
  try {
    const cached = await getFromCache();
    if (cached) {
      try {
        if (await isAlive(cached)) return cached;
      } catch {
        // ignore cached failure
      }
    }

    const working = await findWorkingNitter();
    await updateCache(working);
    return working;
  } catch {
    const fallbacks = ['https://nitter.privacyredirect.com', 'https://nitter.space', 'https://xcancel.com'];
    for (const f of fallbacks) {
      try {
        if (await isAlive(f)) return f;
      } catch {
        // ignore
      }
    }
    return 'https://nitter.privacyredirect.com';
  }
}