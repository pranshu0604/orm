// scripts/verify-production-setup.js
require('dotenv').config(); // Load environment variables from .env file

/**
 * This script verifies the entire setup:
 * 1. Checks Redis connection
 * 2. Checks for existing Nitter instance in cache
 * 3. Updates the Nitter instance with a new one
 * 4. Verifies the update worked
 */

const { execSync } = require('child_process');

console.log("=== VERIFYING PRODUCTION SETUP ===");
console.log("This script will verify all components of the Nitter scraper system");
console.log("Make sure your UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in your environment\n");

const runStep = (command, description) => {
  console.log(`\n----- ${description} -----`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed`);
    return false;
  }
};

// Set a timeout for the entire process
const timeout = setTimeout(() => {
  console.error("\n⏱️ Verification process timed out after 5 minutes");
  process.exit(1);
}, 5 * 60 * 1000);

async function main() {
  try {
    // Step 1: Check Redis connection
    const redisOk = runStep("node scripts/check-redis.js", "Verifying Redis connection");
    if (!redisOk) {
      console.error("❌ Redis connection failed. Please check your credentials.");
      return false;
    }
    
    // Step 2: Check for existing Nitter instance
    console.log("\n----- Checking for existing Nitter instance -----");
    try {
      execSync("node scripts/check-redis-nitter.js", { stdio: 'inherit' });
      console.log("✅ Found existing Nitter instance in cache");
    } catch (error) {
      console.log("ℹ️ No existing Nitter instance found in cache. This is normal for first-time setup.");
    }
    
    // Step 3: Update Nitter instance
    const updateOk = runStep("node scripts/update-nitter-instances.js", "Updating Nitter instance");
    if (!updateOk) {
      console.error("❌ Failed to update Nitter instance");
      return false;
    }
    
    // Step 4: Verify update worked
    const verifyOk = runStep("node scripts/test-production-simple.js", "Verifying updated Nitter instance");
    if (!verifyOk) {
      console.error("❌ Verification failed");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error during verification:", error);
    return false;
  }
}

// Run the main function
main()
  .then(success => {
    clearTimeout(timeout);
    if (success) {
      console.log("\n✅ PRODUCTION SETUP VERIFIED SUCCESSFULLY!");
      console.log("Your Nitter scraping system is ready for production use");
    } else {
      console.log("\n❌ PRODUCTION SETUP VERIFICATION FAILED");
      console.log("Please check the errors above and fix the issues");
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    clearTimeout(timeout);
    console.error("\nFatal error during verification:", err);
    process.exit(1);
  });
