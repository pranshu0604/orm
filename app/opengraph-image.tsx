import { ImageResponse } from 'next/og';

export const alt = 'P.R.A.N. - AI-assisted reputation analytics for X';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const CYAN = '#22d3ee';

function Corner({ top, left }: { top?: boolean; left?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: 40,
        height: 40,
        [top ? 'top' : 'bottom']: 40,
        [left ? 'left' : 'right']: 40,
        borderColor: 'rgba(6,182,212,0.7)',
        borderStyle: 'solid',
        borderWidth: 0,
        [top ? 'borderTopWidth' : 'borderBottomWidth']: 4,
        [left ? 'borderLeftWidth' : 'borderRightWidth']: 4,
      }}
    />
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: '#030712',
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          color: 'white',
        }}
      >
        <Corner top left />
        <Corner top />
        <Corner left />
        <Corner />
        <div style={{ display: 'flex', alignItems: 'center', color: CYAN, fontSize: 28, letterSpacing: 6, marginBottom: 28 }}>
          {'// PUBLIC REPUTATION AND ANALYSIS NODE'}
        </div>
        <div style={{ display: 'flex', fontSize: 150, fontWeight: 800, letterSpacing: 10, lineHeight: 1 }}>
          P.R.A.N.<span style={{ color: CYAN }}>_</span>
        </div>
        <div style={{ display: 'flex', fontSize: 38, color: '#9ca3af', marginTop: 36, maxWidth: 900, lineHeight: 1.3 }}>
          Scheduled X scraping, computed engagement metrics, and streamed AI reports.
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#6b7280', marginTop: 40, letterSpacing: 3 }}>
          orm-pran.vercel.app
        </div>
      </div>
    ),
    size,
  );
}
