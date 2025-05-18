# PRAN API Documentation

> **Development Status**: This document describes both currently implemented API endpoints and planned functionality. The API is under active development and subject to change.

This document provides information about the API endpoints available in the PRAN system.

## Current Implementation Status

- **User Synchronization API**: Implemented for Clerk integration
- **NextAuth Authentication**: Implemented for platform OAuth connections
- **Server Actions**: Partially implemented
- **AI Analysis**: Planned for future development

### Authorization

For API requests, you will need to include the appropriate authentication headers:

- Clerk authentication uses JWT tokens
- NextAuth uses session cookies or JWT tokens based on configuration

## API Endpoints

### User Synchronization

Synchronizes user data between Clerk and the PRAN database.

#### `POST /api/sync-user`

Used by Clerk webhooks to keep user data in sync.

**Request Body:**

```json
{
  "userId": "clerk_user_id"
}
```

**Response:**

```json
{
  "message": "User synced"
}
```

**Status Codes:**
- `200 OK` - Successful operation
- `400 Bad Request` - Missing userId
- `500 Internal Server Error` - Failed to sync user

**Usage Example:**

```javascript
const response = await fetch('/api/sync-user', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'user_2KGLCbvZrCYgBhXd9dYyMbEvfxl',
  }),
});

const data = await response.json();
```

### NextAuth Authentication

Handles platform-specific OAuth authentication flows.

#### `GET|POST /api/auth/[...nextauth]`

This is a catch-all route that handles all NextAuth operations, including:
- Sign in
- Callback processing
- Session management
- Token handling

NextAuth handles the OAuth flow automatically, so you generally don't need to interact with these endpoints directly.

**Platform Providers:**

1. **GitHub Provider**
   - Scopes: `read:user`, `user:email`
   - Profile data accessed: user profile, email, repositories

2. **Twitter/X Provider**
   - Scopes: `users.read`, `tweet.read`, `offline.access`
   - Profile data accessed: user profile, tweets, metrics

**Usage Example (Client-Side):**

```javascript
// In React component
import { signIn } from "next-auth/react";

// Trigger GitHub sign-in
const connectGitHub = () => {
  signIn("github", { 
    redirect: true,
    callbackUrl: "/settings/connections" 
  });
};

// Trigger Twitter sign-in
const connectTwitter = () => {
  signIn("twitter", { 
    redirect: true,
    callbackUrl: "/settings/connections" 
  });
};
```

## Server Actions

In addition to REST API endpoints, PRAN uses Next.js Server Actions for secure server-side operations.

### Platform Actions

#### `connectPlatform`

Connects a user to a new platform using OAuth.

**Parameters:**
- `platform` - The platform type (e.g., "GITHUB", "TWITTER")
- `userId` - The user's database ID

**Returns:**
- Authentication URL for the OAuth flow

#### `disconnectPlatform`

Removes a platform connection for a user.

**Parameters:**
- `connectionId` - The ID of the platform connection to remove

**Returns:**
- Success status and message

### AI Actions

#### `analyzeContent`

Performs AI analysis on user content.

**Parameters:**
- `content` - The text content to analyze
- `userId` - The user's database ID
- `type` - The type of analysis to perform (e.g., "sentiment", "topics")

**Returns:**
- AI analysis results and recommendations

## Error Handling

All API endpoints follow a consistent error format:

```json
{
  "error": "Error message here",
  "details": {
    // Optional additional error details
  }
}
```

Common error status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (server-side issue)

## Rate Limiting

API endpoints have the following rate limits:

- `/api/sync-user`: 60 requests per minute
- Authentication endpoints: 30 requests per minute per IP

## Webhooks

### Clerk Webhooks

PRAN listens for the following Clerk webhook events:
- `user.created`
- `user.updated`
- `user.deleted`

These events trigger the sync-user API to update the local database.

## API Versioning

The current API version is unversioned. Future releases will implement versioning using URL path prefixes (e.g., `/api/v1/`).

## Data Formats

All API responses are in JSON format with UTF-8 encoding.

Dates follow the ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`
