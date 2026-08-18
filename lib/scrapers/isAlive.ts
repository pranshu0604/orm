import axios from "axios";
import { JSDOM } from "jsdom";
import { NITTER_USER_AGENT } from "./constants";

// Check if a Nitter instance is alive and working
export async function isAlive(url: string): Promise<boolean> {
  // Prefer Playwright (handles JS-rendered instances), falling back to a plain HTTP check.
  try {
    const mod = await import('playwright');
    const browser = await mod.chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: NITTER_USER_AGENT,
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    const testUrl = `${url}/jack`;
    const response = await page.goto(testUrl, { timeout: 10000 });
    if (!response || response.status() !== 200) {
      await context.close();
      await browser.close();
      return false;
    }
    try {
      await page.waitForSelector('.timeline-item', { timeout: 5000 });
      const tweetCount = await page.evaluate(() => document.querySelectorAll('.timeline-item').length);
      await context.close();
      await browser.close();
      return tweetCount > 0;
    } catch {
      await context.close();
      await browser.close();
      return false;
    }
  } catch {
    // If Playwright fails for any reason, fall back to HTTP check
  }

  // HTTP-based check
  try {
    const testUrl = `${url}/jack`;
    const res = await axios.get(testUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': NITTER_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (res.status !== 200) return false;
    const html = res.data as string;
    const dom = new JSDOM(html);
    const list = dom.window.document.querySelectorAll('.timeline-item');
    return list.length > 0;
  } catch {
    return false;
  }
}