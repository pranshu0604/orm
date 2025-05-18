# Platform Integration Examples

This document provides detailed examples and implementation guidelines for platform integrations in PRAN beyond the default Twitter/X integration.

## Supported Platforms

PRAN currently supports the following platforms:
- Twitter/X (primary platform)
- GitHub
- Additional platforms (as described in this document)

## GitHub Integration

### Setup and Authentication

GitHub integration uses OAuth via NextAuth with the following scopes:
- `read:user` - Access user profile information
- `user:email` - Access user email addresses

### Data Collection

With GitHub integration, PRAN collects:

- User profile information
- Repository statistics
- Star history
- Contribution data

### Example Usage

#### Fetching GitHub User Data

```typescript
// In server action or API route
import { getAccessToken } from "@/lib/platformTokens";
import { PlatformType } from "@prisma/client";

export async function fetchGitHubUserData(userId: string) {
  // Get the encrypted GitHub token from the database
  const token = await getAccessToken(userId, PlatformType.GITHUB);
  if (!token) return null;
  
  // Use the token to fetch user data from GitHub API
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    }
  });
  
  return response.json();
}
```

#### Fetching Repository Data

```typescript
export async function fetchGitHubRepositories(userId: string) {
  const token = await getAccessToken(userId, PlatformType.GITHUB);
  if (!token) return null;
  
  const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    }
  });
  
  return response.json();
}
```

#### Analyzing GitHub Presence

```typescript
import { analyzeContent } from "@/app/actions/ai";

export async function analyzeGitHubProfile(userId: string) {
  // Fetch user data and repositories
  const userData = await fetchGitHubUserData(userId);
  const repositories = await fetchGitHubRepositories(userId);
  
  if (!userData || !repositories) return null;
  
  // Extract relevant information for analysis
  const contentToAnalyze = {
    profile: {
      bio: userData.bio,
      name: userData.name,
      company: userData.company,
      location: userData.location,
      blog: userData.blog,
    },
    repositories: repositories.map(repo => ({
      name: repo.name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
    })),
  };
  
  // Use AI to analyze GitHub presence
  const analysis = await analyzeContent(
    JSON.stringify(contentToAnalyze),
    userId,
    "github_presence"
  );
  
  return analysis;
}
```

### Recommended UI Implementation

```jsx
// In a React component
function GitHubProfileInsights({ userId }) {
  const { data, isLoading, error } = useSWR(
    `/api/insights/github/${userId}`,
    fetcher
  );
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error.message} />;
  
  return (
    <div className="github-insights">
      <h2>GitHub Profile Insights</h2>
      
      <div className="stats-grid">
        <StatCard 
          title="Repository Quality" 
          value={data.scores.repoQuality} 
          maxValue={10} 
        />
        <StatCard 
          title="Community Engagement" 
          value={data.scores.engagement} 
          maxValue={10} 
        />
        <StatCard 
          title="Profile Completeness" 
          value={data.scores.profileCompleteness} 
          maxValue={10} 
        />
      </div>
      
      <h3>Improvement Suggestions</h3>
      <ul className="suggestion-list">
        {data.suggestions.map((suggestion, i) => (
          <SuggestionItem key={i} text={suggestion} />
        ))}
      </ul>
    </div>
  );
}
```

## LinkedIn Integration Example

> Note: This is an example implementation for a future platform integration.

### Setup and Authentication

LinkedIn integration would use OAuth via NextAuth with the following scopes:
- `r_liteprofile` - Access basic profile information
- `r_emailaddress` - Access user email address
- `w_member_social` - Manage posts and comments

### NextAuth Configuration

```typescript
// Add to app/api/auth/[...nextauth]/route.ts
import LinkedInProvider from "next-auth/providers/linkedin";

// In the providers array:
LinkedInProvider({
  clientId: process.env.LINKEDIN_CLIENT_ID!,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
  authorization: {
    params: { 
      scope: "r_liteprofile r_emailaddress w_member_social" 
    }
  },
  // Add LinkedIn profile handling
  profile(profile) {
    return {
      id: profile.id,
      name: profile.localizedFirstName + " " + profile.localizedLastName,
      email: profile.emailAddress,
      image: profile.profilePicture?.displayImage || null,
    };
  },
}),
```

### Database Schema Update

```prisma
// Add to prisma/schema.prisma
enum PlatformType {
  TWITTER
  GITHUB
  LINKEDIN // New platform type
}
```

### Data Collection Functions

```typescript
// lib/platforms/linkedin.ts
export async function fetchLinkedInProfile(token: string) {
  const response = await fetch('https://api.linkedin.com/v2/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return response.json();
}

export async function fetchLinkedInPosts(token: string) {
  // LinkedIn API endpoints for posts would be used here
  const response = await fetch('https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:person:{USER_ID})', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return response.json();
}
```

### AI Analysis Implementation

```typescript
// Example prompt for LinkedIn content analysis
const LINKEDIN_ANALYSIS_PROMPT = `
Analyze the following LinkedIn profile and content:

Profile: {{profile}}

Recent Posts: {{posts}}

Provide an analysis of the professional tone, engagement patterns, and network quality.
Suggest specific improvements for better professional positioning.
`;

// In app/actions/ai.ts
case "linkedin_presence":
  prompt = LINKEDIN_ANALYSIS_PROMPT
    .replace("{{profile}}", data.profile)
    .replace("{{posts}}", data.posts);
  break;
```

## Instagram Integration Example

> Note: This is an example implementation for a future platform integration.

### Setup and Authentication

Instagram integration would use OAuth via NextAuth with the following scopes:
- `user_profile` - Access to basic profile information
- `user_media` - Access to user's media content

### NextAuth Configuration

```typescript
// Add to app/api/auth/[...nextauth]/route.ts
import InstagramProvider from "next-auth/providers/instagram";

// In the providers array:
InstagramProvider({
  clientId: process.env.INSTAGRAM_CLIENT_ID!,
  clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
  authorization: {
    params: { 
      scope: "user_profile,user_media" 
    }
  },
  // Add Instagram profile handling
  profile(profile) {
    return {
      id: profile.id,
      name: profile.username,
      email: null, // Instagram API doesn't provide email
      image: profile.profile_picture,
    };
  },
}),
```

### Data Collection Functions

```typescript
// lib/platforms/instagram.ts
export async function fetchInstagramProfile(token: string) {
  const response = await fetch('https://graph.instagram.com/me?fields=id,username,account_type,media_count', {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  return response.json();
}

export async function fetchInstagramMedia(token: string) {
  const response = await fetch('https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count', {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  return response.json();
}
```

### AI Analysis Implementation

```typescript
// Example prompt for Instagram content analysis
const INSTAGRAM_ANALYSIS_PROMPT = `
Analyze the following Instagram profile and content:

Profile: {{profile}}

Recent Media: {{media}}

Provide an analysis of visual consistency, engagement patterns, and audience response.
Suggest specific improvements for better visual storytelling and engagement.
`;

// In app/actions/ai.ts
case "instagram_presence":
  prompt = INSTAGRAM_ANALYSIS_PROMPT
    .replace("{{profile}}", data.profile)
    .replace("{{media}}", data.media);
  break;
```

## Integration Architecture

When integrating a new platform, follow these steps:

1. Add the OAuth provider to NextAuth configuration
2. Update the PlatformType enum in the Prisma schema
3. Create platform-specific API functions in `lib/platforms/[platform].ts`
4. Add AI analysis prompts for the platform
5. Implement UI components to display platform data
6. Update the settings page to allow connecting the new platform

### Common Patterns

All platform integrations should:

1. Use the secure token storage system (encryption using crypto-js)
2. Implement proper error handling and token refresh mechanisms
3. Cache API responses when appropriate
4. Include rate limiting considerations
5. Provide clear analytics and insights

## Testing Platform Integrations

For each platform integration, create test cases in the `__tests__` directory:

```typescript
// __tests__/platforms/github.test.ts
import { fetchGitHubUserData, fetchGitHubRepositories } from '@/lib/platforms/github';
import { mockToken, mockUserId } from '../mocks/data';

describe('GitHub Integration', () => {
  test('fetchGitHubUserData returns user data', async () => {
    // Test implementation
  });
  
  test('fetchGitHubRepositories returns repositories', async () => {
    // Test implementation
  });
});
```
