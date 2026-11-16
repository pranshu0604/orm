'use server';

import { PlatformType } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { isDemoOwner } from '@/lib/demo-access';
import { prisma } from '@/lib/prisma';

// Type for the data returned to the client
type ConnectionInfo = {
  id: string;
  platform: PlatformType;
  connectedAt: Date;
  profileId: string | null;
  username: string | null;
};


export async function getPlatformConnectionsAction(): Promise<ConnectionInfo[]> {
  const authData = await auth();
  const clerkId = authData.userId;

  if (!clerkId || !isDemoOwner(clerkId)) {
    throw new Error("User not authenticated.");
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true }
  });

  if (!dbUser) {
    console.warn(`getPlatformConnectionsAction: User with clerkId ${clerkId} not found in DB yet.`);
    return [];
  }

  const connections = await prisma.platformConnection.findMany({
    where: { userId: dbUser.id, username: { not: null } },
    select: {
      id: true,
      platform: true,
      connectedAt: true,
      profileId: true,
      username: true,
    },
    orderBy: {
      platform: 'asc',
    }
  });

  return connections.map(conn => ({
      ...conn,
      profileId: conn.profileId ?? null
  }));
}

export async function disconnectPlatformAction(platform: PlatformType): Promise<{ success: boolean; error?: string }> {
    const authData = await auth();
    const clerkId = authData.userId;

    if (!clerkId || !isDemoOwner(clerkId)) return { success: false, error: "User not authenticated." };

    const dbUser = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!dbUser) return { success: false, error: "User not found." };

    try {
        await prisma.platformConnection.updateMany({
            where: { userId: dbUser.id, platform },
            data: { username: null, accessToken: null, refreshToken: null, expiresAt: null, scopes: null },
        });

        console.log(`Disconnected ${platform} for user ${dbUser.id}`);
        revalidatePath('/settings/connections');
        return { success: true };
  } catch (error: unknown) {
    console.error(`Error disconnecting ${platform}:`, error);
    return { success: false, error: `Failed to disconnect ${platform}.` };
  }
}