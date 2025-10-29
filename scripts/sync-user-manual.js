// scripts/sync-user-manual.js
// One-off CLI to sync a single Clerk user to the local Prisma DB.
// Usage:
//   node scripts/sync-user-manual.js <clerkUserId>
// or
//   CLERK_USER_ID=<id> node scripts/sync-user-manual.js
// Requires: CLERK_API_KEY in env (for clerk SDK)

require('dotenv').config();

const { clerkClient } = require('@clerk/clerk-sdk-node');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const userId = process.argv[2] || process.env.CLERK_USER_ID;
  if (!userId) {
    console.error('Usage: node scripts/sync-user-manual.js <clerkUserId>');
    process.exit(1);
  }

  if (!process.env.CLERK_API_KEY) {
    console.error('Error: CLERK_API_KEY is not set in environment. Set it and retry.');
    process.exit(1);
  }

  try {
    console.log(`Fetching Clerk user ${userId}...`);
    const clerkUser = await clerkClient.users.getUser(userId);

    if (!clerkUser) {
      console.error('Clerk user not found');
      process.exit(1);
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ');
    const image = clerkUser.imageUrl || '';

    console.log('Upserting user in database...');
    await prisma.user.upsert({
      where: { clerkId: userId },
      update: { email, name, image },
      create: { clerkId: userId, email, name, image },
    });

    console.log('✅ User synced successfully', { userId, email, name, image });
  } catch (err) {
    console.error('Error syncing user:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
