// scripts/check-redis-combined.js
require('dotenv').config(); // Load environment variables from .env file

/**
 * Combined script for checking Redis configuration and Nitter cache
 * 
 * Usage:
 * node scripts/check-redis-combined.js [nitter]
 * Pass 'nitter' argument to check Nitter cache in Redis
 * No arguments to check general Redis configuration
 */

const { Redis } = require('@upstash/redis');

// Parse args
const checkNitter = process.argv.includes('nitter');
console.log(`Checking Redis ${checkNitter ? 'Nitter cache' : 'configuration'}...`);

// Cache key for Nitter
const CACHE_KEY = "nitter:base_url";

// Check general Redis configuration
async function checkRedisConfig() {
  console.log("Checking Redis configuration...");
  
  // Log the environment variables (without showing the full token for security)
  if (process.env.UPSTASH_REDIS_REST_URL) {
    console.log(`Redis URL: ${process.env.UPSTASH_REDIS_REST_URL}`);
  } else {
    console.log("Redis URL: Not found in environment variables");
  }
  
  if (process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Only show the first 5 characters of the token for security
    const tokenPreview = process.env.UPSTASH_REDIS_REST_TOKEN.substring(0, 5) + '...';
    console.log(`Redis Token: ${tokenPreview}`);
  } else {
    console.log("Redis Token: Not found in environment variables");
  }
  
  try {
    // Connect to Redis with environment variables
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    // Set a test key
    const testKey = "test:redis:config";
    const testValue = `test-${Date.now()}`;
    
    console.log(`Setting test key: ${testKey} = ${testValue}`);
    await redis.set(testKey, testValue, { ex: 60 }); // 60 second expiry
    
    // Read it back
    const retrieved = await redis.get(testKey);
    console.log(`Retrieved value: ${retrieved}`);
    
    if (retrieved === testValue) {
      console.log("✅ Redis is properly configured and working!");
      return true;
    } else {
      console.error("❌ Redis test failed: value mismatch");
      return false;
    }
  } catch (error) {
    console.error("❌ Redis test failed with error:", error);
    return false;
  }
}

// Check Nitter cache in Redis
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

// Run the appropriate check
(checkNitter ? checkCachedNitter() : checkRedisConfig())
  .then(result => {
    if (!result && !checkNitter) {
      console.log("\nPlease make sure the following environment variables are set:");
      console.log("- UPSTASH_REDIS_REST_URL");
      console.log("- UPSTASH_REDIS_REST_TOKEN");
    }
    process.exit(result ? 0 : 1);
  })
  .catch(err => {
    console.error("Error running Redis check:", err);
    process.exit(1);
  });
