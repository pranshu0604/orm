// Scrapes tweets for all connected Twitter accounts via Nitter. Run with: npm run scrape:twitter

import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { getWorkingNitter } from '../lib/scrapers/getWorkingNitter';
import { scrapeTweetsForUser, storeTweetsInDatabase } from '../lib/scrapers/scrapeTweets';

async function main() {
  console.log('🚀 Starting Twitter data scraping...\n');

  try {
    const nitterUrl = await getWorkingNitter();
    console.log(`✅ Using Nitter instance: ${nitterUrl}\n`);

    const connections = await prisma.platformConnection.findMany({
      where: { platform: 'X', setupCompleted: true },
      select: { id: true, username: true, user: { select: { email: true } } },
    });

    if (connections.length === 0) {
      console.log('ℹ️  No Twitter accounts connected yet.');
      return;
    }

    console.log(`📊 Found ${connections.length} Twitter account(s) to scrape\n`);

    for (const conn of connections) {
      if (!conn.username) {
        console.log(`⚠️  Skipping connection ${conn.id} - no username found`);
        continue;
      }

      try {
        console.log(`\n📱 Processing @${conn.username} (${conn.user.email})`);

        const tweets = await scrapeTweetsForUser(conn.username, nitterUrl, 50);
        console.log(`✅ Scraped ${tweets.length} tweets for @${conn.username}`);

        if (tweets.length === 0) {
          console.log(`⚠️  No tweets found for @${conn.username}`);
          continue;
        }

        console.log(`💾 Storing ${tweets.length} tweets in database...`);
        const { stored, updated } = await storeTweetsInDatabase(prisma, conn.id, tweets);
        console.log(`✅ Stored: ${stored} new, Updated: ${updated} existing tweets`);
      } catch (error) {
        console.error(`❌ Failed to process @${conn.username}:`, error);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log('\n✅ Twitter scraping completed successfully!');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
