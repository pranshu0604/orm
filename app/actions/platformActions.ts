'use server';

import { PrismaClient, PlatformConnection, PlatformType } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

// Type for the data returned to the client
type ConnectionInfo = {
  platform: PlatformType;
  connectedAt: Date;
  profileId: string | null;
  username: string | null; 
};


export async function getPlatformConnectionsAction(): Promise<ConnectionInfo[]> {
  const authData = await auth();
  const clerkId = authData.userId;

  if (!clerkId) {
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
    where: { userId: dbUser.id },
    select: {
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
    // --- Add await here ---
    const authData = await auth();
    const clerkId = authData.userId;

    if (!clerkId) return { success: false, error: "User not authenticated." };

    const dbUser = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!dbUser) return { success: false, error: "User not found." };

    try {
        await prisma.platformConnection.delete({
            where: { userId_platform: { userId: dbUser.id, platform } }
        });

        console.log(`Disconnected ${platform} for user ${dbUser.id}`);
        revalidatePath('/settings/connections');
        return { success: true };
    } catch (error: any) {
        if (error.code === 'P2025') { // Record to delete does not exist
             console.warn(`Attempted to disconnect ${platform} for user ${dbUser.id}, but no record found.`);
             revalidatePath('/settings/connections');
             return { success: true }; 
        }
        console.error(`Error disconnecting ${platform}:`, error);
        return { success: false, error: `Failed to disconnect ${platform}.` };
    }
}