import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getAiServiceUrl } from '@/lib/ai-url';
import { createMemoryStore, warmAiService, type WarmStatus, type WarmStore } from '@/lib/aiWarm';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const KEY = 'pran:ai-warm';
const memory = createMemoryStore();

const redisStore: WarmStore = {
  async get() {
    const value = await redis.get<string>(KEY);
    return value === 'online' || value === 'waking' ? value : null;
  },
  async acquire(ttl) {
    return (await redis.set(KEY, 'waking', { nx: true, ex: ttl })) === 'OK';
  },
  async record(status: WarmStatus, ttl) {
    await redis.set(KEY, status, { ex: ttl });
  },
};

// Redis holds the throttle across serverless instances; if it is unreachable, fall back to this instance's memory.
const store: WarmStore = {
  get: () => redisStore.get().catch(() => memory.get()),
  acquire: (ttl) => redisStore.acquire(ttl).catch(() => memory.acquire(ttl)),
  record: (status, ttl) => redisStore.record(status, ttl).catch(() => memory.record(status, ttl)),
};

async function ping(url: URL, timeoutMs: number): Promise<boolean> {
  const response = await fetch(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(timeoutMs) });
  return response.ok;
}

/** Public, unauthenticated, side-effect-only wake-up. Returns coarse status; never the AI URL. */
export async function GET() {
  const { status } = await warmAiService({ baseUrl: getAiServiceUrl(), store, ping });
  return NextResponse.json({ status }, { headers: { 'Cache-Control': 'no-store' } });
}
