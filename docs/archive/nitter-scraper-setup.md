# Nitter Scraper Setup

This document provides instructions for setting up the Nitter scraper component in the PRAN system.

## Prerequisites

Before setting up the Nitter scraper, ensure you have:

- Redis instance (Upstash Redis recommended)
- Node.js environment for running scripts
- GitHub repository for setting up Actions (production only)

## Development Setup

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

### 2. Redis Setup

1. Create an Upstash Redis database at [console.upstash.com](https://console.upstash.com)
2. Copy the REST URL and REST token to your environment variables
3. Verify the connection:

```bash
npm run check-redis
```

### 3. Testing Locally

To test the Nitter scraper locally:

```bash
# Update local Redis with working Nitter instances
node scripts/update-nitter-instances.js

# Test the functionality
npm run test:production
```

## Production Setup

### 1. Environment Secrets

Add the following secrets to your GitHub repository:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### 2. GitHub Actions

The repository includes a GitHub Action workflow that:

- Runs every 6 hours
- Updates Redis with working Nitter instances
- Handles automatic fallback for failed instances

To enable this workflow:

1. Ensure GitHub Actions are enabled for your repository
2. Verify that all required secrets are configured
3. Check the Actions tab to confirm the workflow is scheduled

### 3. Verifying Production Setup

After deploying to production, verify the setup:

```bash
npm run test:production
```

This will verify that:
- Redis connection is working
- Nitter instances can be retrieved
- Data can be successfully scraped

## Troubleshooting

### Redis Connection Issues

If you're experiencing Redis connection issues:

1. Verify your connection details in environment variables
2. Check if your IP is allowed in Redis firewall settings
3. Test with the `check-redis` script:

```bash
npm run check-redis
```

### No Working Instances

If no working Nitter instances are found:

1. Run the update script manually:

```bash
node scripts/update-nitter-instances.js
```

2. Check the console for any errors
3. Verify that Nitter instances are reachable from your network

### Rate Limiting

If you're experiencing rate limiting:

1. Decrease the frequency of requests
2. Add more fallback instances to the list
3. Consider implementing exponential backoff for retries

---

**Note**: This document has been archived as the PRAN system has evolved. See the main installation guide for current setup instructions.
