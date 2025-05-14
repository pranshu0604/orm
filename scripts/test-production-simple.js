// scripts/test-production-simple.js
require('dotenv').config(); // Load environment variables from .env file

/**
 * This script does a simple test of the production Nitter functionality
 * by just checking if a Nitter instance is cached in Redis and if it's working
 */

// Force production mode
process.env.NODE_ENV = 'production';

const axios = require('axios');
const { Redis } = require('@upstash/redis');

// Connect to Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const CACHE_KEY = "nitter:base_url";

// Simple HTTP check without all the complexity
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

async function main() {
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

// Run with a timeout
const timeout = setTimeout(() => {
  console.error("Test timed out after 30 seconds");
  process.exit(1);
}, 30000);

main()
  .then(success => {
    clearTimeout(timeout);
    if (success) {
      console.log("\n✅ PRODUCTION TEST PASSED: Redis cache has a working Nitter instance");
      process.exit(0);
    } else {
      console.log("\n❌ PRODUCTION TEST FAILED: No working Nitter instance found in Redis");
      process.exit(1);
    }
  })
  .catch(err => {
    clearTimeout(timeout);
    console.error("Fatal error:", err);
    process.exit(1);
  });
