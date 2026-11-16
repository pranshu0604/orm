// Sends "notable activity" digest emails for connections with new outperforming posts.
// Run with: npm run send-digests

import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { findUnnotifiedNotablePosts, markDigestSent } from '../lib/digest';
import { sendDigestEmail } from '../lib/email';

async function main() {
  console.log('📬 Checking for notable activity digests to send...\n');

  const connections = await prisma.platformConnection.findMany({
    where: { platform: 'X', setupCompleted: true },
    select: { id: true, username: true, user: { select: { email: true } } },
  });

  let sent = 0;

  for (const conn of connections) {
    const { posts, isFirstDigest } = await findUnnotifiedNotablePosts(conn.id);

    // Skip the very first digest for a connection — there's no "since last time" baseline yet,
    // and it would otherwise dump the account's whole history as "notable" on day one.
    if (isFirstDigest) {
      await markDigestSent(conn.id);
      console.log(`ℹ️  Baselining @${conn.username} (first run, no email sent)`);
      continue;
    }

    if (posts.length === 0) continue;

    try {
      await sendDigestEmail({
        to: conn.user.email,
        username: conn.username,
        platformLabel: 'X / Twitter',
        notablePosts: posts,
      });
      await markDigestSent(conn.id);
      sent++;
      console.log(`✅ Sent digest to ${conn.user.email} (@${conn.username}) — ${posts.length} notable post(s)`);
    } catch (error) {
      console.error(`❌ Failed to send digest for @${conn.username}:`, error);
    }
  }

  console.log(`\n✅ Digest run complete. ${sent} email(s) sent.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
