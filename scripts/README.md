# Scripts Directory

> **Note**: These scripts support functionality that is still under development. Some features may not be fully implemented yet.

This directory contains utility scripts for managing the PRAN application and its components.

## Development Status

| Script | Status |
|--------|--------|
| Redis connectivity check | Implemented ✓ |
| Nitter instance updating | In development |
| Production testing | In development |

## Nitter Scraper Scripts

- **`update-nitter-instances.js`**: Updates the Redis cache with working Nitter instances.
  - Primarily run by GitHub Actions on a schedule
  - Can be run manually for immediate updates
  - Requires Redis credentials in environment variables

- **`check-redis-combined.js`**: Unified script for checking Redis configuration.
  - Usage: `node check-redis-combined.js [nitter]`
  - Without args: Tests basic Redis connectivity
  - With `nitter` arg: Checks for cached Nitter instances
  - (Replaces legacy `check-redis.js` and `check-redis-nitter.js`)

- **`test-production-merged.js`**: Tests if the Nitter scraper works in production mode.
  - Usage: `node test-production-merged.js [simple]`
  - Without args: Detailed test with fallbacks
  - With `simple` arg: Quick test of Redis cache only
  - (Replaces legacy `test-production.js` and `test-production-simple.js`)

## Database Management

- **`seed-test-data.js`**: Seeds the database with sample data for testing.
  - Usage: `node seed-test-data.js`
  - Creates sample users, platform connections, and posts
  - Safe to run in development, will log conflicts without error

- **`cleanup-old-data.js`**: Maintenance script to remove stale data.
  - Usage: `node cleanup-old-data.js [--dry-run]`
  - Removes posts and metrics older than the configured threshold
  - Use `--dry-run` to see what would be deleted without making changes

## CI/CD Scripts

- **`simulate-github-action.js`**: Simulates the GitHub Action environment locally.
  - Tests the Nitter update workflow without triggering actual GitHub Actions
  - Helpful for debugging workflow issues

- **`pre-deploy-check.js`**: Runs pre-deployment validation checks.
  - Verifies database connection
  - Checks Redis availability
  - Validates critical environment variables
  - Should be run before deploying to production

## System Status

- **`check-platform-apis.js`**: Tests platform API connectivity.
  - Usage: `node check-platform-apis.js [platform]`
  - Validates API credentials and connectivity
  - Available platforms: `twitter`, `github`

- **`status-report.js`**: Generates a system status report.
  - Checks all critical components (database, Redis, APIs)
  - Outputs a JSON or text report of system health
  - Useful for monitoring and diagnostics

## Script Usage in package.json

These scripts are configured as npm commands in `package.json`:

```json
"scripts": {
  "check-redis": "node scripts/check-redis-combined.js",
  "check-nitter": "node scripts/check-redis-combined.js nitter",
  "test:scraper": "jest --testPathPattern=scrapers",
  "test:production": "node scripts/test-production-merged.js",
  "test:prod-simple": "node scripts/test-production-merged.js simple",
  "update-nitter": "node scripts/update-nitter-instances.js",
  "simulate:action": "node scripts/simulate-github-action.js",
  "pre-deploy": "node scripts/pre-deploy-check.js",
  "platform-status": "node scripts/check-platform-apis.js"
}
```

## Security Considerations

1. Several scripts require environment variables with sensitive credentials
2. For local development, keep a `.env.local` file with development credentials
3. Never commit `.env` files or logs containing credentials
4. Scripts with destructive operations have safeguards and confirmation prompts

---

Last updated: May 18, 2025

- **`verify-production-setup.js`**: Verifies that the production environment is correctly set up.

## NPM Scripts

These scripts are defined in package.json for easier access:

```
npm run update-nitter        # Updates Nitter instances in Redis
npm run check-redis          # Checks Redis configuration
npm run check-nitter         # Checks cached Nitter instances
npm run test:production      # Runs detailed production test
npm run test:prod-simple     # Runs simple production test
npm run simulate:action      # Simulates GitHub Action
```
