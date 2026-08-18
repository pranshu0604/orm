import { prisma } from './prisma';
import { redis } from './redis';

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

/** Live health check of the app's dependencies, for the dashboard's System Status panel. */
export async function getSystemStatus(): Promise<SystemStatus> {
  const [database, redisOk, aiService] = await Promise.all([
    withTimeout(prisma.$queryRaw`SELECT 1`, HEALTH_CHECK_TIMEOUT_MS)
      .then(() => true)
      .catch(() => false),
    withTimeout(redis.ping(), HEALTH_CHECK_TIMEOUT_MS)
      .then(() => true)
      .catch(() => false),
    withTimeout(
      fetch(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/v1/health`),
      HEALTH_CHECK_TIMEOUT_MS
    )
      .then((res) => res.ok)
      .catch(() => false),
  ]);

  return { database, redis: redisOk, aiService };
}
