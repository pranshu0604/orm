'use server'

// This server action proxies requests to the FastAPI AI microservice defined in `AI_SERVICE_URL`.
// The earlier in-app model client implementation has been removed — the microservice is the
// canonical place to manage model credentials and streaming.

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function getStreamingAiCompletion(userPrompt: string): Promise<ReadableStream<Uint8Array>> {
  // Forward the prompt to the microservice and return the streaming response (if any).
  const res = await fetch(`${AI_SERVICE_URL}/v1/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Use stream flag as needed; this proxy assumes the client will request streaming when desired.
    body: JSON.stringify({ prompt: userPrompt, max_tokens: 512, stream: true }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI microservice error: ${res.status} ${text}`);
  }

  // Return the response body as a ReadableStream so the client can read chunks.
  const body = res.body as ReadableStream<Uint8Array> | null;
  if (!body) {
    throw new Error('AI microservice returned an empty response body');
  }
  return body;
}
