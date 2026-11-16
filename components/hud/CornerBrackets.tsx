const ACCENTS = {
  cyan: 'border-cyan-500/60',
  blue: 'border-blue-500/60',
  white: 'border-white/20',
} as const;

export default function CornerBrackets({
  accent = 'cyan',
  size = 2,
  thickness = 1,
}: {
  accent?: keyof typeof ACCENTS;
  size?: 2 | 3 | 4;
  thickness?: 1 | 2;
}) {
  const s = { 2: 'w-2 h-2', 3: 'w-3 h-3', 4: 'w-4 h-4' }[size];
  const t = thickness === 2 ? 'border-l-2 border-t-2' : 'border-l border-t';
  const tr = thickness === 2 ? 'border-r-2 border-t-2' : 'border-r border-t';
  const bl = thickness === 2 ? 'border-l-2 border-b-2' : 'border-l border-b';
  const br = thickness === 2 ? 'border-r-2 border-b-2' : 'border-r border-b';
  const color = ACCENTS[accent];

  return (
    <>
      <div className={`absolute -top-1 -left-1 ${s} ${t} ${color}`} />
      <div className={`absolute -top-1 -right-1 ${s} ${tr} ${color}`} />
      <div className={`absolute -bottom-1 -left-1 ${s} ${bl} ${color}`} />
      <div className={`absolute -bottom-1 -right-1 ${s} ${br} ${color}`} />
    </>
  );
}
