# PRAN - Frequently Asked Questions

> **Note**: This document addresses questions about the PRAN project, which is currently in early development. Some features mentioned are planned but not yet implemented.

This document addresses common questions that developers might have when working with the PRAN (Public Reputation and Analysis Node) project.

## General Questions

### What is PRAN?

PRAN (Public Reputation and Analysis Node) is a web application that helps users manage their online reputation across various platforms. It collects data from connected social accounts, provides analytics, and offers AI-powered insights to improve online presence.

### What is the current development status?

PRAN is in early development. Currently implemented:
- Basic project structure with Next.js
- Authentication framework (Clerk + NextAuth)
- Database schema
- Initial Twitter/X data access via Nitter (in progress)

Features under development or planned:
- Platform API integrations
- Data analysis capabilities
- AI-powered insights
- User dashboard with metrics

PRAN is built using:
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Authentication**: Clerk for primary auth, NextAuth for platform connections
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: OpenRouter API (accessing various LLMs)
- **Deployment**: Vercel for the application, Upstash for Redis, Supabase for PostgreSQL

## Development Environment

### How do I set up the development environment?

1. Clone the repository
2. Install dependencies with `npm install`
3. Copy `.env.example` to `.env.local` and fill in the required values
4. Run `npx prisma generate` to generate the Prisma client
5. Run `npx prisma migrate dev` to apply database migrations
6. Start the development server with `npm run dev`

### What environment variables do I need?

Essential environment variables include:
- `DATABASE_URL`: PostgreSQL connection string
- `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk authentication
- `NEXTAUTH_SECRET` and `NEXTAUTH_URL`: NextAuth configuration
- `TWITTER_API_KEY`, `TWITTER_API_SECRET`: Twitter OAuth credentials
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: GitHub OAuth credentials
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: Redis connection
- `OPENROUTER_API_KEY`: OpenRouter API access
- `ENCRYPTION_SECRET_KEY`: Used for encrypting OAuth tokens

### How do I work with the database?

PRAN uses Prisma ORM:
- View database schema in `prisma/schema.prisma`
- Run migrations with `npx prisma migrate dev`
- Reset development database with `npx prisma migrate reset`
- Open Prisma Studio with `npx prisma studio`

## Authentication

### Why does PRAN use two different authentication systems?

PRAN uses a dual authentication approach:
1. **Clerk**: For primary user authentication (signup, login, user management)
2. **NextAuth**: For connecting to third-party platforms via OAuth

This separation allows us to use specialized tools for each purpose while maintaining a cohesive user experience.

### How do user accounts connect to platform accounts?

1. Users first sign up using Clerk
2. The Clerk user is synced to our database via API
3. Users can then connect platforms using NextAuth OAuth flows
4. When a platform is connected, tokens are encrypted and stored in the database
5. The application can then access the platform APIs using these tokens

### How are OAuth tokens secured?

OAuth tokens are:
1. Encrypted using AES encryption before storage
2. Never exposed in client-side code
3. Stored with limited scopes to reduce risk
4. Refreshed automatically when possible

## Data Collection

### How does PRAN collect data from Twitter/X?

PRAN has two methods to access Twitter/X data:
1. **Official API**: Using the v2 API with user OAuth tokens
2. **Nitter Scraper**: As a fallback for public profile data when API limits are reached

### How often is data updated from connected platforms?

- **On-demand**: When a user views their dashboard or requests an update
- **Scheduled**: Background jobs run daily to refresh data
- **Event-based**: Some platforms provide webhooks for real-time updates

### What data is stored from connected platforms?

PRAN stores:
- Basic profile information (username, display name, avatar)
- Posts/tweets/content (including text, URLs, timestamps)
- Engagement metrics (likes, comments, shares, views)
- Calculated sentiment and analytics

## Nitter Scraper

### What is the Nitter scraper?

The Nitter scraper is a component that:
1. Finds working Nitter instances (Twitter/X alternative frontends)
2. Scrapes public profile data when direct API access is limited
3. Caches working instances in Redis
4. Updates available instances via GitHub Actions every 6 hours

### Why use a scraper instead of just the API?

Twitter/X API access has:
- Rate limits that can be restrictive
- Tier-based pricing that can be expensive
- Access requirements that can change

The Nitter scraper provides a fallback mechanism for basic public profile data.

### Is the Nitter scraper used in production?

Yes, but with limitations:
- Only used for public profile data, not authenticated actions
- Implements respectful scraping practices
- Has fallback mechanisms when scrapers are unavailable
- Caches results to minimize requests

## AI Integration

### What AI capabilities does PRAN offer?

PRAN's AI integration provides:
- Sentiment analysis of posts/tweets
- Performance report generation
- Content improvement suggestions
- Answers to reputation management questions

### How is AI integrated into the application?

The application uses:
- Server actions to make secure API calls
- Streaming responses for a responsive UI
- Structured prompts for consistent results
- OpenRouter API to access various AI models

### Can AI in PRAN access my social media accounts directly?

No, the AI does not have direct access to your accounts. It analyzes:
- Data that has already been collected by PRAN
- Information that you explicitly share in prompts

## Performance and Scaling

### How does PRAN handle database scaling?

- Uses Prisma for efficient query optimization
- Implements proper indexing on frequently accessed fields
- Employs connection pooling for high-traffic scenarios
- Separates critical operations into different database operations

### How is performance optimized in the application?

- React Server Components for efficient rendering
- Streaming responses for AI-generated content
- Redis caching for frequently accessed data
- Optimized database queries with proper indexes
- CDN integration for static assets

### What should I consider for high-traffic deployments?

For high-traffic scenarios:
- Scale database connections appropriately
- Implement more aggressive caching strategies
- Consider read replicas for database scaling
- Evaluate serverless vs. container deployments
- Monitor resource usage and response times

## Troubleshooting

### How do I debug authentication issues?

1. Check Clerk dashboard for user status
2. Verify NextAuth configuration (callback URLs, credentials)
3. Examine server logs for authentication errors
4. Ensure environment variables are correctly set
5. Verify database user records exist

### What should I do if platform connections fail?

1. Check if platform API status is operational
2. Verify OAuth credentials and callback URLs
3. Ensure scopes are correctly configured
4. Check token encryption/decryption functionality
5. Verify Redis connection for cached data

### How can I troubleshoot Nitter scraper issues?

1. Run `npm run check-redis` to verify Redis connection
2. Use `npm run test:scraper` to test scraper functionality
3. Check GitHub Actions logs for update failures
4. Verify hardcoded fallback instances are current
5. Examine browser detection and bypass techniques

## Feature Requests and Contributions

### How can I contribute to PRAN?

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with tests and documentation
4. Follow the coding standards and conventions
5. Engage in code review process

### What features are planned for future releases?

Planned enhancements include:
- Additional platform integrations (LinkedIn, Instagram)
- Advanced analytics dashboard
- Automated reputation monitoring
- Content calendar and scheduling
- Customizable reports and exports
- Mobile application

---

Last updated: May 18, 2025

If you have a question not covered here, please open an issue on the GitHub repository.
