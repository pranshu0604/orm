'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { PlatformType } from '@prisma/client';
import type { GitHubPerformanceReport } from '@/lib/ai-client';
import { getPlatformConnectionsAction, disconnectPlatformAction } from '@/app/actions/platformActions';

type Connection = Awaited<ReturnType<typeof getPlatformConnectionsAction>>[number];

export default function Connections({ initialConnections }: { initialConnections: Connection[] }) {
  const [connections, setConnections] = useState(initialConnections);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<GitHubPerformanceReport | null>(null);
  const platforms = process.env.NODE_ENV === 'development'
    ? [PlatformType.GITHUB, PlatformType.X]
    : [PlatformType.GITHUB];

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The request failed.');
    } finally {
      setBusy(false);
    }
  }

  async function generateReport(connection: Connection) {
    setReport(null);
    const response = await fetch('/api/reports/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platformConnectionId: connection.id }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not generate the report.');
    setReport(data.report);
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold">Manage connections</h1>
      {error && <p role="alert" className="mb-4 rounded border border-red-500 p-3">{error}</p>}
      <div className="space-y-4">
        {platforms.map((platform) => {
          const connection = connections.find((entry) => entry.platform === platform);
          const provider = platform === 'GITHUB' ? 'github' : 'twitter';
          return (
            <section key={platform} className="rounded border p-4">
              <h2 className="font-semibold">{platform === 'GITHUB' ? 'GitHub' : 'X (Twitter)'}</h2>
              {connection && <p>Connected as {connection.username}</p>}
              <div className="mt-3 flex flex-wrap gap-3">
                {connection ? (
                  <>
                    {platform === 'GITHUB' && (
                      <button className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
                        disabled={busy} onClick={() => run(() => generateReport(connection))}>
                        Generate report
                      </button>
                    )}
                    <button className="rounded border px-3 py-1 disabled:opacity-50" disabled={busy}
                      onClick={() => run(async () => {
                        const result = await disconnectPlatformAction(platform);
                        if (!result.success) throw new Error(result.error || 'Could not disconnect.');
                        setConnections(await getPlatformConnectionsAction());
                        setReport(null);
                      })}>
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
                    disabled={busy} onClick={() => run(async () => {
                      await signIn(provider, { callbackUrl: '/settings/connections' });
                    })}>
                    Connect
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {busy && <p role="status" className="mt-4">Working…</p>}
      {report && (
        <section aria-live="polite" className="mt-6 rounded border p-4">
          <h2 className="text-lg font-semibold">GitHub report · {report.overall_score}/100</h2>
          <p className="mt-2">{report.summary}</p>
          <h3 className="mt-3 font-semibold">What to improve</h3>
          <ul className="list-disc pl-5">
            {report.areas_for_improvement.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>
      )}
    </main>
  );
}
