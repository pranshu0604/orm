# Nitter Instance Scraper Setup

This document provides instructions for setting up the Nitter instance scraper system that bypasses anti-scraping measures using a hybrid approach with browser automation and Redis caching.

## System Design

The system uses:

1. **Playwright** for headless browser scraping (only in development)
2. **Redis** for caching working Nitter instances
3. **GitHub Actions** for production data collection (runs on schedule)
4. **HTTP fallbacks** for when browser scraping isn't available

This design ensures the system works in both development and when deployed to Vercel's free tier.

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your project:

```
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

For local development, add these to your `.env.local` file.

For production, add these as secrets in your repository settings and in your Vercel project settings.

### 2. GitHub Actions Setup

The GitHub Action is configured to run every 6 hours to update the Redis cache with working Nitter instances.

Make sure you have added the Redis environment variables as GitHub secrets:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### 3. Verify Your Setup

To verify that everything is working:

1. Check Redis connectivity:
   ```bash
   npm run check-redis
   ```

2. Test the scraper:
   ```bash
   npm run test:scraper
   ```

3. Manually update Nitter instances:
   ```bash
   npm run update-nitter
   ```

## How It Works

- In **development mode**, the system uses Playwright to scrape Nitter instances from the status page and verify them.
- In **production mode**, the system uses GitHub Actions to run the browser-based scraping periodically and update Redis.
- Your application retrieves working Nitter instances from Redis cache.
- If cache misses or fails, the system falls back to a list of known reliable instances.

## Troubleshooting

- **Redis Connection Issues**: Verify your Upstash Redis URL and token. Run `npm run check-redis` to test.
- **GitHub Actions Failures**: Check the GitHub Action logs in the repository.
- **Scraping Failures**: Nitter instances and their status page can change. Update the hardcoded fallback list if needed.

## Maintenance

- Periodically check the working status of Nitter instances in your Redis cache.
- Monitor GitHub Action runs to ensure they're successfully updating the cache.
- Update the hardcoded fallback list of instances if you notice changes in reliability.
