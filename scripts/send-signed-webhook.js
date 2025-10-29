/*
scripts/send-signed-webhook.js

Send a Svix/Clerk-style signed webhook to a local/remote URL for testing.
Usage:
  node scripts/send-signed-webhook.js --url http://localhost:3000/api/sync-user --secret whsec_... --userId user_123

Options:
  --url     The destination URL to POST to (required)
  --secret  The webhook signing secret (required)
  --userId  The Clerk userId to include in the payload (defaults to "test_user")

This script builds a payload (JSON), computes HMAC-SHA256 over the string "<timestamp>.<payload>",
and sends the `svix-signature` header in the format: t=<timestamp>,v1=<hex>

This lets you test your local `/api/sync-user` that verifies Svix-style signatures.
*/

const axios = require('axios');
const crypto = require('crypto');

function usageAndExit(msg) {
  if (msg) console.error(msg);
  console.error('\nUsage: node scripts/send-signed-webhook.js --url <url> --secret <whsec_...> [--userId <id>]');
  process.exit(msg ? 1 : 0);
}

const argv = require('minimist')(process.argv.slice(2));
const url = argv.url || argv.u;
const secret = argv.secret || argv.s;
const userId = argv.userId || argv.id || 'test_user';

if (!url || !secret) usageAndExit('Missing required --url or --secret');

async function main() {
  const payload = { userId };
  const payloadStr = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedPayload = `${timestamp}.${payloadStr}`;

  const hmac = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  const header = `t=${timestamp},v1=${hmac}`;

  console.log('Sending POST to', url);
  console.log('Payload:', payload);
  console.log('Header svix-signature:', header);

  try {
    const res = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'svix-signature': header,
      },
      timeout: 10000,
    });

    console.log('Response status:', res.status);
    console.log('Response data:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('Error response:', err.response.status, err.response.data);
    } else {
      console.error('Request error:', err.message);
    }
    process.exit(1);
  }
}

main();
