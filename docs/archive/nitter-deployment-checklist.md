# Nitter Deployment Checklist

Follow these steps when deploying the application to Vercel to ensure the Nitter scraper functions correctly:

## Prerequisites

- Vercel account
- GitHub repository configured
- Upstash Redis account

## Pre-Deployment Checklist

### 1. Environment Variables

Verify that the following environment variables are set in your Vercel project:

```
# Redis for Nitter instances
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

### 2. Redis Setup

- Ensure Redis instance is accessible from Vercel
- Verify that no firewall rules block Vercel IP ranges
- Test the connection:

```bash
npm run check-redis
```

### 3. GitHub Actions 

GitHub Actions are used to update the Redis cache with working Nitter instances.

- Add GitHub repository secrets:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  
- Verify the workflow file is present:
  - `.github/workflows/update-nitter-instances.yml`

- Ensure the workflow is scheduled to run every 6 hours

## Post-Deployment Verification

### 1. Test Redis Connection

Run the check-redis script to verify Redis connectivity:

```bash
npm run check-redis
```

### 2. Test Nitter Scraper

Verify that the Nitter scraper can retrieve data:

```bash
npm run test:production
```

### 3. Monitor First Workflow Run

- Check GitHub Actions to confirm the workflow runs successfully
- Verify that Redis is updated with new Nitter instances
- Check logs for any errors or unexpected behavior

## Troubleshooting Common Issues

### Redis Connection Failures

If Redis connection fails:

1. Check environment variables for typos
2. Verify Redis instance is active
3. Check if Vercel IP ranges are allowed

### GitHub Actions Failures

If GitHub Actions fail:

1. Verify secrets are correctly configured
2. Check the workflow file syntax
3. Review action logs for specific errors
4. Try running the script manually:
   - `scripts/update-nitter-instances.js`

### Nitter Instance Retrieval Failures

If no Nitter instances are found:

1. Run the update script manually
2. Check if any instances are reachable from your network
3. Review logs for any filtering that might be too strict

## Maintenance Tasks

### Regular Checks

- Monitor GitHub Actions runs
- Periodically test Redis connectivity 
- Test Nitter scraper functionality
- Update the Nitter instance source list as needed

### Performance Optimization

- Consider adjusting GitHub Actions schedule based on usage
- Optimize Redis cache TTL values
- Monitor rate limiting on Nitter instances

---

**Note**: This document has been archived as the PRAN system has evolved. See the main documentation for current deployment instructions.
