<!-- filepath: /Users/pranshupandey/Developer/Personal/orm/docs/README.md -->
# PRAN - Public Reputation and Analysis Node Documentation

This documentation provides information about the PRAN project, focusing on implemented features and current architecture.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture and Components](#architecture-and-components) 
3. [Authentication System](#authentication-system)
4. [Platform Connections](#platform-connections)
5. [Data Analysis & AI Features](#data-analysis--ai-features)
6. [Twitter/X Data Scraping](#twitterx-data-scraping)
7. [Setup and Installation](#setup-and-installation)
8. [Deployment Checklist](#deployment-checklist) 
9. [How It Works](#how-it-works)
10. [Maintenance](#maintenance)
11. [Troubleshooting](#troubleshooting)

## Project Overview

PRAN (Public Reputation and Analysis Node) is a web application designed to help users monitor and manage their online reputation across multiple digital platforms. 

### Current Implementation Status

| Component | Status |
|-----------|--------|
| Core architecture | Basic implementation ✓ |
| Authentication system | Implemented ✓ |
| Platform connections (Twitter/X, GitHub) | Implemented ✓ |
| Twitter/X data scraping via Nitter | In development |
| Redis caching for Nitter instances | Implemented ✓ |
| AI integration (test implementation) | Implemented ✓ |

## Architecture and Components

PRAN is built with:

- **Next.js 15** with App Router (React 19)
- **PostgreSQL** with Prisma ORM
- **Redis** cache via Upstash
 - **FastAPI-based AI microservice** (in `../ai`) for AI functionality and streaming
- **Dual authentication system** (Clerk + NextAuth)
- **Tailwind CSS** and shadcn/ui components

### Directory Structure

```
app/              # Next.js App Router structure
├── actions/      # Server actions
├── ai/           # AI testing integration
├── api/          # API routes
├── settings/     # Settings pages
components/       # UI components
lib/              # Core utilities
prisma/           # Database schema and migrations
scripts/          # Utility scripts
```

## Authentication System

PRAN uses a dual authentication approach:

### Primary Authentication (Clerk)

Clerk handles the main user authentication:

- Sign-up and sign-in with email, Google, or Apple
- User profile management
- Session handling and security

When a user signs in with Clerk:
1. The system authenticates the user via Clerk's SDK
2. A webhook synchronizes user data to the PostgreSQL database
3. The user can then access the application features

### Platform Connections (NextAuth)

NextAuth is used specifically for connecting to social platforms:

- OAuth integration with Twitter/X
- OAuth integration with GitHub
- Secure token storage and management

When a user connects a platform:
1. NextAuth initiates the OAuth flow with the platform
2. Upon successful authentication, tokens are encrypted and stored
3. The connection is recorded in the database with the user's ID

### Key Implementation Details

- User data synchronized between Clerk and database
- OAuth tokens stored encrypted in the database
- Platform connections managed in user settings

## Platform Connections

PRAN supports connecting to multiple platforms:

### X/Twitter Integration

- Connect via OAuth 2.0
- Scope includes: `users.read`, `tweet.read`, `offline.access`
- Data collected: user profile, tweets, engagement metrics
- Data access via Nitter (in development)

### GitHub Integration

- Connect via OAuth
- Scope includes: `read:user`, `user:email`
- Data collected: profile, repositories, stars, contributions

### Connection Management

Users can:
- Connect new platforms
- View connection status
- Disconnect platforms
- Update existing connections

## Data Analysis & AI Features

PRAN uses AI to analyze user content and provide insights:

### Sentiment Analysis

- Posts are analyzed for positive, negative, or neutral sentiment
- Key themes and topics are extracted
- Potentially problematic content is flagged

### Metrics Tracking

For each post, the system tracks:
- Likes, comments, shares, views
- Audience engagement rates
- Click-through rates where available

### AI-Generated Insights
- Using the FastAPI AI microservice (see `../ai`), the system provides:
- Content improvement suggestions
- Audience growth recommendations
- Crisis management advice when negative sentiment is detected

## Twitter/X Data Scraping

PRAN includes a specialized system for accessing Twitter data without API limitations using Nitter instances:

### Architecture

The system implements a hybrid approach to finding and using working Nitter instances:

![Nitter Scraper Architecture](/public/images/nitter-scraper-architecture.png)

#### Architecture Components and Flows

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

## Setup and Installation

For detailed setup instructions, refer to the [Installation Guide](./installation-guide.md).

### Required Environment Variables

```
# Database
DATABASE_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Twitter/X
TWITTER_API_KEY=
TWITTER_API_SECRET=

# GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# AI microservice
# Point this at the running FastAPI microservice (default local dev: http://localhost:8000)
AI_SERVICE_URL=

# Security
ENCRYPTION_SECRET_KEY=
```

### Setup Instructions

#### 1. Environment Variables

Add the environment variables to your project as listed above.

For local development, add these to your `.env.local` file.

For production, add these as secrets in your repository settings and in your Vercel project settings.

#### 2. Database Setup

1. Create a PostgreSQL database (Neon recommended)
2. Initialize the database with Prisma:

```bash
npx prisma migrate dev
```

#### 3. Redis Setup

1. Create an Upstash Redis database
2. Add the connection details to your environment variables
3. Verify the connection:
   ```bash
   npm run check-redis
   ```

#### 4. Authentication Setup

1. **Clerk Setup**:
   - Create a Clerk application at [clerk.com](https://clerk.com)
   - Configure OAuth providers (Google, Apple) if needed
   - Get your API keys and add them to environment variables
   - Configure webhooks for user synchronization

2. **NextAuth Setup**:
   - Create OAuth applications for each platform:
     - GitHub: [github.com/settings/developers](https://github.com/settings/developers)
     - Twitter: [developer.twitter.com](https://developer.twitter.com)
   - Configure callback URLs for each provider
   - Add API keys to environment variables

#### 5. GitHub Actions Setup

The GitHub Action is configured to run every 6 hours to update the Redis cache with working Nitter instances.

Make sure you have added all the required environment variables as GitHub secrets:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

#### 6. Development Environment

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

#### 7. Verify Your Setup

To verify that everything is working:

1. Test user authentication:
   - Register and login with Clerk
   - Connect platform accounts with NextAuth

2. Test the Nitter scraper:
   ```bash
   npm run test:scraper
   ```

3. Manually update Nitter instances:
   ```bash
   npm run update-nitter
   ```

## Deployment Checklist

### Pre-Deployment Steps

1. **Database Setup**
   - Deploy a production PostgreSQL database (Neon recommended)
   - Run migrations: `npx prisma migrate deploy`
   - Verify database connection

2. **Redis Setup**
   - Set up Upstash Redis for production
   - Copy the UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

3. **Authentication Configuration**
   - Update Clerk application with production URLs
   - Update OAuth redirect URIs for Next Auth providers
   - Configure production webhooks

4. **Environment Variables**
    - Add all environment variables to your Vercel project (or equivalent platform):
       - DATABASE_URL
       - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
       - CLERK_SECRET_KEY
       - NEXTAUTH_URL (set to your production URL)
       - NEXTAUTH_SECRET
       - GITHUB_CLIENT_ID
       - GITHUB_CLIENT_SECRET
       - TWITTER_API_KEY
       - TWITTER_API_SECRET
       - UPSTASH_REDIS_REST_URL
       - UPSTASH_REDIS_REST_TOKEN
       - ENCRYPTION_SECRET_KEY
    - Note: the AI microservice (`ai/`) manages its own model credentials. If you host the microservice separately, make sure the microservice environment includes the model endpoint and API keys it needs.

5. **GitHub Repository Secrets**
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add the following secrets for the Nitter update workflow:
     - UPSTASH_REDIS_REST_URL
     - UPSTASH_REDIS_REST_TOKEN

### Post-Deployment Steps

1. **Initial User Synchronization**
   - Test Clerk authentication with a test user
   - Verify the user is created in your database

2. **Platform Connections Test**
   - Test connecting to Twitter/X and GitHub
   - Verify connections are stored in the database

3. **Trigger Initial Data Collection**
   - Manually run the GitHub Action for Nitter instance updates
   - Verify the action completes successfully

4. **AI Integration Test**
   - Test the AI functionality to ensure proper integration
   - Verify sentiment analysis and suggestions generation

5. **End-to-End Testing**
   - Complete a full user journey from registration to report generation
   - Test all critical paths and functionality

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

### Routine Tasks

1. **Database Maintenance**:
   - Regularly monitor database size and performance
   - Run `VACUUM` and other maintenance operations as needed
   - Consider data retention policies for post data

2. **Authentication System**:
   - Keep Clerk and NextAuth packages updated
   - Periodically rotate OAuth secrets and tokens
   - Review authentication logs for unusual activity

3. **Nitter Instances**:
   - Update hardcoded fallback instances quarterly
   - Monitor GitHub Actions logs for scraping reliability
   - Test the scraper manually if issues are reported

4. **AI Integration**:
   - Stay updated on the AI microservice and upstream model-provider API changes
   - Monitor AI request costs and usage
   - Periodically review and refine AI prompts for better results

### Monitoring Recommendations

1. **Error Tracking**:
   - Set up error logging with a service like Sentry
   - Monitor failed authentication attempts
   - Track API failures and connection issues

2. **Performance Monitoring**:
   - Monitor Next.js build and page load times
   - Track Redis cache hit rates
   - Monitor database query performance

3. **Usage Analytics**:
   - Track platform connection success rates
   - Monitor user engagement with features
   - Track AI feature usage and effectiveness

### Update Procedures

1. **Updating Nitter Fallback Instances**:
   - Maintain a list of reliable Nitter instances
   - Update the hardcoded fallbacks in:
     - `lib/scrapers/getWorkingNitter.ts`
     - `scripts/update-nitter-instances.js`
   - Consider current uptime and geographical distribution

2. **Updating AI Models**:
   - Update the model name/config in the AI microservice (see `ai/`) or in your proxying code if you override model selection there
   - Test with a variety of prompts before deploying
   - Monitor performance and cost changes

## Troubleshooting

For common issues and solutions, refer to the [FAQ](./faq.md).

### Common Issues

1. **Authentication Problems**:
   - **Clerk Authentication Failures**:
     - Verify Clerk API keys are correctly set
     - Check for issues in the Clerk dashboard
     - Ensure user synchronization is working
   
   - **NextAuth OAuth Issues**:
     - Check that callback URLs are correct in both provider settings and code
     - Verify tokens are being properly encrypted and stored
     - Examine NextAuth logs for detailed error information

2. **Database Connectivity**:
   - Check connection string format and credentials
   - Verify database permissions for the connected user
   - Ensure database is accessible from your deployment environment
   - Check for migrations that need to be applied

3. **Platform API Issues**:
   - **Twitter/X Rate Limiting**:
     - Implement backoff strategies for rate-limited requests
     - Monitor API usage and adjust request frequency
   
   - **GitHub API Problems**:
     - Check token permissions and scopes
     - Verify OAuth application settings

4. **Nitter Scraper Issues**:
   - **Redis Connection Problems**: 
     - Verify Upstash Redis URL and token
     - Run `npm run check-redis` to test the connection
   
   - **GitHub Actions Failures**: 
     - Check Action logs in the repository
     - Verify GitHub secrets are correctly set
     - Ensure Playwright installation succeeds in the workflow
   
   - **Scraping Failures**: 
     - Update hardcoded fallback instances
     - Check if target page structures have changed

4. **AI Integration Issues**:
   - Verify the AI microservice is reachable and configured (check `AI_SERVICE_URL` and the microservice logs)
   - Check the model endpoint and credentials used by the microservice
   - Monitor rate limits and quotas of the upstream model provider

### Diagnostic Commands

```bash
# Check Redis connection and configuration
npm run check-redis

# Check Nitter instances in Redis
npm run check-nitter

# Test Nitter scraper functionality
npm run test:scraper

# Test production mode with Nitter scraper
npm run test:production

# Run quick check of production setup
npm run test:prod-simple

# Manually update Nitter instances
npm run update-nitter

# Simulate GitHub Action locally
npm run simulate:action
```

### Troubleshooting Database Issues

For database issues, you can use Prisma's tools:

```bash
# Check database connection
npx prisma validate

# Reset development database (CAREFUL: deletes all data)
npx prisma migrate reset

# Check database schema status
npx prisma db pull

# Generate prisma client after schema changes
npx prisma generate
```

---

Last updated: May 19, 2025
