import CornerBrackets from './CornerBrackets';

export type ActivityItem = {
  id: string;
  type: 'report' | 'suggestion' | 'notable';
  timestamp: Date;
  summary: string;
  meta?: string;
};

const TYPE_META: Record<ActivityItem['type'], { label: string; color: string }> = {
  report: { label: 'REPORT', color: 'text-cyan-400' },
  suggestion: { label: 'SUGGESTION', color: 'text-purple-400' },
  notable: { label: 'SPIKE', color: 'text-amber-400' },
};

export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="relative bg-[#0a0f1e]/60 backdrop-blur-sm border border-blue-500/20 p-5">
      <CornerBrackets accent="cyan" size={3} thickness={2} />
      <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mb-4">Activity Log</p>

      {items.length === 0 ? (
        <p className="font-mono text-xs text-gray-600 py-4">
          <span className="text-gray-700 mr-1">&gt;</span>no activity yet — connect a platform and generate a report to get started
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {items.map((item) => {
            const meta = TYPE_META[item.type];
            return (
              <div key={`${item.type}-${item.id}`} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-b-0 last:pb-0">
                <span className={`font-mono text-[9px] tracking-widest shrink-0 mt-0.5 ${meta.color}`}>[{meta.label}]</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 font-light line-clamp-2">{item.summary}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] text-gray-600">
                      {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    {item.meta && (
                      <>
                        <span className="text-gray-700">&middot;</span>
                        <span className="font-mono text-[10px] text-gray-500">{item.meta}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
