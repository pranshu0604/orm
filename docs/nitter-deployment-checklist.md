# Deployment Checklist

Follow these steps when deploying the application to Vercel to ensure the Nitter scraper functions correctly:

## Pre-Deployment Steps

1. **Set up Upstash Redis**
   - Make sure your Upstash Redis instance is created and accessible
   - Copy the UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

2. **Add Environment Variables to Vercel Project**
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
   - (And all other environment variables required by your application)

3. **Add GitHub Repository Secrets**
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     - UPSTASH_REDIS_REST_URL
     - UPSTASH_REDIS_REST_TOKEN

## Post-Deployment Steps

1. **Run Initial Verification**
   - Clone the deployed repository locally
   - Run `npm run verify:production` to verify the production setup
   - Make sure all checks pass

2. **Manually Trigger GitHub Action**
   - Go to your GitHub repository → Actions → "Update Nitter Instances" workflow
   - Click "Run workflow" to manually trigger the action
   - Verify the action completes successfully

3. **Test in Production**
   - Visit your deployed application
   - Test the features that rely on Nitter scraping
   - Check server logs for any errors

## Monitoring

1. **Set Up GitHub Action Notifications**
   - Set up notifications for GitHub Action failures

2. **Check Cache Periodically**
   - Run `npm run check-nitter` periodically to ensure the cache is still valid
   - You can automate this with a monitoring service

3. **Update Hardcoded Fallbacks**
   - Periodically update the hardcoded fallback instances in:
     - `lib/scrapers/getWorkingNitter.ts`
     - `scripts/update-nitter-instances.js`

## Troubleshooting

If the scraper stops working in production:

1. Check GitHub Actions logs to see if the scheduled update is failing
2. Verify Redis connection and credentials are still valid
3. Run `npm run update-nitter` manually to refresh the cache
4. Check if the Nitter instances in the hardcoded fallback list are still operational

Remember that Nitter instances may change or go offline over time, so periodic maintenance of the fallback list is necessary.
