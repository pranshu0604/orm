# PRAN Contributor's Guide

This guide is designed to help developers understand how to contribute to the PRAN (Public Reputation and Analysis Node) project.

## Project Structure

The PRAN project is organized as follows:

```
app/              # Next.js App Router structure
├── actions/      # Server actions
├── api/          # API routes (auth, sync-user)
├── hooks/        # React hooks (useSyncClient)
├── providers/    # Context providers
└── settings/     # Settings pages
components/       # UI components (LayoutHeader, ThemeSwitch)
docs/             # Project documentation
lib/              # Core utility libraries
├── scrapers/     # Twitter/Nitter scraping utilities
prisma/           # Database schema and migrations
public/           # Static assets and diagrams
scripts/          # Utility scripts
utils/            # Helper functions
```

## Development Workflow

### 1. Setting Up a Development Environment

Follow the [Installation Guide](./installation-guide.md) to set up your development environment.

### 2. Development Branching Strategy

- `main` - The production branch, always deployable
- `develop` - Development branch for integration of features
- `feature/*` - Feature branches for new functionality
- `bugfix/*` - Branches for bug fixes
- `docs/*` - Documentation updates

### 3. Commit Message Format

We use conventional commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Examples:
- `feat(auth): add OAuth connection for GitHub`
- `fix(scraper): resolve Redis connection timeouts`
- `docs(readme): update installation instructions`

### 4. Pull Request Process

1. Create a feature branch from `develop`
2. Implement your changes
3. Write or update tests
4. Update documentation
5. Submit a PR to `develop`
6. Request review from maintainers

### 5. Testing

We use Jest for unit and integration testing. Run tests with:

```bash
npm test
```

For testing specific components:

```bash
npm test -- scrapers
```

### 6. Documentation

When adding new features, please update the relevant documentation:

- Add to relevant section in `docs/README.md`
- Update technical details in `docs/technical-details.md`
- Add API documentation if adding new endpoints

## Core Components

### Authentication System

The authentication system uses:
- **Clerk** for primary user authentication
- **NextAuth** for platform OAuth connections

### Database Schema

The current schema includes:
- `User` - Core user profile information
- `PlatformConnection` - OAuth connections to social platforms

### Nitter Scraper

The Twitter/X data access component currently in development:
- Uses Redis to cache working Nitter instances
- Implements fallback mechanisms for reliability

## Core Concepts

### Authentication System

PRAN uses a dual-authentication approach:

- **Clerk** - Primary user authentication and management
- **NextAuth** - For social platform OAuth connections

### Database Schema

The main entities are:

- `User` - Core user profile information
- `PlatformConnection` - OAuth connections to social platforms
- `Post` - Content retrieved from social platforms
- `Analysis` - AI-generated analysis of content
- `Report` - Aggregated metrics and insights

### Platform Integration Architecture

Adding a new platform integration requires:

1. Adding a provider to NextAuth configuration
2. Implementing the data fetching logic
3. Creating the platform-specific analysis rules
4. Updating the UI to display platform data

### Working with the Scraper

The Nitter scraper architecture:

1. Maintains a list of working instances in Redis
2. Uses Playwright for browser automation in development
3. Uses GitHub Actions for scheduled updates in production
4. Implements fallback mechanisms for reliability

### AI Integration

The AI system uses:

1. OpenRouter API to access Gemini models
2. Prompt templates for specific analysis tasks
3. Caching to minimize API calls and costs

## Adding New Features

### Adding a New Platform

To add a new platform (e.g., LinkedIn):

1. Add the OAuth provider to NextAuth in `app/api/auth/[...nextauth]/route.ts`
2. Update the `PlatformType` enum in Prisma schema
3. Implement the platform-specific API client in `lib/platforms/[platform].ts`
4. Add platform-specific components to the UI
5. Update the documentation

### Adding New AI Features

To add a new AI analysis type:

1. Create a new prompt template in `lib/ai/prompts.ts`
2. Implement the analysis logic in `app/actions/ai.ts`
3. Add the UI components for displaying the analysis
4. Update the documentation

## Troubleshooting Common Issues

### OAuth Connection Issues

- Ensure callback URLs are correctly configured
- Check scopes are properly defined
- Verify tokens are being correctly encrypted

### Database Migration Issues

- Run `npx prisma migrate reset` to reset the database
- Fix any schema conflicts before creating new migrations
- Always test migrations on a staging database first

### Scraper Issues

- Run `npm run check-redis` to verify Redis connection
- Check Nitter instance availability with `npm run test:production`
- Inspect browser automation logs in development

### AI Integration Issues

- Verify OpenRouter API key is correctly set
- Check rate limits and quotas
- Review prompt templates for potential improvements

## Getting Help

- Create an issue in the project repository
- Reach out to maintainers via the project Discord
- Check the [FAQ](./faq.md) for common questions

---

Last updated: May 19, 2025
