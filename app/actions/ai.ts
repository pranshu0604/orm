'use server'

import OpenAI from 'openai';
import { Stream } from 'openai/streaming'; 
import { ChatCompletionChunk } from 'openai/resources/chat/completions'; 


const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  throw new Error("OpenRouter API key is not configured in environment variables.");
}

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: apiKey,
  defaultHeaders: {
    // "HTTP-Referer": process.env.YOUR_SITE_URL,
    "X-Title": "P.R.A.N. - Public Reputation and Analysis Node",
  },
});


export async function getStreamingAiCompletion(userPrompt: string): Promise<ReadableStream<Uint8Array>> {

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "You are a helpful assistant for online reputation management."
    },
    {
      role: "user",
      content: userPrompt
    }
    // Add image content here if needed (this model suppports it) , search web/copilot for syntax
  ];

  const stream: Stream<ChatCompletionChunk> = await openai.chat.completions.create({
    model: "google/gemma-3-27b-it:free", 
    messages: messages,
    stream: true, 
  });

  // Create a ReadableStream to send back to the client
  const readableStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // string chunks to Uint8Array

      try {
        // Iterate over the stream chunks
        for await (const chunk of stream) {

          const textDelta = chunk.choices[0]?.delta?.content;

          if (textDelta) {
            // Encode the text chunk and enqueue it for the client
            controller.enqueue(encoder.encode(textDelta));
          }
        }
      } catch (error) {
        console.error("Error processing stream:", error);
        controller.enqueue(encoder.encode(`\n\n[Error: Failed to process stream] ${error instanceof Error ? error.message : ''}`));
        controller.error(error); // Signal an error in the stream
      } finally {
        controller.close();
      }
    },
    cancel() {
      console.log("Stream cancelled by client.");
      // might add logic here to cancel the OpenAI request if possible/needed.
      // although cancellation support varies
    }
  });

  return readableStream;
}
