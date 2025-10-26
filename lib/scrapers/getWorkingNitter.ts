import { isAlive } from './isAlive';

const CACHE_KEY = 'nitter:base_url';
const CACHE_TTL_SECONDS = 60 * 60 * 8; // 8 hours

const KNOWN_INSTANCES: { url: string; uptime: number }[] = [
  { url: 'https://nitter.net', uptime: 91 },
  { url: 'https://nitter.space', uptime: 97 },
  { url: 'https://nitter.privacyredirect.com', uptime: 96 },
  { url: 'https://lightbrd.com', uptime: 95 },
  { url: 'https://nitter.poast.org', uptime: 83 },
  { url: 'https://xcancel.com', uptime: 99 },
];

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
  if (process.env.NODE_ENV === 'development') {
    try {
      const playwright = await import('playwright');
      const browser = await playwright.chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();
      await page.goto('https://status.d420.de/', { timeout: 30000 });
      await page.waitForSelector('table tr', { timeout: 5000 });
      const instances = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tr')).slice(1);
        const valid: { url: string; uptime: number }[] = [];
        for (const row of rows) {
          const tds = row.querySelectorAll('td');
          const instance = tds[0]?.textContent?.trim() ?? '';
          const healthy = tds[2]?.textContent?.trim();
          const uptimeStr = tds[4]?.textContent?.trim() ?? '0%';
          const uptime = parseInt(uptimeStr.replace('%', ''), 10) || 0;
          if (healthy === '✅' && uptime >= 80) valid.push({ url: `https://${instance}`, uptime });
        }
        valid.sort((a, b) => b.uptime - a.uptime);
        return valid.map(i => i.url);
      });
      await browser.close();
      if (instances && instances.length) return instances;
    } catch {
      // fall back to known list
    }
  }

  return KNOWN_INSTANCES.filter(i => i.uptime >= 80).sort((a, b) => b.uptime - a.uptime).map(i => i.url);
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