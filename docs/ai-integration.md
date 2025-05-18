# AI Integration in PRAN

This document describes the current AI integration implementation in PRAN.

## Current Implementation

The current implementation is a basic test of OpenRouter connectivity and streaming responses. This is a foundation for future AI features but does not yet include the complete planned functionality.

### Test Implementation

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

## Next Steps

Future development will focus on creating specialized AI functions for reputation analysis, sentiment analysis, and content suggestions.

---

Last updated: May 18, 2025


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

Last updated: May 18, 2025
