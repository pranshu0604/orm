'use client';

import { useMemo, useRef, useState } from 'react';

type ChartPoint = { postedAt: string | Date; likes: number; views: number; shares: number; comments: number };
type MetricKey = 'likes' | 'views' | 'shares' | 'comments';

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'likes', label: 'Likes' },
  { key: 'views', label: 'Views' },
  { key: 'shares', label: 'Shares' },
  { key: 'comments', label: 'Replies' },
];

const WIDTH = 600;
const HEIGHT = 160;
const PAD_LEFT = 8;
const PAD_RIGHT = 44;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

export default function EngagementChart({ posts }: { posts: ChartPoint[] }) {
  const [metric, setMetric] = useState<MetricKey>('likes');
  const [showTable, setShowTable] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const sorted = useMemo(
    () => [...posts].sort((a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime()),
    [posts]
  );

  if (sorted.length < 2) {
    return (
      <p className="font-mono text-xs text-gray-600 py-6 text-center">
        <span className="text-gray-700 mr-1">&gt;</span>not enough data yet — scrape a few more posts
      </p>
    );
  }

  const values = sorted.map((p) => p[metric]);
  const maxValue = Math.max(...values, 1);
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const points = sorted.map((p, i) => {
    const x = PAD_LEFT + (i / (sorted.length - 1)) * plotWidth;
    const y = PAD_TOP + plotHeight - (p[metric] / maxValue) * plotHeight;
    return { x, y, value: p[metric], date: new Date(p.postedAt) };
  });

  const linePath = points.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${PAD_TOP + plotHeight} L${points[0].x.toFixed(1)},${PAD_TOP + plotHeight} Z`;

  const gridLines = [0, 0.5, 1].map((f) => PAD_TOP + plotHeight * f);
  const last = points[points.length - 1];

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((pt, i) => {
      const dist = Math.abs(pt.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  };

  const hovered = hoverIdx !== null ? points[hoverIdx] : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 transition-colors ${
                metric === m.key ? 'text-cyan-400 border-b border-cyan-400' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowTable((s) => !s)}
          className="font-mono text-[10px] text-gray-600 hover:text-gray-400 uppercase tracking-widest"
        >
          {showTable ? 'View chart' : 'View as list'}
        </button>
      </div>

      {showTable ? (
        <div className="max-h-40 overflow-y-auto font-mono text-xs text-gray-400 space-y-1 pr-1">
          {[...points].reverse().map((pt, i) => (
            <div key={i} className="flex justify-between border-b border-white/5 py-1">
              <span>{pt.date.toLocaleDateString()}</span>
              <span className="text-white tabular-nums">{pt.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full h-auto touch-none"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIdx(null)}
          >
            {gridLines.map((y, i) => (
              <line key={i} x1={PAD_LEFT} y1={y} x2={WIDTH - PAD_RIGHT} y2={y} stroke="#ffffff" strokeOpacity={0.06} strokeWidth={1} />
            ))}

            <path d={areaPath} fill="#22d3ee" fillOpacity={0.1} stroke="none" />
            <path d={linePath} fill="none" stroke="#22d3ee" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {hovered && (
              <line x1={hovered.x} y1={PAD_TOP} x2={hovered.x} y2={PAD_TOP + plotHeight} stroke="#22d3ee" strokeOpacity={0.3} strokeWidth={1} />
            )}

            <circle cx={last.x} cy={last.y} r={4} fill="#22d3ee" stroke="#0a0f1e" strokeWidth={2} />
            <text x={last.x} y={last.y - 10} textAnchor="end" className="fill-white font-mono" fontSize={11}>
              {last.value.toLocaleString()}
            </text>

            {hovered && (
              <circle cx={hovered.x} cy={hovered.y} r={4} fill="#22d3ee" stroke="#0a0f1e" strokeWidth={2} />
            )}
          </svg>

          {hovered && (
            <div
              className="absolute top-0 bg-[#030712] border border-cyan-500/30 px-2 py-1 pointer-events-none font-mono text-[10px] whitespace-nowrap"
              style={{
                left: `${(hovered.x / WIDTH) * 100}%`,
                transform: hovered.x > WIDTH * 0.7 ? 'translateX(-100%)' : 'translateX(8px)',
              }}
            >
              <div className="text-gray-500">{hovered.date.toLocaleDateString()}</div>
              <div className="text-cyan-400 font-semibold">{hovered.value.toLocaleString()}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
