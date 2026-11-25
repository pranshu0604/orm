export type ReportSummaryData = {
  overall_score: number;
  summary: string;
  strengths: string[];
  areas_for_improvement: string[];
  previousScore?: number | null;
};

const ACCENT_TEXT = 'text-cyan-400';

export default function ReportSummary({ report }: { report: ReportSummaryData }) {
  return (
    <>
      <div className="flex items-baseline gap-3 mb-2">
        <span className={`text-3xl font-mono font-bold tabular-nums ${ACCENT_TEXT}`}>{report.overall_score}</span>
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
    </>
  );
}
