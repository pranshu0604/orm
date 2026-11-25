'use client';

import { useEffect, useState } from 'react';

type AiState = 'checking' | 'waking' | 'online' | 'unconfigured' | 'unreachable';

const STORAGE_KEY = 'pran:ai-status';
const FRESH_MS = 60_000;
const POLL_MS = 15_000;
const MAX_POLLS = 8;

const LABELS: Record<AiState, string> = {
  checking: 'AI: checking…',
  waking: 'AI: waking up…',
  online: 'AI: online',
  unconfigured: 'AI: not configured',
  unreachable: 'AI: unreachable',
};

const DOT: Record<AiState, string> = {
  checking: 'bg-gray-500 animate-pulse',
  waking: 'bg-amber-400 animate-pulse',
  online: 'bg-emerald-400',
  unconfigured: 'bg-gray-500',
  unreachable: 'bg-red-400',
};

function readCached(): AiState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { state, at } = JSON.parse(raw) as { state: AiState; at: number };
    return state === 'online' && Date.now() - at < FRESH_MS ? state : null;
  } catch {
    return null;
  }
}

/** Non-blocking: asks /api/ai/warm (server-throttled) to wake the AI service, then reflects what it reports. */
export function useAiStatus(): AiState {
  const [state, setState] = useState<AiState>('checking');

  useEffect(() => {
    const cached = readCached();
    if (cached) {
      setState(cached);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let polls = 0;

    const check = async () => {
      polls += 1;
      let next: AiState = 'waking';
      try {
        const res = await fetch('/api/ai/warm', { cache: 'no-store' });
        const data = (await res.json()) as { status?: string };
        if (data.status === 'online' || data.status === 'unconfigured') next = data.status;
      } catch {
        next = 'waking';
      }
      if (cancelled) return;
      if (next === 'waking' && polls >= MAX_POLLS) next = 'unreachable';
      setState(next);
      if (next === 'online') {
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ state: next, at: Date.now() }));
        } catch {
          // storage unavailable: status just isn't cached
        }
      }
      if (next === 'waking') timer = setTimeout(check, POLL_MS);
    };

    void check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return state;
}

export default function AiStatus() {
  const state = useAiStatus();
  return (
    <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-[#0a0f1e]/80 border border-cyan-500/20" aria-live="polite">
      <span className={`w-1.5 h-1.5 rounded-full ${DOT[state]}`} />
      <span className="font-mono text-[10px] text-gray-400 tracking-wider uppercase">{LABELS[state]}</span>
    </div>
  );
}
