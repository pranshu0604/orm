import { prisma } from './prisma';
import { redis } from './redis';
import { getAiServiceUrl } from './ai-url';

export type SystemStatus = {
  database: boolean;
  redis: boolean;
  aiService: boolean;
};

const HEALTH_CHECK_TIMEOUT_MS = 2500;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

async function checkAiService(): Promise<boolean> {
  const baseUrl = getAiServiceUrl();
  if (!baseUrl) return false;
  try {
    const res = await withTimeout(fetch(new URL('/v1/health', baseUrl), { cache: 'no-store' }), HEALTH_CHECK_TIMEOUT_MS);
    return res.ok;
  } catch {
    return false;
  }
}

/** Live health check of the app's dependencies, for the dashboard's System Status panel. */
export async function getSystemStatus(): Promise<SystemStatus> {
  const [database, redisOk, aiService] = await Promise.all([
    withTimeout(prisma.$queryRaw`SELECT 1`, HEALTH_CHECK_TIMEOUT_MS)
      .then(() => true)
      .catch(() => false),
    withTimeout(redis.ping(), HEALTH_CHECK_TIMEOUT_MS)
      .then(() => true)
      .catch(() => false),
    checkAiService(),
  ]);

  return { database, redis: redisOk, aiService };
}
