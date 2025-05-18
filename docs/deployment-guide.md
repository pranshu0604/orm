# Deployment Guide

This guide covers the deployment process for the PRAN (Public Reputation and Analysis Node) system to a production environment.

## Deployment Options

PRAN is designed to be deployed to any hosting platform that supports Next.js applications. The recommended deployment platforms are:

1. **Vercel** (Primary recommendation)
2. **Netlify**
3. **AWS Amplify**
4. **Custom server with Node.js**

## Prerequisites

Before deploying, ensure you have:

- A PostgreSQL database (Neon recommended)
- A Redis instance (Upstash recommended)
- Clerk account for authentication
- NextAuth configured with platform providers
- AI service access (OpenRouter)

## Vercel Deployment

### Step 1: Connect Repository

1. Log in to your Vercel account
2. Click "Add New Project"
3. Import your Git repository
4. Configure project name

### Step 2: Configure Environment Variables

Add all required environment variables in the Vercel project settings:

```
# Database
DATABASE_URL="your_postgresql_connection_string"

# Authentication - Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Authentication - NextAuth
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your_nextauth_secret

# Platform API Keys
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret

# AI Integration
OPENROUTER_API_KEY=your_openrouter_api_key

# Caching
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Security
ENCRYPTION_SECRET_KEY=your_encryption_secret
```

### Step 3: Configure Build Settings

In Vercel project settings:

1. Set the framework preset to Next.js
2. Set the build command to `npm run build`
3. Set the output directory to `.next`

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your application
3. The application will be available at the assigned domain

### Step 5: Set Up GitHub Actions

1. Add the following secrets to your GitHub repository:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

2. Verify the GitHub Action workflow is configured to run on schedule

### Step 6: Custom Domain (Optional)

1. Go to Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS settings as instructed

## Netlify Deployment

### Step 1: Connect Repository

1. Log in to Netlify
2. Click "New site from Git"
3. Select your Git provider and repository

### Step 2: Configure Build Settings

Set the following build settings:

- Build command: `npm run build`
- Publish directory: `.next`

### Step 3: Environment Variables

Add all required environment variables in Netlify site settings

### Step 4: Deploy

Click "Deploy site" and wait for the build to complete

## AWS Amplify Deployment

### Step 1: Connect Repository

1. Log in to AWS Management Console
2. Navigate to AWS Amplify
3. Click "New app" → "Host web app"
4. Connect your Git repository

### Step 2: Configure Build Settings

Create an `amplify.yml` file in your repository:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### Step 3: Environment Variables

Add all required environment variables in Amplify app settings

## Custom Server Deployment

### Step 1: Build the Application

```bash
npm run build
```

### Step 2: Start the Production Server

```bash
npm start
```

## Database Migration for Production

Run Prisma migrations in production:

```bash
npx prisma migrate deploy
```

## SSL Configuration

Ensure SSL is enabled on your production domain for security.

## Post-Deployment Verification

### Database Connectivity

Verify database connectivity:

```bash
npm run prisma:status
```

### Redis Connectivity

Verify Redis connectivity:

```bash
npm run check-redis
```

### Application Functionality

Test the following functionality:

1. User registration and login
2. Platform connections
3. Data retrieval
4. AI analysis features

## Monitoring and Logging

Set up monitoring for:

1. Application errors
2. Database performance
3. Redis cache performance
4. API rate limits

## Backup Strategy

Set up regular backups for:

1. PostgreSQL database
2. User data
3. Configuration settings

## Scaling Considerations

As your user base grows, consider:

1. Database scaling options
2. Redis cache sizing
3. Serverless function limits
4. API rate limit management

## Troubleshooting

### Failed Deployment

1. Check build logs for errors
2. Verify environment variables
3. Check for pending database migrations

### Database Connection Issues

1. Verify connection string
2. Check IP allowlist settings
3. Check database user permissions

### OAuth Connection Issues

1. Verify callback URLs match production domain
2. Check for HTTPS requirements
3. Validate scopes and permissions
