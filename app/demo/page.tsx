import type { Metadata } from 'next';
import { getDemoSnapshot } from '@/lib/demo-data';
import DemoView from './_components/DemoView';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Live demo',
  description:
    'Read-only view of a real P.R.A.N. performance report and content suggestions for an X account. No sign-in, no AI calls.',
  alternates: { canonical: '/demo' },
};

export default async function DemoPage() {
  const snapshot = await getDemoSnapshot();
  return <DemoView snapshot={snapshot} />;
}
