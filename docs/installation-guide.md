# PRAN Installation Guide

This guide provides detailed instructions for setting up the PRAN (Public Reputation and Analysis Node) project for development.

## Prerequisites

Before starting, ensure you have the following:

- Node.js 18.x or later
- npm 9.x or later
- Git
- PostgreSQL database (Neon recommended)
- Redis instance (Upstash recommended)
- Access to:
  - [Clerk](https://clerk.dev) for primary authentication
  - [GitHub Developer Settings](https://github.com/settings/developers) for OAuth
  - [Twitter Developer Portal](https://developer.twitter.com) for OAuth
  - [OpenRouter](https://openrouter.ai) for AI testing

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/pran.git
cd pran
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
# Database
DATABASE_URL="postgresql://username:password@hostname:port/database"

# Authentication - Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Authentication - NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=random-string-at-least-32-characters

# Platform OAuth - Twitter
TWITTER_API_KEY=...
TWITTER_API_SECRET=...

# Platform OAuth - GitHub
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Redis
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# AI Integration
OPENROUTER_API_KEY=...

# Security
ENCRYPTION_SECRET_KEY=random-string-at-least-32-characters
```

### 4. Initialize the Database

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Service Configuration

### Clerk Setup

1. Create a new application at [clerk.dev](https://clerk.dev)
2. Configure the following settings:
   - Enable Email/Password authentication
   - Set authorized redirect URLs to include `http://localhost:3000`
   - Create a webhook for the `user.created` event pointing to `/api/sync-user`

### NextAuth Setup

NextAuth is used for platform integrations:

#### GitHub OAuth

1. Go to GitHub Developer Settings > OAuth Apps > New OAuth App
2. Set the following:
   - Application name: PRAN Development
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Generate a client secret
4. Add the client ID and secret to your environment variables

#### Twitter OAuth

1. Create a project in the [Twitter Developer Portal](https://developer.twitter.com)
2. Add a new app within the project
3. Set the following:
   - Callback URL: `http://localhost:3000/api/auth/callback/twitter`
   - Website URL: `http://localhost:3000`
4. Under 'App permissions', select Read (User, Tweet)
5. Add the API key and secret to your environment variables

### OpenRouter Setup (for AI Testing)

1. Sign up at [OpenRouter](https://openrouter.ai)
2. Create an API key
3. Add the key to your environment variables
4. Test the AI integration at `/ai` route

### Redis Setup

1. Create a new Redis database at [Upstash](https://upstash.com/)
2. Get the REST URL and token from the console
3. Add them to your environment variables
4. Test Redis connectivity by running:
```bash
npm run check-redis
```

## Verification

To verify your setup is working:

1. Register a new user through Clerk
2. Connect your GitHub or Twitter account from the settings page
3. Check that platform connections are stored in the database

---

Last updated: May 19, 2025
NEXTAUTH_SECRET=$(openssl rand -base64 32)

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
ENCRYPTION_SECRET_KEY=$(openssl rand -base64 32)
```

### 4. Set Up Database

Create a PostgreSQL database and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Set Up Redis

Create an Upstash Redis database at [console.upstash.com](https://console.upstash.com) and add the REST URL and token to your environment variables.

Verify the connection:

```bash
npm run check-redis
```

### 6. Configure Authentication Providers

#### Clerk Setup

1. Create an application at [dashboard.clerk.dev](https://dashboard.clerk.dev)
2. Enable Email/Password and/or Social login providers (Google, Apple)
3. Configure your application URL and allowed redirect URLs
4. Set up a webhook to keep user data in sync with your database:
   - Endpoint: `https://your-domain.com/api/sync-user`
   - Events: `user.created`, `user.updated`, `user.deleted`

#### Platform OAuth Setup

1. **GitHub OAuth App**:
   - Navigate to [GitHub Developer Settings](https://github.com/settings/developers)
   - Create a new OAuth App
   - Set Homepage URL to your site URL
   - Set Authorization callback URL to `https://your-domain.com/api/auth/callback/github`
   - Copy Client ID and Client Secret to your environment variables

2. **Twitter OAuth App**:
   - Navigate to [Twitter Developer Portal](https://developer.twitter.com)
   - Create a new Project and App
   - Enable OAuth 2.0
   - Add `https://your-domain.com/api/auth/callback/twitter` as a callback URL
   - Set App permissions to Read
   - Copy API Key and Secret to your environment variables

### 7. Start Development Server

```bash
npm run dev
```

Access the application at http://localhost:3000

## Production Deployment

### Vercel Deployment (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add all environment variables in Vercel project settings
4. Deploy

### Database and Redis

1. Use Neon PostgreSQL for the database
2. Use Upstash Redis for caching
3. Add connection strings to environment variables

### GitHub Actions Setup

1. Add the following secrets to your GitHub repository:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

2. The GitHub Action will run automatically every 6 hours to update the Redis cache with working Nitter instances.

### Verify Production Setup

After deploying, verify your production setup:

```bash
npm run test:production
```

## Troubleshooting

### Database Connection Issues

1. Verify your PostgreSQL connection string
2. Check if your IP is allowed in the database firewall settings
3. Run `npx prisma db push` to ensure schema is up to date

### Redis Connection Issues

1. Verify your Redis connection details
2. Run `npm run check-redis` to test the connection
3. Check for any rate limiting issues

### OAuth Connection Issues

1. Verify callback URLs match exactly in both your code and OAuth provider settings
2. Check if scopes are correctly configured
3. Ensure environment variables are correctly set

### Clerk Authentication Issues

1. Verify Clerk webhook is configured correctly
2. Check if the sync-user API is working correctly
3. Ensure all required environment variables are set

For more detailed troubleshooting, see the [FAQ document](./faq.md).
