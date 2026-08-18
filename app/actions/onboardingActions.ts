'use server';

import { PlatformType, TargetTier } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { aiClient } from '@/lib/ai-client';

async function requireDbUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('User not authenticated.');

  const dbUser = await prisma.user.findUnique({ where: { clerkId } });
  if (!dbUser) throw new Error('User not found. Try refreshing the page.');

  return dbUser;
}

export async function getOnboardingStateAction() {
  const dbUser = await requireDbUser();

  const connections = await prisma.platformConnection.findMany({
    where: { userId: dbUser.id },
    select: {
      platform: true,
      username: true,
      setupCompleted: true,
      platformRole: true,
      platformAspiration: true,
      targetTier: true,
    },
  });

  return {
    name: dbUser.name,
    role: dbUser.role,
    aspiration: dbUser.aspiration,
    targetCloudVolume: dbUser.targetCloudVolume,
    onboardingCompleted: dbUser.onboardingCompleted,
    connections,
  };
}

export async function saveProfileAction(input: {
  role: string;
  aspiration: string;
  targetCloudVolume: string;
}): Promise<{ success: boolean; error?: string }> {
  const dbUser = await requireDbUser();

  if (!input.role.trim() || !input.aspiration.trim() || !input.targetCloudVolume.trim()) {
    return { success: false, error: 'All fields are required.' };
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      role: input.role.trim(),
      aspiration: input.aspiration.trim(),
      targetCloudVolume: input.targetCloudVolume.trim(),
    },
  });

  // Not marked onboardingCompleted here — that only happens once the wizard is
  // actually finished (see completeOnboardingAction), otherwise revalidatePath
  // triggers OnboardingPage's server-side redirect mid-wizard and skips steps 2-3.
  return { success: true };
}

export async function completeOnboardingAction(): Promise<void> {
  const dbUser = await requireDbUser();
  await prisma.user.update({
    where: { id: dbUser.id },
    data: { onboardingCompleted: true },
  });
}

export async function savePlatformSetupAction(
  platform: PlatformType,
  input: { platformRole: string; platformAspiration: string; targetTier: TargetTier }
): Promise<{ success: boolean; error?: string }> {
  const dbUser = await requireDbUser();

  try {
    await prisma.platformConnection.update({
      where: { userId_platform: { userId: dbUser.id, platform } },
      data: {
        platformRole: input.platformRole.trim(),
        platformAspiration: input.platformAspiration.trim(),
        targetTier: input.targetTier,
        setupCompleted: true,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: `Connect ${platform} before configuring it.` };
  }
}

export async function generateWelcomeGreetingAction(): Promise<{ greeting: string }> {
  const dbUser = await requireDbUser();

  const fallback = `Welcome aboard${dbUser.name ? `, ${dbUser.name.split(' ')[0]}` : ''}. Let's start building your reputation.`;

  if (!dbUser.role || !dbUser.aspiration) return { greeting: fallback };

  try {
    const response = await aiClient.generateCustomResponse({
      customPrompt: `Write a single warm, energetic, 2-sentence welcome message for a new user of an online reputation management tool. Their role is "${dbUser.role}" and their goal is "${dbUser.aspiration}". Speak directly to them. No preamble, just the message.`,
      platformType: 'X',
      userContext: {
        username: dbUser.name || 'there',
        role_aspiration: dbUser.aspiration,
      },
    });
    return { greeting: response.response };
  } catch {
    return { greeting: fallback };
  }
}
