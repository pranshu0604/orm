import axios from "axios";
import { JSDOM } from "jsdom";

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

// For development: browser instance cache
let browserInstance: any = null;

// For development: Get browser instance
async function getBrowser(): Promise<any> {
  if (playwright && !browserInstance) {
    browserInstance = await playwright.chromium.launch({ headless: true });
  }
  return browserInstance;
}

// Close browser instance when done with scraping (development only)
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    console.log('Browser instance closed');
  }
}

// Check if a Nitter instance is alive and working
export async function isAlive(url: string): Promise<boolean> {
  // In development, use Playwright if available
  if (playwright && process.env.NODE_ENV === 'development') {
    return isAliveBrowser(url);
  }
  
  // In production, use HTTP requests
  return isAliveHttp(url);
}

// Browser-based check (development)
async function isAliveBrowser(url: string): Promise<boolean> {
  if (!playwright) return isAliveHttp(url);
  
  let browser: any = null;
  
  try {
    // Get or create browser instance
    browser = await getBrowser();
    
    // Create a new context with a realistic user agent
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 }
    });
    
    // Create a new page
    const page = await context.newPage();
    
    // Set reasonable timeout
    const testUrl = `${url}/jack`; // test with Jack's profile
    
    // Navigate to the test URL
    const response = await page.goto(testUrl, { timeout: 10000 });
    
    // Check for successful response
    if (!response || response.status() !== 200) {
      console.warn(`[❌ isAlive] ${url} responded with status ${response?.status() || 'unknown'}`);
      await context.close();
      return false;
    }
    
    // Wait for and check for tweets
    try {
      // Try to find at least one tweet within a reasonable timeout
      await page.waitForSelector('.timeline-item', { timeout: 5000 });
      
      // Count the tweets found
      const tweetCount = await page.evaluate(() => 
        document.querySelectorAll('.timeline-item').length
      );
      
      if (tweetCount === 0) {
        console.warn(`[❌ isAlive] ${url} responded with 200 but no tweets found on /jack`);
        await context.close();
        return false;
      }
      
      console.log(`[✅ isAlive] ${url} is alive and showing ${tweetCount} tweets.`);
      await context.close();
      return true;
    } catch (error) {
      console.warn(`[❌ isAlive] ${url} responded but tweets not found: ${error instanceof Error ? error.message : String(error)}`);
      await context.close();
      return false;
    }
  } catch (err: any) {
    console.error(`[🔥 isAlive] ${url} threw error: ${err.message}`);
    return false;
  }
}

// HTTP-based check (production)
async function isAliveHttp(url: string): Promise<boolean> {
  try {
    const testUrl = `${url}/jack`; // test with Jack's profile
    
    // Use a more realistic browser-like request
    const res = await axios.get(testUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
      },
    });

    if (res.status !== 200) {
      console.warn(`[❌ isAlive] ${url} responded with status ${res.status}`);
      return false;
    }

    const html = res.data as string;

    // Sanity check with JSDOM
    const dom = new JSDOM(html);
    const tweetList = dom.window.document.querySelectorAll(".timeline-item");

    if (tweetList.length === 0) {
      console.warn(`[❌ isAlive] ${url} responded with 200 but no tweets found on /jack`);
      return false;
    }

    console.log(`[✅ isAlive] ${url} is alive and showing ${tweetList.length} tweets.`);
    return true;
  } catch (err: any) {
    console.error(`[🔥 isAlive] ${url} threw error: ${err.message}`);
    return false;
  }
}