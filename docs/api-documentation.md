# PRAN API Documentation

This document provides information about the currently implemented API endpoints in the PRAN system.

## Implemented API Endpoints

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

**Implementation:**

```typescript
// app/api/sync-user/route.ts
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const clerkUser = await clerkClient.users.getUser(userId);

    const email: string = clerkUser.emailAddresses[0]?.emailAddress || "";
    const name: string = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ");
    const image: string = clerkUser.imageUrl;

    // Update or create user in database
    await prisma.user.upsert({
      where: { clerkId: userId },
      update: { email, name, image },
      create: { clerkId: userId, email, name, image },
    });

    return NextResponse.json({ message: "User synced" });
  } catch (err) {
    console.error("Error syncing user:", err);
    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}
```

### NextAuth Authentication

Handles platform-specific OAuth authentication flows.

#### `GET|POST /api/auth/[...nextauth]`

This is a catch-all route that handles NextAuth operations, including sign-in and OAuth callbacks.

**Implemented OAuth Providers:**

1. **GitHub Provider**
   - Scopes: `read:user`, `user:email`

2. **Twitter/X Provider**
   - Scopes: `users.read`, `tweet.read`, `offline.access`

**Implementation:**

```typescript
// In app/api/auth/[...nextauth]/route.ts
export const authOptions: AuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: "read:user user:email" } },
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_API_KEY!,
      clientSecret: process.env.TWITTER_API_SECRET!,
      version: "2.0",
      authorization: {
        params: { scope: "users.read tweet.read offline.access" }
      }
    }),
  ],
  // Additional configuration...
};
```

## Error Handling

All API endpoints follow a consistent error format:

```json
{
  "error": "Error message here"
}
```

---

Last updated: May 19, 2025

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
