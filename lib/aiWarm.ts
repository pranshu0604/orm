// Throttled wake-up ping for the AI service (Render Free spins down when idle).

export type WarmStatus = 'online' | 'waking' | 'unconfigured';

export const WARM_MIN_INTERVAL_SECONDS = 60;
export const WARM_PING_TIMEOUT_MS = 6000;

export interface WarmStore {
  /** Last recorded status, if the throttle window is still open. */
  get(): Promise<WarmStatus | null>;
  /** Atomically open the throttle window; false if another caller already holds it. */
  acquire(ttlSeconds: number): Promise<boolean>;
  /** Record the outcome for the rest of the window. */
  record(status: WarmStatus, ttlSeconds: number): Promise<void>;
}

export interface WarmDeps {
  baseUrl: string | null;
  store: WarmStore;
  ping: (url: URL, timeoutMs: number) => Promise<boolean>;
}

/** Pings {baseUrl}/v1/health at most once per WARM_MIN_INTERVAL_SECONDS across callers. */
export async function warmAiService({ baseUrl, store, ping }: WarmDeps): Promise<{ status: WarmStatus; pinged: boolean }> {
  if (!baseUrl) return { status: 'unconfigured', pinged: false };

  const cached = await store.get();
  if (cached) return { status: cached, pinged: false };

  if (!(await store.acquire(WARM_MIN_INTERVAL_SECONDS))) return { status: 'waking', pinged: false };

  let ok = false;
  try {
    ok = await ping(new URL('/v1/health', baseUrl), WARM_PING_TIMEOUT_MS);
  } catch {
    ok = false;
  }
  const status: WarmStatus = ok ? 'online' : 'waking';
  await store.record(status, WARM_MIN_INTERVAL_SECONDS);
  return { status, pinged: true };
}

/** In-process store: used in tests and as a fallback when Redis is unreachable. */
export function createMemoryStore(now: () => number = Date.now): WarmStore {
  let entry: { status: WarmStatus; until: number } | null = null;
  const live = () => (entry && entry.until > now() ? entry : null);
  return {
    async get() {
      return live()?.status ?? null;
    },
    async acquire(ttl) {
      if (live()) return false;
      entry = { status: 'waking', until: now() + ttl * 1000 };
      return true;
    },
    async record(status, ttl) {
      entry = { status, until: now() + ttl * 1000 };
    },
  };
}
