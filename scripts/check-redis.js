// Check if Redis is properly configured and accessible
require('dotenv').config(); // Load environment variables from .env file

// Use direct require instead of the aliased import
const { Redis } = require('@upstash/redis');

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

// Run the check
checkRedisConfig()
  .then(result => {
    if (!result) {
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
