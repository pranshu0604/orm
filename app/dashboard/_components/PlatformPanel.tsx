'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { PlatformType, TargetTier } from '@prisma/client';
import CornerBrackets from '@/components/hud/CornerBrackets';
import StatusDots from '@/components/hud/StatusDots';
import TerminalButton from '@/components/hud/TerminalButton';
import EngagementChart from '@/components/hud/EngagementChart';
import ReplyAssistant from '@/components/hud/ReplyAssistant';

type Connection = {
  id: string;
  platform: PlatformType;
  username: string | null;
  setupCompleted: boolean;
  targetTier: TargetTier;
  _count: { posts: number };
  posts: {
    postedAt: Date;
    metrics: { likes: number | null; views: number | null; shares: number | null; comments: number | null } | null;
  }[];
};

type ReportResult = {
  overall_score: number;
  summary: string;
  strengths: string[];
  areas_for_improvement: string[];
  previousScore?: number | null;
};

type SuggestionResult = {
  bio_suggestion?: { suggested_bio: string };
  engagement_strategy?: string;
  growth_strategy?: string;
};

const ACCENT_TEXT = { cyan: 'text-cyan-400' } as const;
const ACCENT_BORDER = { cyan: 'border-cyan-500/30' } as const;

export default function PlatformPanel({
  platform,
  label,
  glyph,
  accent,
  connection,
  prominent = false,
}: {
  platform: PlatformType;
  label: string;
  glyph: string;
  accent: 'cyan';
  connection?: Connection;
  prominent?: boolean;
}) {
  const [report, setReport] = useState<ReportResult | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'report' | 'suggestion' | null>(null);
  const [liveLog, setLiveLog] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [liveLog]);

  const streamSse = async (url: string, onEvent: (evt: { type: string; [key: string]: unknown }) => void) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platformConnectionId: connection!.id }),
    });
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to generate');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (!part.startsWith('data: ')) continue;
        onEvent(JSON.parse(part.slice(6)));
      }
    }
  };

  const runReportStream = async () => {
    if (!connection) return;
    setError(null);
    setReport(null);
    setLiveLog('');
    setLoading('report');

    try {
      await streamSse('/api/reports/twitter/stream', (evt) => {
        if (evt.type === 'token') {
          setLiveLog((prev) => prev + (evt.content as string));
        } else if (evt.type === 'error') {
          throw new Error((evt.message as string) || 'Report generation failed');
        } else if (evt.type === 'saved') {
          setReport(evt.report as ReportResult);
          setLiveLog('');
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(null);
    }
  };

  const runSuggestionsStream = async () => {
    if (!connection) return;
    setError(null);
    setSuggestion(null);
    setLiveLog('');
    setLoading('suggestion');

    try {
      await streamSse('/api/suggestions/twitter/stream', (evt) => {
        if (evt.type === 'token') {
          setLiveLog((prev) => prev + (evt.content as string));
        } else if (evt.type === 'error') {
          throw new Error((evt.message as string) || 'Suggestion generation failed');
        } else if (evt.type === 'saved') {
          setSuggestion(evt.suggestion as SuggestionResult);
          setLiveLog('');
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(null);
    }
  };

  if (!connection) {
    return (
      <div className="flex items-center justify-between py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <span className="font-mono text-sm text-gray-500">{label} isn&apos;t connected yet</span>
        </div>
        <Link
          href="/settings/connections"
          className="font-mono text-xs text-gray-400 hover:text-cyan-400 transition-colors tracking-widest uppercase"
        >
          Connect &gt;
        </Link>
      </div>
    );
  }

  return (
    <section className="relative bg-[#0a0f1e]/60 backdrop-blur-sm border border-blue-500/20">
      <CornerBrackets accent="cyan" size={3} thickness={2} />

      {/* Status bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-blue-500/10">
        <div className="flex items-center gap-2">
          <StatusDots />
          <span className="font-mono text-[10px] text-gray-500 tracking-wider uppercase">MODULE_{glyph}</span>
        </div>
        <span className="font-mono text-[10px] text-emerald-400 tracking-widest uppercase">Linked</span>
      </div>

      <div className={prominent ? 'p-6' : 'p-5'}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 border ${ACCENT_BORDER[accent]} flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent shrink-0`}>
              <span className={`font-mono text-xs font-bold ${ACCENT_TEXT[accent]}`}>{glyph}</span>
            </div>
            <div>
              <h2 className={`font-mono font-semibold text-white ${prominent ? 'text-lg' : 'text-base'}`}>{label}</h2>
              <p className="text-xs text-gray-500 font-mono">
                @{connection.username} <span className="text-gray-700 mx-1">|</span> {connection._count.posts} posts tracked
                <span className="text-gray-700 mx-1">|</span> target: {connection.targetTier.toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <TerminalButton onClick={runReportStream} disabled={loading !== null} loading={loading === 'report'}>
              Generate report
            </TerminalButton>
            <TerminalButton
              variant="ghost"
              onClick={runSuggestionsStream}
              disabled={loading !== null}
              loading={loading === 'suggestion'}
            >
              Get suggestions
            </TerminalButton>
          </div>
        </div>

        {connection.posts.length > 0 && (
          <div className="mb-5 pt-4 border-t border-blue-500/10">
            <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mb-3">Engagement trend</p>
            <EngagementChart
              posts={connection.posts.map((p) => ({
                postedAt: p.postedAt,
                likes: p.metrics?.likes ?? 0,
                views: p.metrics?.views ?? 0,
                shares: p.metrics?.shares ?? 0,
                comments: p.metrics?.comments ?? 0,
              }))}
            />
          </div>
        )}

        {error && <p className="font-mono text-xs text-red-400 mb-4">ERROR {'//'} {error}</p>}

        {(loading === 'report' || loading === 'suggestion') && (
          <div className="mb-5 pt-4 border-t border-blue-500/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">
                {loading === 'report' ? 'Analyzing live' : 'Thinking live'}
              </span>
            </div>
            <div
              ref={logRef}
              className="max-h-40 overflow-y-auto bg-[#030712] border border-white/5 p-3 font-mono text-[11px] text-cyan-400/80 leading-relaxed whitespace-pre-wrap break-words"
            >
              {liveLog || <span className="text-gray-600">connecting…</span>}
              <span className="inline-block w-1.5 h-3 bg-cyan-400 ml-0.5 animate-pulse align-text-bottom" />
            </div>
          </div>
        )}

        {report && (
          <div className="mb-5 pt-4 border-t border-blue-500/10">
            <div className="flex items-baseline gap-3 mb-2">
              <span className={`text-3xl font-mono font-bold tabular-nums ${ACCENT_TEXT[accent]}`}>
                {report.overall_score}
              </span>
              <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Overall score</span>
              {report.previousScore != null && (
                <span
                  className={`font-mono text-xs tabular-nums ${
                    report.overall_score > report.previousScore
                      ? 'text-emerald-400'
                      : report.overall_score < report.previousScore
                        ? 'text-red-400'
                        : 'text-gray-500'
                  }`}
                >
                  {report.overall_score > report.previousScore ? '+' : ''}
                  {report.overall_score - report.previousScore} vs last
                </span>
              )}
            </div>
            <p className="text-sm text-gray-300 mb-3 font-light">{report.summary}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {report.strengths?.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest mb-1.5">Strengths</p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {report.strengths.slice(0, 3).map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-gray-700 font-mono">&gt;</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {report.areas_for_improvement?.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] text-amber-400 uppercase tracking-widest mb-1.5">To improve</p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {report.areas_for_improvement.slice(0, 3).map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-gray-700 font-mono">&gt;</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {suggestion && (
          <div className="mb-5 pt-4 border-t border-blue-500/10 text-sm text-gray-300 space-y-2 font-light">
            {suggestion.bio_suggestion && (
              <p>
                <span className="text-gray-500 font-mono text-xs uppercase tracking-wide">Bio: </span>
                {suggestion.bio_suggestion.suggested_bio}
              </p>
            )}
            {(suggestion.engagement_strategy || suggestion.growth_strategy) && (
              <p>
                <span className="text-gray-500 font-mono text-xs uppercase tracking-wide">Strategy: </span>
                {suggestion.engagement_strategy || suggestion.growth_strategy}
              </p>
            )}
          </div>
        )}

        <ReplyAssistant platformConnectionId={connection.id} />
      </div>
    </section>
  );
}
