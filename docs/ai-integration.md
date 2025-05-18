# AI Integration in PRAN

> **Important**: The AI features described in this document are currently under development and not yet fully implemented. This document outlines the planned architecture and functionality.

This document provides examples and guidelines for working with the planned AI integration features in PRAN.

## Overview

PRAN plans to use OpenRouter to access various AI models for content analysis and generation. The UI will have dedicated buttons for different analysis types, and the backend will automatically determine and return the appropriate responses.

Key features will include:

1. Automatic post sentiment analysis *(planned)*
2. One-click performance reports *(planned)*
3. Integrated content improvement suggestions *(planned)*
4. Overall reputation analysis dashboard *(planned)*

## Implementation Details

### Current Test Implementation

The current implementation is for testing OpenRouter connectivity and streaming responses:

```tsx
// app/ai/page.tsx (test implementation only)
'use client'

import { useState } from 'react';
import { getStreamingAiCompletion } from '../actions/ai';

export default function AiTestPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt || isLoading) return;

    setIsLoading(true);
    setResponse('');
    setError(null);

    try {
      const stream = await getStreamingAiCompletion(prompt);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setResponse((prev) => prev + chunk);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Component rendering...
}
```

### Server Action Implementation

```typescript
// app/actions/ai.ts (test implementation)
'use server'

import OpenAI from 'openai';

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

  // Create and return ReadableStream...
}
```

### Planned UI Implementation

The final implementation will have:

1. **Analysis Dashboard**:
   - Buttons for different analysis types
   - Automated collection of relevant data
   - Integrated visualizations of results

2. **Automatic Data Collection**:
   - System will gather profile data
   - System will gather recent posts
   - System will gather engagement metrics
   - No manual prompt entry required

3. **Backend Analysis Types**:
   - Content sentiment analysis
   - Audience engagement patterns
   - Performance trending
   - Improvement recommendations

```tsx
// Planned components (not yet implemented)
function ReputationDashboard() {
  return (
    <div className="dashboard-grid">
      <SentimentAnalysisCard />
      <EngagementMetricsCard />
      <ContentSuggestionsCard />
      <PerformanceReportCard />
    </div>
  )
}

function SentimentAnalysisCard() {
  // Button triggers sentiment analysis
  // No manual prompt entry required
  return (
    <Card>
      <CardHeader>
        <h3>Content Sentiment</h3>
      </CardHeader>
      <CardBody>
        {/* Results visualization */}
      </CardBody>
      <CardFooter>
        <Button onClick={runSentimentAnalysis}>
          Refresh Analysis
        </Button>
      </CardFooter>
    </Card>
  )
}
```

### Backend Implementation

The backend will implement specialized AI functions:

```typescript
// Planned implementation (not yet built)
export async function analyzeSentiment(userId: string): Promise<SentimentResult> {
  // 1. Fetch user's recent posts
  // 2. Prepare data for AI analysis
  // 3. Generate sentiment analysis
  // 4. Return structured results
}

export async function generateContentSuggestions(userId: string): Promise<ContentSuggestions> {
  // 1. Analyze recent content performance
  // 2. Generate AI-powered suggestions
  // 3. Return actionable recommendations
}

export async function createPerformanceReport(userId: string): Promise<PerformanceReport> {
  // 1. Collect metrics across platforms
  // 2. Generate performance insights
  // 3. Return structured report data
}
```

## Working with the AI System

The AI system is designed to work automatically. Developers should:

1. Use the provided UI components
2. Connect to the appropriate backend functions
3. Handle and display the structured results

The system does not require users to manually craft prompts - the UI buttons and automated analysis pipeline will handle all interactions with the AI service.

## Future Enhancements

In upcoming releases, we plan to enhance AI integration with:

1. Direct API connections to social platforms for real-time analysis
2. Custom-trained models specific to reputation management
3. Scheduled automated reports and alerts
4. Visual content analysis capabilities
5. Competitive analysis features

---

Last updated: May 18, 2023
      
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


## Best Practices

1. **Provide Clear Context**: Include specific metrics, content examples, and goals in the system prompts

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
