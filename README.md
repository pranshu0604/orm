P.R.A.N. – Public Reputation and Analysis Node

## Features

### Twitter/X Data Scraping via Nitter
- Browser-based scraping in development using Playwright
- Redis-cached instances for better performance 
- GitHub Actions scheduled updates in production
- Multiple fallback mechanisms for reliability

![Nitter Scraper Architecture](/public/images/nitter-scraper-architecture.png)

## Tech Stack

- NextJS
- TailwindCSS
- Clerk for authentication
- OpenRouter (with Gemini models) for AI features
- Upstash Redis for caching
- Playwright for browser automation (dev only)
- GitHub Actions for scheduled tasks
- Crypto-js for encryption

## Configuration

See the [Nitter Scraper Documentation](./docs/README.md) for comprehensive documentation about the Twitter/X data scraping functionality, including setup instructions, architecture details, and troubleshooting information.
