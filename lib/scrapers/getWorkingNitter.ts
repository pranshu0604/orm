import axios from "axios";
import { JSDOM } from "jsdom";
import { isAlive } from "./isAlive";

// Conditional import for Redis
let Redis: any = null;
try {
  Redis = require('@upstash/redis').Redis;
} catch (e) {
  console.warn('Redis not available, will use only fallback mechanisms');
}

// In development, conditionally import Playwright
let playwright: typeof import('playwright') | null = null;

// Only in development environment, load the playwright module
if (process.env.NODE_ENV === 'development') {
  try {
    // Dynamic import for Playwright (only in development)
    playwright = require('playwright');
  } catch (e) {
    console.warn('Playwright not available, falling back to HTTP requests');
  }
}

// Redis cache key and TTL
const CACHE_KEY = "nitter:base_url";
const CACHE_TTL_SECONDS = 60 * 60 * 8; // 8 hours

// Hardcoded list of known Nitter instances from the status page
// This serves as a fallback if the status page scraping doesn't work
const KNOWN_INSTANCES = [
  { url: "https://nitter.net", uptime: 91 },
  { url: "https://nitter.space", uptime: 97 },
  { url: "https://nitter.privacyredirect.com", uptime: 96 },
  { url: "https://lightbrd.com", uptime: 95 },
  { url: "https://nitter.poast.org", uptime: 83 },
  { url: "https://xcancel.com", uptime: 99 }
];

// Connect to Redis if credentials are available
function getRedisClient() {
  if (!Redis || !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.log("[Cache] Redis not available or credentials missing in .env, skipping cache");
    return null;
  }
  
  console.log("[Cache] Connecting to Redis...");
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

async function getFromCache(): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  
  try {
    const cachedBaseUrl = await redis.get(CACHE_KEY);
    if (cachedBaseUrl) {
      console.log(`[Cache] Found cached Nitter base URL: ${cachedBaseUrl}`);
      return cachedBaseUrl as string;
    }
  } catch (error) {
    console.error(`[Cache] Error retrieving from Redis: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return null;
}

async function updateCache(url: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  
  try {
    await redis.set(CACHE_KEY, url, { ex: CACHE_TTL_SECONDS });
    console.log(`[Cache] Updated Redis cache with: ${url}`);
  } catch (error) {
    console.error(`[Cache] Error updating Redis: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function getAllHealthyInstances(): Promise<string[]> {
  // In development, use browser-based scraping if available
  if (playwright && process.env.NODE_ENV === 'development') {
    return getAllHealthyInstancesBrowser();
  }
  
  // In production, use the hardcoded list - our GitHub Action will update Redis directly
  console.log("Production mode: Using hardcoded Nitter instances");
  const validInstances = KNOWN_INSTANCES.filter(i => i.uptime >= 80)
                                       .sort((a, b) => b.uptime - a.uptime);
  return validInstances.map(i => i.url);
}

// Browser-based instance fetching (development only)
async function getAllHealthyInstancesBrowser(): Promise<string[]> {
  if (!playwright) return KNOWN_INSTANCES.filter(i => i.uptime >= 80)
                                        .sort((a, b) => b.uptime - a.uptime)
                                        .map(i => i.url);
  
  try {
    // Launch a headless browser
    const browser = await playwright.chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      });
      
      // Create a new page
      const page = await context.newPage();
      
      // Navigate to the status page
      await page.goto('https://status.d420.de/', { timeout: 30000 });
      
      // Wait for the table to be loaded
      await page.waitForSelector('table tr', { timeout: 5000 });
      
      // Extract data from the table
      const instances = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tr')).slice(1);
        const valid: { url: string; uptime: number }[] = [];
        
        for (const row of rows) {
          const tds = row.querySelectorAll('td');
          const instance = tds[0]?.textContent?.trim() ?? '';
          const healthy = tds[2]?.textContent?.trim();
          const uptimeStr = tds[4]?.textContent?.trim() ?? '0%';
          const uptime = parseInt(uptimeStr.replace('%', ''));
          
          if (healthy === '✅' && uptime >= 80) {
            valid.push({ url: `https://${instance}`, uptime });
          }
        }
        
        valid.sort((a, b) => b.uptime - a.uptime);
        return valid.map(i => i.url);
      });
      
      await browser.close();
      return instances;
    } catch (e) {
      await browser.close();
      throw e;
    }
  } catch (error) {
    console.warn(`Error fetching Nitter instances from status page: ${error instanceof Error ? error.message : String(error)}`);
    console.warn('Using fallback hardcoded list of Nitter instances');
    
    // Return the hardcoded list if scraping fails
    const validInstances = KNOWN_INSTANCES.filter(i => i.uptime >= 80)
                                         .sort((a, b) => b.uptime - a.uptime);
    return validInstances.map(i => i.url);
  }
}

// Recursive search for first valid instance
async function findWorkingNitter(instances?: string[]): Promise<string> {
  if (!instances) instances = await getAllHealthyInstances();
  if (instances.length === 0) throw new Error("No Nitter instances left.");

  const [current, ...rest] = instances;

  const alive = await isAlive(current);
  if (alive) return current;

  return findWorkingNitter(rest); // recursion
}

// Main exported function
export async function getWorkingNitter(): Promise<string> {
  try {
    // First, try to get from cache
    const startTime = Date.now();
    const cachedUrl = await getFromCache();
    if (cachedUrl) {
      console.log(`[Nitter] Found cached instance: ${cachedUrl}, checking if still alive`);
      
      // Verify the cached instance still works
      const isWorking = await isAlive(cachedUrl);
      if (isWorking) {
        console.log(`[Nitter] Cached instance ${cachedUrl} is working (${Date.now() - startTime}ms)`);
        return cachedUrl;
      }
      console.log(`[Nitter] Cached Nitter instance ${cachedUrl} is no longer working, finding a new one...`);
    } else {
      console.log(`[Nitter] No cached instance found or error retrieving from cache`);
    }
    
    // If no cache or cached instance is not working, find a new one
    console.log(`[Nitter] Finding a working instance from all available instances`);
    const workingInstance = await findWorkingNitter();
    
    // Update cache for future use
    console.log(`[Nitter] Found working instance: ${workingInstance}, updating cache`);
    await updateCache(workingInstance);
    
    // Calculate and log elapsed time
    const totalTime = Date.now() - startTime;
    console.log(`[Nitter] Successfully found working instance in ${totalTime}ms: ${workingInstance}`);
    
    return workingInstance;
  } catch (error) {
    console.error(`[Nitter] Error: ${error instanceof Error ? error.message : String(error)}`);
    
    // Ultimate fallback: try known reliable instances
    const fallbackInstances = [
      "https://nitter.privacyredirect.com",
      "https://nitter.space",
      "https://xcancel.com"
    ];
    
    for (const fallbackUrl of fallbackInstances) {
      try {
        console.log(`[Nitter] Trying fallback instance: ${fallbackUrl}`);
        const isWorking = await isAlive(fallbackUrl);
        if (isWorking) {
          console.log(`[Nitter] Fallback instance is working: ${fallbackUrl}`);
          // Don't update cache for fallbacks to force a retry next time
          return fallbackUrl;
        }
      } catch (e) {
        console.error(`[Nitter] Error with fallback ${fallbackUrl}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    
    // If all fallbacks fail, use a hardcoded instance
    console.warn(`[Nitter] All fallbacks failed, using hardcoded instance`);
    return "https://nitter.privacyredirect.com";
  }
}