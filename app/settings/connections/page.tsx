import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { isDemoOwner } from '@/lib/demo-access';
import { getPlatformConnectionsAction } from '@/app/actions/platformActions';
import Connections from './Connections';

export default async function ConnectionsPage() {
  const { userId } = await auth();
  if (!isDemoOwner(userId)) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold">Live reports are reserved for the demo owner</h1>
        <Link className="mt-4 inline-block underline" href="/mvp">View the public sample</Link>
      </main>
    );
  }
  return <Connections initialConnections={await getPlatformConnectionsAction()} />;
}
