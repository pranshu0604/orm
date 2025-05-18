# AI Integration in PRAN

> **Important**: The AI features described in this document are currently under development and not yet fully implemented. This document outlines the planned architecture and functionality.

This document provides examples and guidelines for working with the planned AI integration features in PRAN.

## Overview

PRAN plans to use OpenRouter to access various AI models for content analysis and generation. This integration will enable:

1. Analyzing post sentiment *(planned)*
2. Generating performance reports *(planned)*
3. Providing content improvement suggestions *(planned)*
4. Answering user questions about online reputation

## Implementation Details

### Client-Side Integration

The application provides a streaming AI chat component:

```tsx
// components/AiChat.tsx
'use client'

import { useState } from 'react'
import { getStreamingAiCompletion } from '@/app/actions/ai'

export default function AiChat() {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setResponse('')

    try {
      const stream = await getStreamingAiCompletion(prompt)
      const reader = stream.getReader()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        // Decode and append to response
        const text = new TextDecoder().decode(value)
        setResponse(prev => prev + text)
      }
    } catch (error) {
      console.error('AI completion error:', error)
      setResponse('Sorry, there was an error generating a response.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">AI Assistant</h2>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ask a question about your online reputation..."
          className="w-full p-2 border rounded"
          rows={3}
        />
        <button 
          type="submit" 
          disabled={isLoading || !prompt.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Submit'}
        </button>
      </form>
      
      {response && (
        <div className="border-t pt-4 whitespace-pre-wrap">
          {response}
        </div>
      )}
    </div>
  )
}
```

### Server Action Implementation

The server-side implementation handles the AI model interaction:

```typescript
// app/actions/ai.ts
'use server'

import OpenAI from 'openai';
import { auth } from '@clerk/nextjs/server';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "X-Title": "P.R.A.N. - Public Reputation and Analysis Node",
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL, // Site URL for API provider's analytics
  },
});

export async function getStreamingAiCompletion(
  userPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  // Authenticate the user
  const { userId } = auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Create system prompt
  const systemPrompt = `You are an AI assistant specialized in online reputation management.
Your task is to help users understand and improve their online presence.
Be concise, helpful, and professional.`;

  // Create the stream
  const response = await openai.chat.completions.create({
    model: "google/gemma-3-27b-it:free", // or anthropic/claude-3-haiku-20240307
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 1000,
  });

  // Convert to web stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        controller.enqueue(encoder.encode(content));
      }
      controller.close();
    },
  });

  return stream;
}
```

## Example Prompts

### Sentiment Analysis

```
User: Analyze the sentiment of this tweet: "I'm really disappointed with the latest update to your app. It's slow and crashes constantly."

AI: This tweet has a negative sentiment. The user is expressing disappointment with your app update, specifically highlighting performance issues (slowness and crashing). This type of feedback indicates a potentially damaging post to your online reputation that should be addressed promptly.

I recommend:
1. Responding to the user acknowledging their concerns
2. Explaining steps you're taking to fix the issues
3. Offering to work with them directly to troubleshoot their specific problems

This personal approach can turn a negative interaction into a positive demonstration of your customer service.
```

### Performance Report Generation

```
User: Generate a performance report for my Twitter account based on these metrics: 
- 25 tweets this month
- Average likes: 15
- Average retweets: 5
- Profile visits: 300
- Follower growth: +20

AI: # Twitter Performance Report

## Overview
Your Twitter account shows moderate engagement with positive growth indicators:

- **Activity Level**: 25 tweets (approximately 0.8 per day)
- **Engagement**: 15 likes and 5 retweets per post (average)
- **Discovery**: 300 profile visits
- **Growth**: 20 new followers

## Performance Analysis
Your account is performing at a **satisfactory** level with room for improvement. The follower-to-engagement ratio suggests your audience is moderately engaged with your content.

## Recommendations
1. **Post Consistency**: Maintain regular posting schedule
2. **Content Optimization**: Experiment with media-rich tweets to increase engagement
3. **Audience Development**: Engage with relevant conversations in your niche
4. **Analytics**: Track which tweet formats generate highest engagement

Applying these strategies could help increase your engagement metrics by 15-20% over the next reporting period.
```

### Content Improvement Suggestions

```
User: How can I improve this LinkedIn post?
"Just released our new product. Check it out at example.com"

AI: Your LinkedIn post is quite minimal and doesn't create sufficient interest or engagement. Here's an improved version:

"🚀 **Exciting Announcement**: After months of development, we've just launched [Product Name] - designed to [specific benefit for users].

✅ [Key feature 1]
✅ [Key feature 2] 
✅ [Key feature 3]

Early users are already seeing [specific results]. Learn more and start your free trial at example.com

#RelevantHashtag #IndustryHashtag"

This improvement:
1. Uses emojis for visual appeal
2. Creates excitement with descriptive language
3. Highlights specific benefits and features
4. Adds social proof
5. Includes a clear call-to-action
6. Incorporates relevant hashtags for discoverability
```

## Best Practices

1. **Provide Clear Context**: Include specific metrics, content examples, and goals in your prompts

2. **Use Consistent Framing**: For recurring analyses, use the same prompt structure to ensure comparable results

3. **Review AI Outputs**: Always review AI-generated content before publication to ensure accuracy and brand alignment

4. **Ethical Considerations**: Do not use AI to generate deceptive content or manipulate metrics

5. **Privacy Guidelines**: Do not submit private user data to the AI service that could violate privacy regulations

## Limitations

1. The AI does not have real-time access to your social media accounts

2. Analysis is based on information you provide, not direct API access to platforms

3. The AI does not store conversation history between sessions

4. Complex multi-part analyses may need to be broken into separate prompts

## Future Enhancements

In upcoming releases, we plan to enhance AI integration with:

1. Direct API connections to social platforms for real-time analysis
2. Custom-trained models specific to reputation management
3. Scheduled automated reports and alerts
4. Visual content analysis capabilities
5. Competitive analysis features

---

Last updated: May 18, 2023
