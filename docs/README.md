# Nitter Scraper Documentation

## Overview

This project includes a reliable system for finding and using working Nitter instances to access Twitter data without using the official Twitter API. The implementation bypasses anti-scraping measures using a hybrid approach with browser automation, Redis caching, and GitHub Actions.

## Table of Contents

1. [Architecture](#architecture)
2. [Setup Instructions](#setup-instructions)
3. [Deployment Checklist](#deployment-checklist)
4. [How It Works](#how-it-works)
5. [Maintenance](#maintenance)
6. [Troubleshooting](#troubleshooting)

## Architecture

The system implements a hybrid approach to finding and using working Nitter instances:

![Nitter Scraper Architecture](/public/images/nitter-scraper-architecture.png)

### Architecture Components and Flows

1. **Web Application**
   - The main app that needs Twitter data via Nitter
   - First checks Redis cache for a working instance
   - In development, can use Playwright directly

2. **Redis Cache**
   - Stores working Nitter instance URLs
   - Updated by GitHub Actions every 6 hours
   - Provides fast access to verified instances

3. **GitHub Actions**
   - Runs browser automation script every 6 hours
   - Finds and verifies working Nitter instances
   - Updates Redis cache with valid instances

4. **Playwright Browser**
   - Used in development environment only
   - Directly scrapes and tests Nitter instances
   - Not included in production builds

5. **Nitter Instances**
   - Various third-party Nitter instances on the internet
   - Verified for accessibility and functionality
   - Selected based on uptime and reliability

6. **Hardcoded Fallbacks**
   - Last resort if all dynamic methods fail
   - Updated periodically as part of maintenance
   - Ensures system degrades gracefully

### Core Components

1. **`getWorkingNitter.ts`**:
   - Main entry point for finding working Nitter instances
   - Manages Redis cache and fallback logic
   - Contains conditional imports to avoid loading Playwright in production

2. **`isAlive.ts`**:
   - Verifies if a Nitter instance is working
   - Uses different strategies based on environment (browser vs HTTP)
   - Includes detailed logging for debugging

3. **`scripts/update-nitter-instances.js`**:
   - GitHub Actions script for updating Redis cache
   - Uses Playwright to find working instances
   - Includes timeouts and error handling for reliability

4. **GitHub Actions workflow**:
   - Runs on a schedule to keep instances fresh
   - Handles resource-intensive browser automation
   - Reports success/failure status

### Key Features

1. **Works in development and production**:
   - Uses Playwright in development for browser-based scraping
   - Uses GitHub Actions for production data collection
   - Uses Redis for storing and retrieving working instances in both environments

2. **Has multiple fallback mechanisms**:
   - Redis cache as the primary source
   - Status page scraping for fresh instances
   - Hardcoded fallback list of known working instances
   - Ultimate hardcoded fallback if all else fails

3. **Is optimized for Vercel's free tier**:
   - No Playwright dependency in production bundle
   - Minimal cold start impact by using Redis for instant access
   - GitHub Actions handles resource-intensive scraping tasks

4. **Has comprehensive error handling**:
   - Each layer has proper error handling and fallbacks
   - Detailed logging for debugging issues
   - Graceful degradation if any component fails

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

## Deployment Checklist

### Pre-Deployment Steps

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

### Post-Deployment Steps

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

## How It Works

### Environment-Specific Behavior

- **Development Mode**:
  - The system uses Playwright for browser-based scraping
  - Nitter instances are found by scraping the status page at https://status.d420.de/
  - Browser automation verifies each instance by checking for tweets
  - Redis cache is used to avoid repeated scraping

- **Production Mode**:
  - GitHub Actions run the scraper script every 6 hours
  - The script updates Redis with verified working instances
  - Your application retrieves instances from Redis without needing browser automation
  - HTTP-only checks are used in production to verify instances

### Flow Diagram

1. Application needs a Nitter instance
2. Check Redis cache for a valid instance
3. If found, verify it's still working
4. If not found or not working, find a new one
   - In development: Use browser scraping
   - In production: Fall back to hardcoded list
5. Update Redis cache with working instance
6. Return working instance to application

## Maintenance

- Periodically check the working status of Nitter instances in your Redis cache
- Monitor GitHub Action runs to ensure they're successfully updating the cache
- Update the hardcoded fallback list of instances if you notice changes in reliability

### Updating Fallback Instances

The hardcoded fallback instances are defined in two places:

1. `lib/scrapers/getWorkingNitter.ts`
2. `scripts/update-nitter-instances.js`

When updating, consider:
- Current uptime percentage
- Consistency of availability
- Geographic distribution (for redundancy)

## Troubleshooting

### Common Issues

- **Redis Connection Issues**: 
  - Verify your Upstash Redis URL and token
  - Run `npm run check-redis` to test the connection
  - Check if your Upstash account is active

- **GitHub Actions Failures**: 
  - Check the GitHub Action logs in the repository
  - Verify the secrets are correctly set in GitHub
  - Make sure Playwright installation is successful

- **Scraping Failures**: 
  - Nitter instances and their status page can change
  - Update the hardcoded fallback list if needed
  - Check if the status page format has changed

### Diagnostic Commands

```bash
# Check Redis cache status
npm run check-redis-nitter

# Run the scraper manually
npm run update-nitter

# Test production setup
npm run test-production

# Run the GitHub Action simulation locally
npm run simulate-github-action
```

---

Last updated: May 18, 2025
