// scripts/test-production-merged.js
require('dotenv').config(); // Load environment variables from .env file

/**
 * This script tests Nitter functionality in production mode.
 * It can run in simple or detailed mode:
 * - Simple mode just checks if a Nitter instance is cached in Redis and if it's working
 * - Detailed mode tries to find a working instance using fallbacks if the cache fails
 * 
 * Usage:
 * node scripts/test-production-merged.js [simple]
 * Pass 'simple' argument to run in simple mode, omit for detailed mode
 */

// Force production mode
process.env.NODE_ENV = 'production';

const axios = require('axios');
const { Redis } = require('@upstash/redis');

// Parse args
const isSimpleMode = process.argv.includes('simple');
console.log(`Running in ${isSimpleMode ? 'simple' : 'detailed'} mode`);

// Connect to Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const CACHE_KEY = "nitter:base_url";

// Simple HTTP check
async function testNitterInstance(url) {
  console.log(`Testing if ${url} is accessible via HTTP...`);
  
  try {
    const res = await axios.get(`${url}/jack`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      }
    });
    
    return res.status === 200;
  } catch (err) {
    console.error(`Error testing ${url}:`, err.message);
    return false;
  }
}

// More thorough HTTP-based check 
async function isAliveHttp(url) {
  try {
    const testUrl = `${url}/jack`; // test with Jack's profile
    console.log(`Testing if ${url} is alive using HTTP request...`);
    
    // Use a more realistic browser-like request
    const res = await axios.get(testUrl, {
      timeout: 10000, // Increased timeout to 10 seconds
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
      console.warn(`[❌] ${url} responded with status ${res.status}`);
      return false;
    }

    // Check if the response contains tweets
    // This is a simple check that will work for most Nitter instances
    const containsTweets = 
      res.data.includes('timeline-item') || 
      res.data.includes('tweet-content');

    if (!containsTweets) {
      console.warn(`[❌] ${url} responded with 200 but no tweets found`);
      return false;
    }

    console.log(`[✅] ${url} is alive with HTTP check`);
    return true;
  } catch (err) {
    console.error(`[🔥] ${url} HTTP check failed: ${err.message}`);
    return false;
  }
}

// Hardcoded list of known Nitter instances from the status page
// This serves as a fallback if Redis has no cached instance
const KNOWN_INSTANCES = [
  "https://nitter.net",
  "https://nitter.space",
  "https://nitter.privacyredirect.com",
  "https://lightbrd.com",
  "https://nitter.poast.org",
  "https://xcancel.com"
];

// Simple check - just test if Redis cache has a working instance
async function simpleTest() {
  try {
    console.log("Checking Redis for cached Nitter instance...");
    const cachedUrl = await redis.get(CACHE_KEY);
    
    if (!cachedUrl) {
      console.log("❌ No Nitter instance found in Redis cache");
      return false;
    }
    
    console.log(`Found cached instance: ${cachedUrl}`);
    
    // Test if it works
    const isWorking = await testNitterInstance(cachedUrl);
    
    if (isWorking) {
      console.log(`✅ Cached Nitter instance (${cachedUrl}) is working!`);
      return true;
    } else {
      console.log(`❌ Cached Nitter instance (${cachedUrl}) is not working`);
      return false;
    }
  } catch (error) {
    console.error("Error during test:", error);
    return false;
  }
}

// Detailed test - try Redis and fallbacks
async function detailedTest() {
  console.log("Testing production mode Nitter scraper...");
  
  try {
    // Set a timeout for the entire process
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Test timed out after 60 seconds')), 60000);
    });
    
    // The actual work
    const workPromise = (async () => {
      // Try to get from Redis cache first
      const cachedUrl = await redis.get(CACHE_KEY);
      
      if (cachedUrl) {
        console.log(`Found cached Nitter instance: ${cachedUrl}`);
        
        // Verify it works
        const isWorking = await isAliveHttp(cachedUrl);
        
        if (isWorking) {
          console.log(`✅ Cached instance is working: ${cachedUrl}`);
          return cachedUrl;
        }
        
        console.log(`❌ Cached instance is not working: ${cachedUrl}`);
      } else {
        console.log("No cached Nitter instance found in Redis");
      }
      
      // Try hardcoded instances
      console.log("Trying hardcoded instances...");
      
      for (const instance of KNOWN_INSTANCES) {
        console.log(`Checking ${instance}...`);
        const isWorking = await isAliveHttp(instance);
        
        if (isWorking) {
          console.log(`✅ Found working hardcoded instance: ${instance}`);
          // Update Redis cache
          await redis.set(CACHE_KEY, instance, { ex: 60 * 60 * 8 }); // 8 hours TTL
          console.log(`Updated Redis cache with: ${instance}`);
          return instance;
        }
      }
      
      console.error("❌ No working Nitter instances found");
      return null;
    })();
    
    // Race between the work and the timeout
    return await Promise.race([workPromise, timeoutPromise]);
    
  } catch (error) {
    console.error("Error in production test:", error);
    return null;
  }
}

// Run with a timeout for simple mode
let timeout;
if (isSimpleMode) {
  timeout = setTimeout(() => {
    console.error("Test timed out after 30 seconds");
    process.exit(1);
  }, 30000);
}

// Run the appropriate test
console.log("Starting production test...");
(isSimpleMode ? simpleTest() : detailedTest())
  .then(result => {
    if (timeout) clearTimeout(timeout);
    
    if (isSimpleMode) {
      // Simple mode success/failure
      if (result === true) {
        console.log("\n✅ PRODUCTION TEST PASSED: Redis cache has a working Nitter instance");
        process.exit(0);
      } else {
        console.log("\n❌ PRODUCTION TEST FAILED: No working Nitter instance found in Redis");
        process.exit(1);
      }
    } else {
      // Detailed mode success/failure
      if (result) {
        console.log(`\n✅ PRODUCTION TEST SUCCESSFUL: Found working Nitter instance: ${result}`);
        process.exit(0);
      } else {
        console.log(`\n❌ PRODUCTION TEST FAILED: Could not find a working Nitter instance`);
        process.exit(1);
      }
    }
  })
  .catch(err => {
    if (timeout) clearTimeout(timeout);
    console.error("Fatal error:", err);
    process.exit(1);
  });
