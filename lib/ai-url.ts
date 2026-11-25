/** Base URL of the AI service. Falls back to localhost only outside production (fail closed). */
export function getAiServiceUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  const configured = env.AI_SERVICE_URL?.trim();
  if (configured) return configured;
  return env.NODE_ENV !== 'production' ? 'http://localhost:8000' : null;
}
