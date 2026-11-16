import CornerBrackets from './CornerBrackets';

type StatusRow = { label: string; ok: boolean };

function timeAgo(date: Date | null): string {
  if (!date) return 'never';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SystemStatusPanel({
  database,
  redis,
  aiService,
  lastScrapedAt,
}: {
  database: boolean;
  redis: boolean;
  aiService: boolean;
  lastScrapedAt: Date | null;
}) {
  const rows: StatusRow[] = [
    { label: 'Database', ok: database },
    { label: 'Redis', ok: redis },
    { label: 'AI Service', ok: aiService },
  ];

  return (
    <div className="relative bg-[#0a0f1e]/60 backdrop-blur-sm border border-blue-500/20 p-5">
      <CornerBrackets accent="cyan" size={3} thickness={2} />
      <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mb-4">System Status</p>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${row.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className="font-mono text-xs text-gray-400">{row.label}</span>
            </div>
            <span className={`font-mono text-[10px] uppercase tracking-widest ${row.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {row.ok ? 'Online' : 'Offline'}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2.5 border-t border-blue-500/10">
          <span className="font-mono text-xs text-gray-400">Last scrape</span>
          <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">{timeAgo(lastScrapedAt)}</span>
        </div>
      </div>
    </div>
  );
}
