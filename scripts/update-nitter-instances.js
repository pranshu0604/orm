// scripts/update-nitter-instances.js
require('dotenv').config(); // Load environment variables from .env file

const { chromium } = require('playwright');
const { Redis } = require('@upstash/redis');

// Hardcoded list of known Nitter instances as fallback
const KNOWN_INSTANCES = [
  { url: "https://nitter.net", uptime: 91 },
  { url: "https://nitter.space", uptime: 97 },
  { url: "https://nitter.privacyredirect.com", uptime: 96 },
  { url: "https://lightbrd.com", uptime: 95 },
  { url: "https://nitter.poast.org", uptime: 83 },
  { url: "https://xcancel.com", uptime: 99 },
  { url: "https://nitter.tieboetter.com", uptime: 10 }
];

const CACHE_KEY = "nitter:base_url";
const CACHE_TTL_SECONDS = 60 * 60 * 8; // 8 hours (longer than the GitHub Action frequency)

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function isAlive(browser, url) {
  console.log(`Testing if ${url} is alive...`);
  
  try {
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
      console.log(`[❌] ${url} responded with status ${response?.status() || 'unknown'}`);
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
        console.log(`[❌] ${url} responded with 200 but no tweets found on /jack`);
        await context.close();
        return false;
      }
      
      console.log(`[✅] ${url} is alive and showing ${tweetCount} tweets.`);
      await context.close();
      return true;
    } catch (error) {
      console.log(`[❌] ${url} responded but tweets not found: ${error instanceof Error ? error.message : String(error)}`);
      await context.close();
      return false;
    }
  } catch (err) {
    console.error(`[🔥] ${url} threw error: ${err.message}`);
    return false;
  }
}

async function getAllHealthyInstances(browser) {
  try {
    // Create a new context
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
      const valid = [];
      
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
    
    await context.close();
    return instances;
  } catch (error) {
    console.warn(`Error fetching Nitter instances from status page: ${error instanceof Error ? error.message : String(error)}`);
    console.warn('Using fallback hardcoded list of Nitter instances');
    
    // Return the hardcoded list if scraping fails
    const validInstances = KNOWN_INSTANCES.filter(i => i.uptime >= 80)
                                       .sort((a, b) => b.uptime - a.uptime);
    return validInstances.map(i => i.url);
  }
}

// Find a working Nitter instance
async function getWorkingNitter(browser, instances) {
  if (!instances || instances.length === 0) {
    instances = await getAllHealthyInstances(browser);
  }
  
  if (instances.length === 0) {
    throw new Error("No Nitter instances left.");
  }

  const [current, ...rest] = instances;

  const alive = await isAlive(browser, current);
  if (alive) return current;

  // Try the next one
  return getWorkingNitter(browser, rest);
}

async function main() {
  console.log("Starting Nitter instance update...");
  
  // Set overall timeout for the process
  const mainTimeout = setTimeout(() => {
    console.error("Process timed out after 5 minutes");
    process.exit(1);
  }, 5 * 60 * 1000); // 5 minutes timeout
  
  // Launch a browser
  const browser = await chromium.launch({ 
    headless: true,
    timeout: 60000 // 60 seconds browser launch timeout
  });
  
  let success = false;
  let error = null;
  
  try {
    // Find a working Nitter instance
    const workingInstance = await getWorkingNitter(browser);
    console.log(`Found working Nitter instance: ${workingInstance}`);
    
    // Update Redis cache
    await redis.set(CACHE_KEY, workingInstance, { ex: CACHE_TTL_SECONDS });
    console.log(`Successfully updated Redis cache with: ${workingInstance}`);
    
    // Get current cache for verification
    const cachedInstance = await redis.get(CACHE_KEY);
    console.log(`Verified cache contains: ${cachedInstance}`);
    

    clearTimeout(mainTimeout);
    success = true;
  } catch (err) {
    error = err;        // not currently used
    console.error("Error updating Nitter instances:", err);
  } finally {
    await browser.close();
    console.log("Browser closed");
    
    if (!success) {
      process.exit(1);
    }
  }
}

// Run the main function
main()
  .then(() => {
    console.log("✅ Nitter instance update completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Nitter instance update failed:", error);
    process.exit(1);
  });
