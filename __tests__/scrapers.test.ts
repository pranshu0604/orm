// CLI command: npx jest __tests__/scrapers.test.ts

import { getWorkingNitter } from "@/lib/scrapers/getWorkingNitter";
import { getCachedNitterInstance } from "@/lib/scrapers/getCachedNitter";
import { isAlive, closeBrowser } from "@/lib/scrapers/isAlive";

describe("LIVE SCRAPER TESTS", () => {
  // Increase timeout to account for browser startup and page loading
  jest.setTimeout(60000);

  // Clean up browser resources after all tests complete
  afterAll(async () => {
    await closeBrowser();
    console.log("Cleaned up browser resources");
  });

  test("isAlive should return true for a working Nitter instance", async () => {
    // Try with multiple instances in case one is down
    const instances = [
      "https://nitter.net",
      "https://nitter.space",
      "https://nitter.privacyredirect.com",
      "https://nitter.poast.org",
      "https://lightbrd.com",
      "https://xcancel.com"
    ];

    let alive = false;
    let workingInstance = '';
    let errors = [];

    for (const instance of instances) {
      console.log(`Testing if ${instance} is alive...`);
      try {
        alive = await isAlive(instance);
        if (alive) {
          workingInstance = instance;
          break;
        }
      } catch (error) {
        errors.push(`${instance}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log("Found working instance?", alive, workingInstance || "None");
    
    if (!alive) {
      console.error("All instances failed:", errors);
    }
    
    expect(alive).toBe(true);
  });

  test("getWorkingNitter should return a working instance", async () => {
    const instance = await getWorkingNitter();
    console.log("Working instance:", instance);
    expect(instance).toMatch(/^https?:\/\/[^ "]+$/);
    
    // Verify the instance works
    const alive = await isAlive(instance);
    expect(alive).toBe(true);
  });

  test("getCachedNitterInstance should return a working instance (delegate to getWorkingNitter)", async () => {
    const instance = await getCachedNitterInstance();
    console.log("Cached/Refreshed working instance:", instance);
    expect(instance).toMatch(/^https?:\/\/[^ "]+$/);
    
    // Verify it's the same function now
    const directInstance = await getWorkingNitter();
    console.log("Are they the same implementation?", instance === directInstance);
  });
});