import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import OnboardingWizard from './_components/OnboardingWizard';

export default async function OnboardingPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect('/');

  let dbUser = await prisma.user.findUnique({ where: { clerkId } });

  // The Clerk webhook usually creates this row, but don't strand a first-time
  // visitor if the webhook hasn't fired yet (e.g. local dev without a tunnel).
  if (!dbUser) {
    const clerkUser = await currentUser();
    dbUser = await prisma.user.create({
      data: {
        clerkId,
        email: clerkUser?.emailAddresses[0]?.emailAddress || '',
        name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' '),
        image: clerkUser?.imageUrl || '',
      },
    });
  }

  if (dbUser.onboardingCompleted) redirect('/');

  return (
    <OnboardingWizard
      firstName={dbUser.name?.split(' ')[0] || null}
      initialProfile={{
        role: dbUser.role,
        aspiration: dbUser.aspiration,
        targetCloudVolume: dbUser.targetCloudVolume,
      }}
    />
  );
}
