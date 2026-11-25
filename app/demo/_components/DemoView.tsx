import Link from 'next/link';
import CornerBrackets from '@/components/hud/CornerBrackets';
import EngagementChart from '@/components/hud/EngagementChart';
import HudBackground from '@/components/hud/HudBackground';
import ReportSummary from '@/components/hud/ReportSummary';
import type { DemoSnapshot } from '@/lib/demo-data';

const REPO_URL = 'https://github.com/pranshu0604/orm';

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : 'n/a';
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-mono font-semibold tabular-nums text-white">{value}</p>
      <p className="font-mono text-[10px] text-gray-500 mt-1 tracking-widest uppercase">{label}</p>
    </div>
  );
}

function Panel({ title, tag, children }: { title: string; tag?: string; children: React.ReactNode }) {
  return (
    <section className="relative bg-[#0a0f1e]/60 backdrop-blur-sm border border-blue-500/20 p-5 sm:p-6">
      <CornerBrackets accent="cyan" size={3} thickness={2} />
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-500/10">
        <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">{title}</p>
        {tag && <p className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">{tag}</p>}
      </div>
      {children}
    </section>
  );
}

const fmt = (n: number | null) => (n === null ? 'n/a' : n.toLocaleString('en-US'));

export default function DemoView({ snapshot }: { snapshot: DemoSnapshot }) {
  const { report, suggestions } = snapshot;
  const sample = snapshot.source === 'sample';
  const metrics = report?.data.metrics;

  return (
    <HudBackground>
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs text-cyan-400/80">{'//'}</span>
            <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">Read-only demo</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            {sample ? 'Sample report' : `Latest report for @${snapshot.handle}`}
          </h1>
          <p className="text-sm text-gray-400 font-light max-w-2xl">
            {sample ? (
              <>
                <span className="font-mono text-amber-400 text-xs uppercase tracking-widest mr-2">Sample data</span>
                No stored report is available for the demo account right now, so this is a synthetic example of the output format, not a real account.
              </>
            ) : (
              <>
                <span className="font-mono text-emerald-400 text-xs uppercase tracking-widest mr-2">Real data</span>
                Stored output from the project owner&apos;s own X account, generated from the signed-in dashboard. Viewing this page runs no scraping and
                makes no AI calls.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-4 mb-10 pb-8 border-b border-blue-500/10">
          <Stat label="Account" value={`@${snapshot.handle}`} />
          <Stat label="Followers" value={fmt(snapshot.followerCount)} />
          <Stat label="Following" value={fmt(snapshot.followingCount)} />
          <Stat label="Posts tracked" value={String(snapshot.postsTracked)} />
          <Stat label="Target tier" value={snapshot.targetTier.toLowerCase()} />
          <Stat label="Last scrape" value={formatDate(snapshot.lastScrapedAt)} />
        </div>

        <div className="space-y-6">
          {snapshot.chartPosts.length > 1 && (
            <Panel title="Engagement trend" tag={sample ? 'sample' : 'last 30 posts'}>
              <EngagementChart posts={snapshot.chartPosts} />
            </Panel>
          )}

          {report && (
            <Panel title="Performance report" tag={`generated ${formatDate(report.generatedAt)}`}>
              <ReportSummary report={report.data} />

              {metrics && (
                <div className="mt-6 pt-4 border-t border-blue-500/10">
                  <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mb-3">
                    Computed metrics <span className="text-gray-700">(calculated in code, not by the model)</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
                    <Stat label="Avg likes" value={String(metrics.avg_likes)} />
                    <Stat label="Avg reposts" value={String(metrics.avg_retweets)} />
                    <Stat label="Avg replies" value={String(metrics.avg_replies)} />
                    <Stat label="Engagement rate" value={`${metrics.engagement_rate}%`} />
                  </div>
                </div>
              )}

              {report.data.sentiment && (
                <div className="mt-6 pt-4 border-t border-blue-500/10">
                  <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                    Sentiment <span className="text-gray-700">(LLM-generated)</span>
                  </p>
                  <p className="text-sm text-gray-300 font-light">
                    {report.data.sentiment.overall_sentiment} ({report.data.sentiment.sentiment_score.toFixed(2)})
                    {report.data.sentiment.top_keywords.length > 0 && (
                      <span className="text-gray-500 font-mono text-xs"> {'//'} {report.data.sentiment.top_keywords.join(', ')}</span>
                    )}
                  </p>
                </div>
              )}
            </Panel>
          )}

          {suggestions && (
            <Panel title="Content suggestions" tag={`generated ${formatDate(suggestions.generatedAt)}`}>
              <div className="space-y-5 text-sm text-gray-300 font-light">
                {suggestions.data.bio_suggestion && (
                  <div>
                    <p className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest mb-1.5">Bio</p>
                    <p>{suggestions.data.bio_suggestion.suggested_bio}</p>
                    {suggestions.data.bio_suggestion.reasoning && (
                      <p className="text-gray-500 mt-1">{suggestions.data.bio_suggestion.reasoning}</p>
                    )}
                  </div>
                )}

                {suggestions.data.tweet_suggestions.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest mb-1.5">Post ideas</p>
                    <ul className="space-y-3">
                      {suggestions.data.tweet_suggestions.map((t, i) => (
                        <li key={i} className="border-l border-cyan-500/30 pl-3">
                          <p>{t.content}</p>
                          <p className="font-mono text-[10px] text-gray-600 mt-1 tracking-wider">
                            {[t.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' '), t.best_time_to_post].filter(Boolean).join(' | ')}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {suggestions.data.engagement_strategy && (
                  <div>
                    <p className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest mb-1.5">Strategy</p>
                    <p>{suggestions.data.engagement_strategy}</p>
                  </div>
                )}

                {suggestions.data.suggested_posting_volume && (
                  <p>
                    <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mr-2">Cadence</span>
                    {suggestions.data.suggested_posting_volume}
                  </p>
                )}
              </div>
            </Panel>
          )}
        </div>

        <div className="mt-10 pt-6 border-t border-blue-500/10 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-xs tracking-widest uppercase">
          <Link href="/" className="text-gray-400 hover:text-cyan-400 transition-colors">
            &lt; Back to home
          </Link>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition-colors">
            Source on GitHub &gt;
          </a>
        </div>
      </div>
    </HudBackground>
  );
}
