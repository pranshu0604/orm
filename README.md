# P.R.A.N. – Public Reputation and Analysis Node

PRAN is an all-in-one platform for managing your online presence and reputation across multiple social media platforms. It helps users analyze, track, and improve their digital footprint with AI-powered insights.

> **Note**: PRAN is currently under active development. This document describes both implemented features and planned functionality.

## Key Features

### Cross-Platform Social Media Integration
- Connect multiple social platforms (X/Twitter, GitHub, more coming soon)
- Seamless integration via dual authentication system (Clerk + NextAuth)
- Secure token storage with encryption for API access

### Data Analysis & Insights
- Post sentiment analysis with AI *(under development)*
- Engagement metrics tracking *(under development)*
- Performance reports with actionable insights *(under development)*
- AI-generated improvement suggestions *(under development)*

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

- [Main Project Documentation](./docs/README.md) - Overview of the current and planned features
- [Development Roadmap](./docs/roadmap.md) - Current status and future development plans
- [Installation Guide](./docs/installation-guide.md) - Setup instructions for development
- [Technical Implementation Details](./docs/technical-details.md) - Technical information for developers
- [API Documentation](./docs/api-documentation.md) - Reference for current API endpoints
- [Platform Integration Examples](./docs/platform-integration-examples.md) - Examples for platform integrations
- [Contributor's Guide](./docs/contributors-guide.md) - Guidelines for contributing to the project
- [AI Integration](./docs/ai-integration.md) - Documentation for planned AI features
- [FAQ](./docs/faq.md) - Frequently asked questions about the project
