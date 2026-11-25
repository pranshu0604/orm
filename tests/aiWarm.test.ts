import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMemoryStore, warmAiService, WARM_MIN_INTERVAL_SECONDS } from '../lib/aiWarm';
import { getAiServiceUrl } from '../lib/ai-url';

function setup(pingResult: boolean | Error = true) {
  let clock = 1_000_000;
  const calls: string[] = [];
  const store = createMemoryStore(() => clock);
  const ping = async (url: URL) => {
    calls.push(url.toString());
    if (pingResult instanceof Error) throw pingResult;
    return pingResult;
  };
  return { calls, store, ping, advance: (seconds: number) => (clock += seconds * 1000) };
}

test('pings /v1/health and reports online', async () => {
  const { calls, store, ping } = setup(true);
  const result = await warmAiService({ baseUrl: 'https://ai.example.com', store, ping });
  assert.deepEqual(result, { status: 'online', pinged: true });
  assert.deepEqual(calls, ['https://ai.example.com/v1/health']);
});

test('throttles: a second call inside the window does not ping', async () => {
  const { calls, store, ping, advance } = setup(true);
  await warmAiService({ baseUrl: 'https://ai.example.com', store, ping });
  advance(WARM_MIN_INTERVAL_SECONDS - 1);
  const second = await warmAiService({ baseUrl: 'https://ai.example.com', store, ping });
  assert.deepEqual(second, { status: 'online', pinged: false });
  assert.equal(calls.length, 1);
});

test('pings again once the window has passed', async () => {
  const { calls, store, ping, advance } = setup(true);
  await warmAiService({ baseUrl: 'https://ai.example.com', store, ping });
  advance(WARM_MIN_INTERVAL_SECONDS + 1);
  await warmAiService({ baseUrl: 'https://ai.example.com', store, ping });
  assert.equal(calls.length, 2);
});

test('a timed-out or failing ping reports waking and is still throttled', async () => {
  const { calls, store, ping } = setup(new Error('timeout'));
  const first = await warmAiService({ baseUrl: 'https://ai.example.com', store, ping });
  const second = await warmAiService({ baseUrl: 'https://ai.example.com', store, ping });
  assert.deepEqual(first, { status: 'waking', pinged: true });
  assert.deepEqual(second, { status: 'waking', pinged: false });
  assert.equal(calls.length, 1);
});

test('unconfigured when there is no AI service URL', async () => {
  const { calls, store, ping } = setup(true);
  const result = await warmAiService({ baseUrl: null, store, ping });
  assert.deepEqual(result, { status: 'unconfigured', pinged: false });
  assert.equal(calls.length, 0);
});

test('AI service URL falls back to localhost only outside production', () => {
  assert.equal(getAiServiceUrl({ NODE_ENV: 'development' } as NodeJS.ProcessEnv), 'http://localhost:8000');
  assert.equal(getAiServiceUrl({ NODE_ENV: 'production' } as NodeJS.ProcessEnv), null);
  assert.equal(getAiServiceUrl({ NODE_ENV: 'production', AI_SERVICE_URL: 'https://ai.example.com' } as NodeJS.ProcessEnv), 'https://ai.example.com');
});
