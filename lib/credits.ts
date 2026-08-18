import { prisma } from './prisma';
import type { UserTier, PlatformType, UsageType } from '@prisma/client';

type BillableUsageType = 'PERFORMANCE_REPORT' | 'CONTENT_SUGGESTION';

const FREE_LIMITS: Record<BillableUsageType, number> = {
  PERFORMANCE_REPORT: 10,
  CONTENT_SUGGESTION: 20,
};

export async function hasCreditAvailable(
  userId: string,
  tier: UserTier,
  creditsRemaining: number,
  usageType: BillableUsageType
): Promise<boolean> {
  if (tier === 'PAID') return creditsRemaining > 0;

  const freeUsed = await prisma.usageHistory.count({
    where: { userId, usageType, successful: true },
  });
  return freeUsed < FREE_LIMITS[usageType] || creditsRemaining > 0;
}

// Conditional WHERE makes this race-safe: can't decrement below 0 on a stale read.
export async function recordUsage(params: {
  userId: string;
  tier: UserTier;
  usageType: UsageType;
  platformType: PlatformType;
}): Promise<{ creditsUsed: number }> {
  let creditsUsed = 0;
  if (params.tier === 'PAID') {
    creditsUsed = 1;
  } else {
    // FREE tier only draws on purchased credits once the free allotment for this usage type is used up.
    const limit = FREE_LIMITS[params.usageType as BillableUsageType] ?? 0;
    const freeUsed = await prisma.usageHistory.count({
      where: { userId: params.userId, usageType: params.usageType, successful: true },
    });
    if (freeUsed >= limit) creditsUsed = 1;
  }

  if (creditsUsed > 0) {
    const result = await prisma.user.updateMany({
      where: { id: params.userId, creditsRemaining: { gte: creditsUsed } },
      data: { creditsRemaining: { decrement: creditsUsed } },
    });
    if (result.count === 0) {
      throw new Error('No credits remaining. Please purchase more credits.');
    }
  }

  await prisma.usageHistory.create({
    data: {
      userId: params.userId,
      usageType: params.usageType,
      creditsUsed,
      successful: true,
      platformType: params.platformType,
    },
  });

  return { creditsUsed };
}

export async function recordFailedUsage(params: {
  userId: string;
  usageType: UsageType;
  platformType: PlatformType;
  errorMessage: string;
}): Promise<void> {
  await prisma.usageHistory.create({
    data: {
      userId: params.userId,
      usageType: params.usageType,
      creditsUsed: 0,
      successful: false,
      platformType: params.platformType,
      errorMessage: params.errorMessage,
    },
  });
}
