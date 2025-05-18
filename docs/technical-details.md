# Technical Implementation Details

This document provides in-depth technical details about the Nitter scraper implementation for developers who need to modify or extend the system.

## Code Structure

### Core Files

- **`lib/scrapers/getWorkingNitter.ts`**: Main logic for finding working Nitter instances
- **`lib/scrapers/isAlive.ts`**: Functions to verify if a Nitter instance is working
- **`lib/scrapers/getCachedNitter.ts`**: Interface for simpler access to working instances
- **`scripts/update-nitter-instances.js`**: Script run by GitHub Actions to update Redis

### GitHub Actions

- **`.github/workflows/update-nitter.yml`**: Workflow definition that runs every 6 hours

### Test Files

- **`__tests__/scrapers.test.ts`**: Tests for the scraper functionality
- **`scripts/test-production.js`**: Tests the production configuration
- **`scripts/test-production-simple.js`**: Simplified version for quick checks

## Implementation Details

### Conditional Imports

The system uses conditional imports to avoid including Playwright in the production bundle:

```typescript
// In development, conditionally import Playwright
let playwright: typeof import('playwright') | null = null;

// Only in development environment, load the playwright module
if (process.env.NODE_ENV === 'development') {
  try {
    // Dynamic import for Playwright (only in development)
    playwright = require('playwright');
  } catch (e) {
    console.warn('Playwright not available, falling back to HTTP requests');
  }
}
```

This approach ensures:
- TypeScript knows the correct types for Playwright
- Production builds don't include the large Playwright dependency
- The system gracefully falls back if Playwright isn't available

### Redis Integration

The system uses Upstash Redis for caching working Nitter instances:

```typescript
// Connect to Redis if credentials are available
function getRedisClient() {
  if (!Redis || !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.log("[Cache] Redis not available or credentials missing in .env, skipping cache");
    return null;
  }
  
  console.log("[Cache] Connecting to Redis...");
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}
```

Redis caching uses:
- Key: `"nitter:base_url"`
- TTL: 8 hours (longer than the GitHub Action frequency)

### Browser Automation

The system uses Playwright for browser-based scraping in development:

```typescript
// Browser-based check (development)
async function isAliveBrowser(url: string): Promise<boolean> {
  // Create browser context with realistic user agent
  // Navigate to test URL
  // Check for successful response
  // Wait for and verify tweets are present
}
```

Key browser automation features:
- Realistic user agent to avoid detection
- Proper viewport settings
- Reasonable timeouts
- Detailed error handling

### HTTP Fallbacks

For production or when Playwright isn't available, the system uses HTTP-based checks:

```typescript
// HTTP-based check (production)
async function isAliveHttp(url: string): Promise<boolean> {
  // Make HTTP request with realistic headers
  // Parse response with JSDOM
  // Verify tweets are present
}
```

HTTP fallbacks include:
- Browser-like headers to avoid detection
- JSDOM for HTML parsing
- Similar verification logic to browser checks

### Error Handling

The system implements comprehensive error handling:

```typescript
try {
  // Attempt to find working instance
} catch (error) {
  // Log error details
  // Try fallback approaches
  // Return hardcoded fallback if all else fails
}
```

Error handling includes:
- Detailed logging with context
- Multiple fallback mechanisms
- Graceful degradation

### GitHub Actions Integration

The GitHub Actions workflow runs the update script periodically:

```yaml
name: Update Nitter Instances

on:
  schedule:
    # Run every 6 hours
    - cron: '0 */6 * * *'
  # Allow manual trigger
  workflow_dispatch:
```

The workflow:
- Sets up Node.js and Playwright
- Runs the update script with necessary environment variables
- Reports success or failure

## Performance Considerations

1. **Browser Resource Usage**:
   - Browser instances are shared and reused when possible
   - Contexts are properly closed to free resources
   - Browser is only used in development

2. **Redis Optimization**:
   - Cache TTL is set to balance freshness and request frequency
   - Proper error handling for Redis connection issues
   - Single key design for simplicity and performance

3. **GitHub Actions Resource Usage**:
   - Actions run every 6 hours to avoid excessive usage
   - Script includes timeouts to prevent hanging workflows
   - Failures are reported for monitoring

## Security Considerations

1. **Credentials Management**:
   - Redis credentials are stored as environment variables
   - GitHub secrets are used for Actions workflow
   - No credentials are exposed in code

2. **Bot Detection Avoidance**:
   - Realistic user agent and headers
   - Browser fingerprint mimics real users
   - Proper handling of Referer header

3. **Error Exposure**:
   - Detailed logs for debugging but sanitized error messages
   - No sensitive information in error responses
   - Fallbacks to avoid exposing system details to users

## Future Enhancements

Potential improvements for future versions:

1. **Multiple Instance Support**:
   - Store and rotate between multiple working instances
   - Regional optimization for different users

2. **Enhanced Monitoring**:
   - Slack/Discord notifications for failures
   - Performance metrics collection
   - Uptime tracking for instances

3. **Intelligent Selection**:
   - Machine learning for predicting instance reliability
   - Traffic-based instance selection
   - Load balancing between instances

---

Last updated: May 18, 2025
