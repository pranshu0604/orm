'use client';

import Link from 'next/link';
import { PlatformType, TargetTier, UserTier } from '@prisma/client';
import PlatformPanel from './PlatformPanel';
import HudBackground from '@/components/hud/HudBackground';
import SystemStatusPanel from '@/components/hud/SystemStatusPanel';
import ActivityFeed, { ActivityItem } from '@/components/hud/ActivityFeed';

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

type LifetimeStats = {
  totalPostsTracked: number;
  totalReports: number;
  totalSuggestions: number;
  avgScore: number | null;
};

type SystemStatus = { database: boolean; redis: boolean; aiService: boolean };

export default function DashboardView({
  tier,
  creditsRemaining,
  freeReportsRemaining,
  freeSuggestionsRemaining,
  connections,
  lifetimeStats,
  systemStatus,
  lastScrapedAt,
  activityItems,
}: {
  tier: UserTier;
  creditsRemaining: number;
  freeReportsRemaining: number;
  freeSuggestionsRemaining: number;
  connections: Connection[];
  lifetimeStats: LifetimeStats;
  systemStatus: SystemStatus;
  lastScrapedAt: Date | null;
  activityItems: ActivityItem[];
}) {
  const x = connections.find((c) => c.platform === PlatformType.X);

  return (
    <HudBackground>
      <div className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-cyan-400/80">{'//'}</span>
              <span className="font-mono text-xs text-gray-500 tracking-widest uppercase">Overview</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Your reputation, at a glance
            </h1>
          </div>
          <Link
            href="/settings/connections"
            className="font-mono text-xs text-gray-500 hover:text-cyan-400 transition-colors self-start sm:self-auto tracking-widest uppercase"
          >
            Manage connections &gt;
          </Link>
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-4 mb-10 pb-8 border-b border-blue-500/10">
          <Stat label="Plan" value={tier === 'PAID' ? 'Paid' : 'Free'} />
          {tier === 'PAID' ? (
            <Stat label="Credits remaining" value={String(creditsRemaining)} />
          ) : (
            <>
              <Stat label="Free reports left" value={String(freeReportsRemaining)} />
              <Stat label="Free suggestions left" value={String(freeSuggestionsRemaining)} />
            </>
          )}
          <Stat label="Platforms linked" value={String(connections.length)} />
          <Stat label="Posts tracked" value={String(lifetimeStats.totalPostsTracked)} />
          <Stat label="Reports generated" value={String(lifetimeStats.totalReports)} />
          <Stat label="Suggestions generated" value={String(lifetimeStats.totalSuggestions)} />
          {lifetimeStats.avgScore != null && <Stat label="Latest avg score" value={String(lifetimeStats.avgScore)} />}
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          <SystemStatusPanel
            database={systemStatus.database}
            redis={systemStatus.redis}
            aiService={systemStatus.aiService}
            lastScrapedAt={lastScrapedAt}
          />
          <ActivityFeed items={activityItems} />
        </div>

        <div className="space-y-6">
          <PlatformPanel
            label="X / Twitter"
            glyph="X"
            accent="cyan"
            connection={x}
            prominent
          />
        </div>
      </div>
    </HudBackground>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-mono font-semibold tabular-nums text-white">{value}</p>
      <p className="font-mono text-[10px] text-gray-500 mt-1 tracking-widest uppercase">{label}</p>
    </div>
  );
}
