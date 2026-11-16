'use client';

import { useState } from 'react';
import TerminalButton from './TerminalButton';

type ReplyResult = { suggested_reply: string; reasoning: string };

export default function ReplyAssistant({ platformConnectionId }: { platformConnectionId: string }) {
  const [open, setOpen] = useState(false);
  const [tweetContext, setTweetContext] = useState('');
  const [result, setResult] = useState<ReplyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!tweetContext.trim()) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/suggestions/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformConnectionId, tweetContext }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate reply');
      setResult(data.suggestion);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-mono text-[11px] text-gray-500 hover:text-gray-300 transition-colors tracking-wide uppercase"
      >
        {open ? 'Hide reply assistant' : 'Reply assistant'}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <textarea
            value={tweetContext}
            onChange={(e) => setTweetContext(e.target.value)}
            placeholder="paste a tweet you want to reply to…"
            rows={2}
            className="hud-input hud-input-sm resize-none"
          />
          <TerminalButton onClick={generate} disabled={loading || !tweetContext.trim()} loading={loading}>
            Suggest reply
          </TerminalButton>

          {error && <p className="font-mono text-xs text-red-400">ERROR {'//'} {error}</p>}

          {result && (
            <div className="border-l-2 border-cyan-500/40 bg-cyan-500/5 px-3 py-2 space-y-1">
              <p className="text-sm text-gray-200 font-light">{result.suggested_reply}</p>
              <p className="text-xs text-gray-500 font-mono">{result.reasoning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
