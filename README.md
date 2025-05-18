# P.R.A.N. – Public Reputation and Analysis Node

PRAN is an all-in-one platform for managing your online presence and reputation across multiple social media platforms. It helps users analyze, track, and improve their digital footprint with AI-powered insights.

## Key Features

### Cross-Platform Social Media Integration
- Connect multiple social platforms (X/Twitter, GitHub, more coming soon)
- Seamless integration via dual authentication system (Clerk + NextAuth)
- Secure token storage with encryption for API access

### Data Analysis & Insights
- Post sentiment analysis with AI
- Engagement metrics tracking
- Performance reports with actionable insights
- AI-generated improvement suggestions

### Twitter/X Data Access via Nitter
- Browser-based scraping in development using Playwright
- Redis-cached instances for better performance 
- GitHub Actions scheduled updates in production
- Multiple fallback mechanisms for reliability

![Platform Architecture](/public/images/platform-architecture.png)

## Tech Stack

### Frontend
- Next.js 15+ (with App Router)
- React 19
- TailwindCSS for styling
- Light/dark theme support

### Authentication & Security
- Clerk for primary user authentication (Google/Apple login)
- NextAuth for social platform connections (X/Twitter, GitHub)
- Crypto-js for secure token encryption

### Backend & Data
- Prisma ORM with PostgreSQL (Neon)
- Upstash Redis for caching
- OpenRouter (with Gemini models) for AI features
- Playwright for browser automation (dev only)
- GitHub Actions for scheduled tasks

## Documentation

- [Main Project Documentation](./docs/README.md) - Comprehensive overview of the entire system
- [Installation Guide](./docs/installation-guide.md) - Complete setup instructions for developers
- [Deployment Guide](./docs/deployment-guide.md) - Instructions for deploying to production
- [Technical Implementation Details](./docs/technical-details.md) - In-depth technical information for developers
- [API Documentation](./docs/api-documentation.md) - Reference guide for API endpoints and usage
- [Platform Integration Examples](./docs/platform-integration-examples.md) - Detailed examples for platform integrations
- [Contributor's Guide](./docs/contributors-guide.md) - Guidelines for contributing to the project
- [AI Integration](./docs/ai-integration.md) - Documentation about AI features and implementation
- [FAQ](./docs/faq.md) - Frequently asked questions about the project
