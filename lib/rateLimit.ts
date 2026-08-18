import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';

// Authenticated actions that hit an external API (AI provider, Nitter) — keyed by Clerk userId.
// Credits already cap paid usage, but this protects against rapid-fire abuse independent of that.
export const apiActionLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'ratelimit:api',
});

// Unauthenticated, public-facing endpoints (waitlist signup, OAuth entry points) — keyed by IP.
export const publicActionLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  prefix: 'ratelimit:public',
});

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
