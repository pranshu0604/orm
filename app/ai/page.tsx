'use client'

import { useState } from 'react';
import { getStreamingAiCompletion } from '../actions/ai'; // Import the Server Action

export default function AiTestPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt || isLoading) return;

    setIsLoading(true);
    setResponse(''); // Clear previous response
    setError(null);   // Clear previous error

    try {
      const stream = await getStreamingAiCompletion(prompt);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break; // Stream finished
        }
        const chunk = decoder.decode(value, { stream: true });
        setResponse((prev) => prev + chunk); // Append chunk to response state
      }
    } catch (err) {
      console.error("Error fetching or reading stream:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">AI Streaming Test</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <label htmlFor="prompt" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Enter your prompt:
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="e.g., Explain online reputation management"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !prompt}
          className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'Submit'}
        </button>
      </form>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {response && (
        <div>
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Response:</h2>
          {/* Pre-wrap preserves whitespace and line breaks */}
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
             <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{response}</pre>
          </div>
        </div>
      )}
    </div>
  );
}