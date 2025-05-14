// scripts/check-redis-nitter.js
require('dotenv').config(); // Load environment variables from .env file

/**
 * Check if there's a valid cached Nitter instance in Redis
 */

const { Redis } = require('@upstash/redis');

// Cache key
const CACHE_KEY = "nitter:base_url";

async function checkCachedNitter() {
  console.log("Checking Redis for cached Nitter instance...");
  
  try {
    // Connect to Redis
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    // Check if we have a cached URL
    const cachedUrl = await redis.get(CACHE_KEY);
    
    if (cachedUrl) {
      console.log(`✅ Found cached Nitter instance: ${cachedUrl}`);
      
      // Get TTL (time-to-live) for the key
      const ttl = await redis.ttl(CACHE_KEY);
      
      if (ttl > 0) {
        const hours = Math.floor(ttl / 3600);
        const minutes = Math.floor((ttl % 3600) / 60);
        console.log(`   Expires in: ${hours} hours, ${minutes} minutes`);
      } else if (ttl === -1) {
        console.log(`   This key has no expiration`);
      } else {
        console.log(`   This key has expired or doesn't exist`);
      }
      
      return true;
    } else {
      console.log("❌ No cached Nitter instance found in Redis");
      return false;
    }
  } catch (error) {
    console.error("Error connecting to Redis:", error);
    console.log("\nPlease check your Redis credentials:");
    console.log("- UPSTASH_REDIS_REST_URL");
    console.log("- UPSTASH_REDIS_REST_TOKEN");
    return false;
  }
}

// Run the check
checkCachedNitter()
  .then(result => {
    process.exit(result ? 0 : 1);
  })
  .catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
