import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function fetchWaitlistEntries() {
  try {
    console.log('Fetching all waitlist entries...\n');

    const entries = await prisma.waitlist.findMany({
      orderBy: {
        createdAt: 'desc', // Most recent first
      },
    });

    if (entries.length === 0) {
      console.log('No waitlist entries found.');
      return;
    }

    console.log(`Found ${entries.length} waitlist entries:\n`);
    console.log('━'.repeat(80));

    entries.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.email}`);
      console.log(`   ID: ${entry.id}`);
      console.log(`   Joined: ${entry.createdAt.toISOString()}`);
      console.log('━'.repeat(80));
    });

    console.log(`\nTotal entries: ${entries.length}`);

    // Export as JSON if needed
    console.log('\nJSON Output:');
    console.log(JSON.stringify(entries, null, 2));

  } catch (error) {
    console.error('Error fetching waitlist entries:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fetchWaitlistEntries();
