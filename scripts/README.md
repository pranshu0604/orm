# Scripts Directory

This directory contains utility scripts for managing the Nitter scraper system.

## Main Scripts

- **`update-nitter-instances.js`**: Updates the Redis cache with working Nitter instances. This script is typically run by GitHub Actions on a schedule.

- **`check-redis-combined.js`**: Checks Redis configuration and cached Nitter instances.
  - Usage: `node check-redis-combined.js [nitter]`
  - Without args: Tests basic Redis connectivity
  - With `nitter` arg: Checks for cached Nitter instances

- **`test-production-merged.js`**: Tests if the Nitter scraper works in production mode.
  - Usage: `node test-production-merged.js [simple]`
  - Without args: Detailed test with fallbacks
  - With `simple` arg: Quick test of Redis cache only

## Utility Scripts

- **`simulate-github-action.js`**: Simulates the GitHub Action environment locally for testing.

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
