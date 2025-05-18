# Scripts Directory

This directory contains utility scripts for managing the PRAN application, with a focus on the Nitter scraper and Redis connectivity testing.

## Available Scripts

### Redis Management Scripts

- **`check-redis-combined.js`**: Tests Redis connectivity and cached Nitter instances.
  ```bash
  # Test basic Redis connectivity
  node check-redis-combined.js
  
  # Test cached Nitter instances
  node check-redis-combined.js nitter
  ```

### Nitter Scraper Scripts

- **`update-nitter-instances.js`**: Updates the Redis cache with working Nitter instances.
  ```bash
  node update-nitter-instances.js
  ```
  
  Required environment variables:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  
  This script:
  1. Tests multiple Nitter instances for availability
  2. Stores working instances in Redis cache
  3. Sets a 1-hour expiration time

- **`test-production-merged.js`**: Tests the Nitter scraper functionality.
  ```bash
  # Run detailed test with fallbacks
  node test-production-merged.js
  
  # Run quick test of Redis cache only
  node test-production-merged.js simple
  ```

### Development Testing

- **`simulate-github-action.js`**: Simulates the GitHub Action environment locally.
  ```bash
  node simulate-github-action.js
  ```
  
  This script:
  1. Sets up required environment variables
  2. Runs the Nitter update script
  3. Logs output similar to what would appear in GitHub Actions

- **`verify-production-setup.js`**: Validates that the production environment is properly configured.
  ```bash
  node verify-production-setup.js
  ```
  
  Checks:
  - Redis connectivity
  - Database connectivity
  - Environment variables
  - API endpoint access

## Script Development Status

| Script | Status |
|--------|--------|
| Redis connectivity check | Implemented ✓ |
| Nitter instance updating | Implemented ✓ |
| Production testing | Implemented ✓ |
| GitHub Action simulation | Implemented ✓ |

## Usage Notes

1. These scripts work best when run from the project root:
   ```bash
   npm run check-redis
   # or
   node scripts/check-redis-combined.js
   ```
   
2. All scripts respect the environment variables in `.env.local` when run locally.

3. Scripts requiring Redis or database access will output clear error messages when credentials are missing or incorrect.

---

Last updated: May 18, 2025

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
