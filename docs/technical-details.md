# Technical Implementation Details

This document provides technical details about the PRAN (Public Reputation and Analysis Node) implementation for developers who need to modify or extend the system.

## Implementation Status

| Component | Status |
|-----------|--------|
| Next.js app structure | Implemented ✓ |
| Authentication system | Implemented ✓ |
| Database schema | Implemented ✓ |
| Platform OAuth integration | Implemented ✓ |
| Twitter/X data scraping | In development |
| AI integration test | Implemented ✓ |
| Redis caching | Implemented ✓ |

## Project Structure

```
app/                  # Next.js app router structure
  actions/            # Server actions
  api/                # API routes
  hooks/              # React hooks
  providers/          # React context providers
  settings/           # Settings pages
components/           # Reusable UI components
docs/                 # Documentation
lib/                  # Core libraries
  scrapers/           # Nitter scraper implementation
prisma/               # Database schema and migrations
public/               # Static assets
scripts/              # Utility scripts
utils/                # Helper utilities
```

## Authentication Architecture

PRAN implements a dual authentication system:

### Primary Authentication (Clerk)

```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/api/sync-user", "/api/auth/(.*)"],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

Clerk handles the main user authentication:

- Handles user registration, login, and profile management
- Provides secure session management
- Syncs user data to the application database

### Platform OAuth (NextAuth)

```typescript
// app/api/auth/[...nextauth]/route.ts
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
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.accessToken = token.accessToken as string;
        session.provider = token.provider as string;
      }
      return session;
    },
  },
};

export const handlers = NextAuth(authOptions);
export { handlers as GET, handlers as POST };
```

NextAuth is used specifically for platform connections:

- Manages OAuth flows with Twitter/X and GitHub
- Securely handles and stores access tokens
- Integrates with the primary user system

### Authentication Flow

```
┌───────────┐         ┌───────────┐         ┌───────────┐
│           │         │           │         │           │
│   User    │────────▶│   Clerk   │────────▶│ Database  │
│           │         │           │         │           │
└───────────┘         └───────────┘         └───────────┘
                                                  │
                                                  │
                                                  ▼
┌───────────┐         ┌───────────┐         ┌───────────┐
│           │         │           │         │           │
│ Platform  │◀────────│ NextAuth  │◀────────│   PRAN    │
│           │         │           │         │   App     │
└───────────┘         └───────────┘         └───────────┘
```

### User Synchronization

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
    
    // Update user in database
    await prisma.user.upsert({
      where: { clerkId: userId },
      update: { 
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" "),
        image: clerkUser.imageUrl
      },
      create: { 
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" "),
        image: clerkUser.imageUrl
      },
    });

    return NextResponse.json({ message: "User synced" });
  } catch (err) {
    console.error("Error syncing user:", err);
    return NextResponse.json(
      { error: "Failed to sync user" }, 
      { status: 500 }
    );
  }
}
```

## Database Schema

```prisma
// prisma/schema.prisma
model User {
  id                  String               @id @default(cuid())
  clerkId             String               @unique
  email               String               @unique
  name                String?
  image               String?
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  platformConnections PlatformConnection[]
}

model PlatformConnection {
  id           String       @id @default(cuid())
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId       String
  platform     PlatformType
  platformId   String
  accessToken  String
  refreshToken String?
  expiresAt    DateTime?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@unique([userId, platform])
  @@index([userId])
}

enum PlatformType {
  TWITTER
  GITHUB
}
```

## Redis Integration

PRAN uses Redis for caching Nitter instances:

```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Usage for caching working Nitter instances
export async function getCachedWorkingNitters(): Promise<string[]> {
  try {
    const cachedNitters = await redis.get<string[]>('working_nitters');
    return cachedNitters || [];
  } catch (error) {
    console.error('Error getting cached Nitters:', error);
    return [];
  }
}
```

## AI Integration (Test Implementation)

```typescript
// app/actions/ai.ts
export async function getStreamingAiCompletion(userPrompt: string): Promise<ReadableStream<Uint8Array>> {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "X-Title": "P.R.A.N. - Public Reputation and Analysis Node",
    },
  });

  const messages = [
    {
      role: "system",
      content: "You are a helpful assistant for online reputation management."
    },
    {
      role: "user",
      content: userPrompt
    }
  ];

  const stream = await openai.chat.completions.create({
    model: "google/gemma-3-27b-it:free", 
    messages: messages,
    stream: true, 
  });

  // Create and return ReadableStream
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          controller.enqueue(encoder.encode(content));
        }
      }
      controller.close();
    },
  });
}
```

## Platform Token Storage

PRAN securely stores OAuth tokens using encryption:

```typescript
// lib/encryption.ts
import CryptoJS from 'crypto-js';

export function encryptToken(token: string): string {
  return CryptoJS.AES.encrypt(
    token,
    process.env.ENCRYPTION_SECRET_KEY || 'default-key'
  ).toString();
}

export function decryptToken(encryptedToken: string): string {
  const bytes = CryptoJS.AES.decrypt(
    encryptedToken,
    process.env.ENCRYPTION_SECRET_KEY || 'default-key'
  );
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

## Nitter Scraper (In Development)

PRAN implements a Nitter scraper system to access Twitter/X data:

```typescript
// lib/scrapers/getWorkingNitter.ts
import { redis } from '../redis';
import { isNitterAlive } from './isAlive';

const NITTER_INSTANCES = [
  'https://nitter.net',
  'https://nitter.kavin.rocks',
  'https://nitter.unixfox.eu',
  // Additional instances...
];

export async function getWorkingNitter(): Promise<string | null> {
  try {
    // Check Redis cache first
    const cachedNitters = await redis.get<string[]>('working_nitters');
    if (cachedNitters && cachedNitters.length > 0) {
      for (const nitter of cachedNitters) {
        if (await isNitterAlive(nitter)) {
          return nitter;
        }
      }
    }

    // If no cached instances work, check all known instances
    const workingNitters = [];
    for (const nitter of NITTER_INSTANCES) {
      if (await isNitterAlive(nitter)) {
        workingNitters.push(nitter);
      }
    }

    // Cache the working instances
    if (workingNitters.length > 0) {
      await redis.set('working_nitters', workingNitters, { ex: 3600 }); // Cache for 1 hour
      return workingNitters[0];
    }

    return null;
  } catch (error) {
    console.error('Error getting working Nitter instance:', error);
    return null;
  }
}
```

---

Last updated: May 19, 2025

```
┌───────────┐         ┌───────────┐         ┌───────────┐
│           │         │           │         │           │
│   User    │────────▶│   Clerk   │────────▶│ Database  │
│           │         │           │         │           │
└───────────┘         └───────────┘         └───────────┘
                                                  │
                                                  │
                                                  ▼
┌───────────┐         ┌───────────┐         ┌───────────┐
│           │         │           │         │           │
│ Platform  │◀────────│ NextAuth  │◀────────│   PRAN    │
│           │         │           │         │   App     │
└───────────┘         └───────────┘         └───────────┘
```

### User Synchronization

When a user authenticates with Clerk:

1. The user is redirected to the application
2. The `useSyncClient.tsx` hook triggers the user sync API
3. The `/api/sync-user/route.ts` endpoint creates or updates the user in the database
4. The user can then connect platforms using NextAuth

## Data Model

The data model is defined using Prisma ORM and consists of the following key entities:

### User

The `User` model represents application users:

```prisma
model User {
  id              String    @id @default(cuid())
  clerkId         String    @unique
  email           String    @unique
  name            String?
  image           String?
  createdAt       DateTime  @default(now())
  platforms       PlatformConnection[]
  reports         PerformanceReport[]
}
```

- `clerkId`: Links the user to their Clerk authentication
- `platforms`: One-to-many relationship with platform connections
- `reports`: One-to-many relationship with performance reports

### Platform Connections

The `PlatformConnection` model represents linked social platforms:

```prisma
model PlatformConnection {
  id              String       @id @default(cuid())
  user            User         @relation(fields: [userId], references: [id])
  userId          String
  platform        PlatformType
  profileId       String       // Platform's unique user ID
  username        String?      // Optional username
  accessToken     String?      // Encrypted token
  refreshToken    String?      // Encrypted refresh token
  scopes          String?      // OAuth scopes
  expiresAt       DateTime?    // Token expiry
  connectedAt     DateTime     @default(now())
  posts           Post[]

  @@unique([userId, platform])
}

enum PlatformType {
  X
  GITHUB
  // More platforms to be added
}
```

- `accessToken` and `refreshToken`: Encrypted using the encryption library
- `@@unique`: Constraint ensures one connection per platform per user

### Posts and Metrics

The application tracks posts and their metrics:

```prisma
model Post {
  id              String   @id @default(cuid())
  platformConn    PlatformConnection @relation(fields: [platformConnId], references: [id])
  platformConnId  String
  postId          String   // Platform-specific post ID
  url             String
  content         String?
  postedAt        DateTime
  metrics         Metric?  @relation(name: "PostMetric")
  sentiment       Sentiment? @relation(name: "PostSentiment")

  @@unique([platformConnId, postId])
}

model Metric {
  id              String   @id @default(cuid())
  post            Post     @relation(name: "PostMetric", fields: [postId], references: [id])
  postId          String   @unique
  likes           Int?
  comments        Int?
  shares          Int?
  views           Int?
  stars           Int?
  profileClicks   Int?
}

model Sentiment {
  id              String   @id @default(cuid())
  post            Post     @relation(name: "PostSentiment", fields: [postId], references: [id])
  postId          String   @unique
  score           Float
  label           String
  keywords        String[]
}
```

### Performance Reports

The system generates performance reports for users:

```prisma
model PerformanceReport {
  id              String   @id @default(cuid())
  user            User     @relation(fields: [userId], references: [id])
  userId          String
  generatedAt     DateTime @default(now())
  content         String
  score           Int
  suggestions     String[]
}
```

## Authentication Implementation

### Clerk Integration

The application uses Clerk for primary user authentication:

```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: ["/", "/api/sync-user", "/api/auth(.*)"],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

User synchronization is handled by the sync-user API endpoint:

```typescript
// app/api/sync-user/route.ts (simplified)
export async function POST(req: Request) {
  const { userId } = await req.json();
  
  // Get user details from Clerk
  const clerkUser = await clerkClient.users.getUser(userId);
  
  // Sync to database using Prisma
  await prisma.user.upsert({
    where: { clerkId: userId },
    update: { /* user data */ },
    create: { /* user data */ },
  });
}
```

### NextAuth Implementation

NextAuth is used specifically for platform connections:

```typescript
// app/api/auth/[...nextauth]/route.ts (simplified)
export const authOptions: AuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // Configure scopes
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_API_KEY!,
      clientSecret: process.env.TWITTER_API_SECRET!,
      version: "2.0",
      // Configure OAuth 2.0 settings
    }),
  ],
  callbacks: {
    // Custom callbacks for syncing with main user system
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Token Encryption

Sensitive OAuth tokens are encrypted before storage:

```typescript
// lib/encryption.ts
import CryptoJS from 'crypto-js';

// Get encryption key from environment
const secretKey = process.env.ENCRYPTION_SECRET_KEY;

export function encryptToken(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    return CryptoJS.AES.encrypt(token, getKey()).toString();
  } catch (error) {
    console.error("Encryption failed:", error);
    return null;
  }
}

export function decryptToken(encryptedToken: string | null | undefined): string | null {
  if (!encryptedToken) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, getKey());
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}
```

## Server Actions

The application uses Next.js server actions for core functionality:

### Platform Connections

```typescript
// app/actions/platformActions.ts
'use server';

import { PrismaClient, PlatformConnection, PlatformType } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

// Get platform connections for the authenticated user
export async function getPlatformConnectionsAction(): Promise<ConnectionInfo[]> {
  const authData = await auth();
  const clerkId = authData.userId;
  
  if (!clerkId) {
    throw new Error("User not authenticated.");
  }
  
  // Retrieve user and connections from database
  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true }
  });
  
  // Fetch and return connections
  // ...
}

// Disconnect a platform
export async function disconnectPlatformAction(platform: PlatformType): Promise<boolean> {
  // Implementation
}
```

### AI Integration

The application uses OpenRouter to access AI models:

```typescript
// app/actions/ai.ts (simplified)
'use server'

import OpenAI from 'openai';
import { Stream } from 'openai/streaming'; 

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "X-Title": "P.R.A.N. - Public Reputation and Analysis Node",
  },
});

export async function getStreamingAiCompletion(userPrompt: string): Promise<ReadableStream<Uint8Array>> {
  const messages = [
    {
      role: "system",
      content: "You are a helpful assistant for online reputation management."
    },
    {
      role: "user",
      content: userPrompt
    }
  ];

  const stream = await openai.chat.completions.create({
    model: "google/gemma-3-27b-it:free", 
    messages: messages,
    stream: true, 
  });
  
  // Transform stream to ReadableStream
  // ...
}
```

## UI Components

The application uses React components with a focus on responsive design and theme support:

### Layout and Theming

```tsx
// components/LayoutHeader.tsx
'use client'

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { useState, useEffect } from 'react';
import ThemeSwitch from "./ThemeSwitch";

const LayoutHeader = () => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Theme-specific styling with Tailwind
    const headerClasses = "flex justify-end items-center p-4 gap-4 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700";

    // SSR-safe rendering
    if (!isMounted) {
        return <header className={headerClasses}></header>;
    }

    return (
        <header className={headerClasses}>
            <ThemeSwitch />
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
        </header>
    )
}
```

### Theme Implementation

The application supports light and dark themes using next-themes:

```tsx
// app/providers/index.tsx
'use client'

import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

## Nitter Scraper Implementation

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

Last updated: May 19, 2025
