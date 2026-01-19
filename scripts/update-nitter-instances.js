/**
 * Update Nitter Instances Script
 * This script runs periodically via GitHub Actions to update the cached list of working Nitter instances.
 * It tests instances and caches the best working one in Redis.
 */

const { chromium } = require('playwright');

// Polyfill fetch for Node.js if not available
if (!globalThis.fetch) {
  globalThis.fetch = require('node-fetch');
}

const { Redis } = require('@upstash/redis');

const CACHE_KEY = 'nitter:base_url';
const CACHE_TTL_SECONDS = 60 * 60 * 8; // 8 hours

const KNOWN_INSTANCES = [
  { url: 'https://nitter.net', uptime: 91 },
  { url: 'https://nitter.space', uptime: 97 },
  { url: 'https://nitter.privacyredirect.com', uptime: 96 },
  { url: 'https://lightbrd.com', uptime: 95 },
  { url: 'https://nitter.poast.org', uptime: 83 },
  { url: 'https://xcancel.com', uptime: 99 },
];

// Initialize Redis client
function getRedisClient() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Missing Redis credentials');
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Check if a Nitter instance is alive and working
async function isAlive(url) {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    const testUrl = `${url}/jack`;
    
    console.log(`Testing ${testUrl}...`);
    const response = await page.goto(testUrl, { timeout: 10000 });
    
    if (!response || response.status() !== 200) {
      console.log(`  ❌ Status: ${response?.status() || 'timeout'}`);
      await context.close();
      return false;
    }
    
    try {
      await page.waitForSelector('.timeline-item', { timeout: 5000 });
      const tweetCount = await page.evaluate(() => document.querySelectorAll('.timeline-item').length);
      
      if (tweetCount > 0) {
        console.log(`  ✅ Working (${tweetCount} tweets found)`);
        await context.close();
        return true;
      } else {
        console.log(`  ❌ No tweets found`);
        await context.close();
        return false;
      }
    } catch (error) {
      console.log(`  ❌ Selector timeout: ${error.message}`);
      await context.close();
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

// Fetch healthy instances from status page
async function getAllHealthyInstances() {
  console.log('\n📡 Fetching instances from status.d420.de...');
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    await page.goto('https://status.d420.de/', { timeout: 30000 });
    await page.waitForSelector('table tr', { timeout: 5000 });
    
    const instances = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr')).slice(1);
      const valid = [];
      
      for (const row of rows) {
        const tds = row.querySelectorAll('td');
        const instance = tds[0]?.textContent?.trim() ?? '';
        const healthy = tds[2]?.textContent?.trim();
        const uptimeStr = tds[4]?.textContent?.trim() ?? '0%';
        const uptime = parseInt(uptimeStr.replace('%', ''), 10) || 0;
        
        if (healthy === '✅' && uptime >= 80) {
          valid.push({ url: `https://${instance}`, uptime });
        }
      }
      
      valid.sort((a, b) => b.uptime - a.uptime);
      return valid;
    });
    
    await browser.close();
    console.log(`  Found ${instances.length} healthy instances`);
    return instances.map(i => i.url);
  } catch (error) {
    console.log(`  ⚠️  Failed to fetch from status page: ${error.message}`);
    await browser.close();
    
    // Fall back to known instances
    console.log('  Using known instances as fallback');
    return KNOWN_INSTANCES
      .filter(i => i.uptime >= 80)
      .sort((a, b) => b.uptime - a.uptime)
      .map(i => i.url);
  }
}

// Find the first working Nitter instance
async function findWorkingNitter(instances) {
  console.log('\n🔍 Testing instances for availability...\n');
  
  for (const candidate of instances) {
    try {
      if (await isAlive(candidate)) {
        return candidate;
      }
    } catch (error) {
      console.log(`  Error testing ${candidate}: ${error.message}`);
    }
  }
  
  throw new Error('No reachable Nitter instances found');
}

// Main execution
async function main() {
  console.log('🚀 Starting Nitter instances update...\n');
  
  try {
    const redis = getRedisClient();
    
    // Get list of healthy instances
    const instances = await getAllHealthyInstances();
    
    if (!instances.length) {
      throw new Error('No healthy instances available');
    }
    
    // Find the first working one
    const workingInstance = await findWorkingNitter(instances);
    
    // Cache it in Redis
    console.log(`\n💾 Caching ${workingInstance} in Redis...`);
    try {
      await redis.set(CACHE_KEY, workingInstance, { ex: CACHE_TTL_SECONDS });
      console.log(`   ✅ Successfully cached to Redis`);
    } catch (redisError) {
      console.error(`   ⚠️  Redis cache failed: ${redisError.message}`);
      console.error(`   Continuing anyway - instance was found: ${workingInstance}`);
    }
    
    console.log(`\n✅ Successfully updated Nitter instance cache!`);
    console.log(`   Active instance: ${workingInstance}`);
    console.log(`   Cache TTL: ${CACHE_TTL_SECONDS / 3600} hours`);
    
  } catch (error) {
    console.error('\n❌ Failed to update Nitter instances:');
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

main();
