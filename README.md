# P.R.A.N. – Public Reputation and Analysis Node

PRAN is an all-in-one platform for managing your online presence and reputation across multiple social media platforms. It helps users analyze, track, and improve their digital footprint with AI-powered insights.

## Current Implementation Status

PRAN is in early development with the following features implemented:

- Authentication system (Clerk + NextAuth)
- Platform connections for Twitter/X and GitHub
- Database schema and migrations
- Redis integration for caching
- Basic AI integration test with OpenRouter
- Twitter/X data access via Nitter (in development)

## Key Features

### Cross-Platform Social Media Integration
- Connect multiple social platforms (X/Twitter, GitHub)
- Seamless integration via dual authentication system (Clerk + NextAuth)
- Secure token storage with encryption for API access

### Twitter/X Data Access via Nitter
- Browser-based scraping in development using Playwright
- Redis-cached instances for better performance 
- Multiple fallback mechanisms for reliability

![Platform Architecture](/public/images/platform-architecture.png)

## Tech Stack

### Frontend
- Next.js 15+ (with App Router)
- React 19
- TailwindCSS for styling
- Light/dark theme support

### Authentication & Security
- Clerk for primary user authentication
- NextAuth for social platform connections (X/Twitter, GitHub)
- Crypto-js for secure token encryption

### Backend & Data
- Prisma ORM with PostgreSQL
- Upstash Redis for caching
- OpenRouter API for AI testing
- Playwright for browser automation (in development)

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Generate Prisma client: `npx prisma generate`
5. Run database migrations: `npx prisma migrate dev`
6. Start development server: `npm run dev`

For detailed setup instructions, see the [Installation Guide](./docs/installation-guide.md).

## Documentation

---

Last updated: May 18, 2025
- [Installation Guide](./docs/installation-guide.md) - Setup instructions for development
- [Technical Implementation Details](./docs/technical-details.md) - Technical information for developers
- [API Documentation](./docs/api-documentation.md) - Reference for current API endpoints
- [Platform Integration Examples](./docs/platform-integration-examples.md) - Examples for platform integrations
- [Contributor's Guide](./docs/contributors-guide.md) - Guidelines for contributing to the project
- [AI Integration](./docs/ai-integration.md) - Documentation for planned AI features
- [FAQ](./docs/faq.md) - Frequently asked questions about the project
