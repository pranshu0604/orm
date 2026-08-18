import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { hasCreditAvailable, recordUsage, recordFailedUsage } from '@/lib/credits';
import { apiActionLimiter } from '@/lib/rateLimit';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

type SseEvent = { type: string; [key: string]: unknown };

function sse(event: SseEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * POST /api/reports/twitter/stream
 * Same report as /api/reports/twitter, but streams raw model tokens live via SSE,
 * then persists + deducts credits once the AI service's "done" event arrives.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { success } = await apiActionLimiter.limit(userId);
  if (!success) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please slow down.' }), { status: 429 });
  }

  const body = await req.json();
  const { platformConnectionId } = body;
  if (!platformConnectionId) {
    return new Response(JSON.stringify({ error: 'Platform connection ID is required' }), { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }

  const canProceed = await hasCreditAvailable(user.id, user.tier, user.creditsRemaining, 'PERFORMANCE_REPORT');
  if (!canProceed) {
    return new Response(
      JSON.stringify({ error: 'Credit limit reached. Please upgrade or purchase more credits.' }),
      { status: 403 }
    );
  }

  const platformConnection = await prisma.platformConnection.findUnique({
    where: { id: platformConnectionId },
    include: {
      posts: {
        include: { metrics: true, sentiment: true },
        orderBy: { postedAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!platformConnection || platformConnection.userId !== user.id) {
    return new Response(JSON.stringify({ error: 'Platform connection not found' }), { status: 404 });
  }
  if (platformConnection.platform !== 'X') {
    return new Response(JSON.stringify({ error: 'Invalid platform. Expected X/Twitter.' }), { status: 400 });
  }

  const previousReports = await prisma.performanceReport.findMany({
    where: { userId: user.id, platformConnectionId, includedInContext: true },
    orderBy: { generatedAt: 'desc' },
    take: 3,
    select: { content: true, score: true },
  });
  const previousScore = previousReports[0]?.score ?? null;

  const userData = {
    username: platformConnection.username || 'Unknown',
    bio: platformConnection.platformAspiration || user.aspiration || '',
    followers: 0,
    following: 0,
  };

  const postsData = platformConnection.posts.map((post) => ({
    content: post.content || '',
    likes: post.metrics?.likes || 0,
    retweets: post.metrics?.shares || 0,
    replies: post.metrics?.comments || 0,
    views: post.metrics?.views ?? undefined,
    isPinned: post.isPinned ?? undefined,
    isRetweet: post.isRetweet ?? undefined,
    isQuote: post.isQuote ?? undefined,
    hasMedia: post.hasMedia ?? undefined,
  }));

  const aiResponse = await fetch(`${AI_SERVICE_URL}/v1/reports/twitter/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_data: userData,
      posts_data: postsData,
      target_tier: platformConnection.targetTier,
      previous_reports: previousReports.map((r) => r.content),
    }),
  });

  if (!aiResponse.ok || !aiResponse.body) {
    await recordFailedUsage({
      userId: user.id,
      usageType: 'PERFORMANCE_REPORT',
      platformType: 'X',
      errorMessage: `AI service returned ${aiResponse.status}`,
    });
    return new Response(JSON.stringify({ error: 'AI service is unavailable. Please try again.' }), { status: 502 });
  }

  const reader = aiResponse.body.getReader();
  const decoder = new TextDecoder();
  let clientGone = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Once the client disconnects, the controller is closed out from under us — every
      // further enqueue()/close() throws "Invalid state". Route all writes through this
      // so a slow/hung AI response after a client abort doesn't crash with an unhandled error.
      const safeEnqueue = (event: SseEvent) => {
        if (clientGone) return;
        try {
          controller.enqueue(sse(event));
        } catch {
          clientGone = true;
        }
      };
      const safeClose = () => {
        if (clientGone) return;
        try {
          controller.close();
        } catch {
          // already closed by the client side — nothing to do
        }
      };

      let buffer = '';
      try {
        while (!clientGone) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            if (!part.startsWith('data: ')) continue;
            let evt: { type: string; content?: string; report?: Record<string, unknown>; message?: string };
            try {
              evt = JSON.parse(part.slice(6));
            } catch {
              continue;
            }

            if (evt.type === 'token') {
              safeEnqueue({ type: 'token', content: evt.content });
            } else if (evt.type === 'error') {
              await recordFailedUsage({
                userId: user.id,
                usageType: 'PERFORMANCE_REPORT',
                platformType: 'X',
                errorMessage: evt.message || 'Unknown streaming error',
              });
              safeEnqueue({ type: 'error', message: evt.message });
            } else if (evt.type === 'done' && evt.report) {
              const report = evt.report as { overall_score: number; metrics: unknown };
              const savedReport = await prisma.performanceReport.create({
                data: {
                  userId: user.id,
                  platformConnectionId,
                  content: JSON.stringify(report),
                  score: report.overall_score,
                  metrics: report.metrics as never,
                  includedInContext: true,
                },
              });

              try {
                await recordUsage({ userId: user.id, tier: user.tier, usageType: 'PERFORMANCE_REPORT', platformType: 'X' });
              } catch (creditError) {
                await recordFailedUsage({
                  userId: user.id,
                  usageType: 'PERFORMANCE_REPORT',
                  platformType: 'X',
                  errorMessage: creditError instanceof Error ? creditError.message : 'Credit deduction failed',
                });
                safeEnqueue({ type: 'error', message: 'No credits remaining. Please purchase more credits.' });
                safeClose();
                return;
              }

              safeEnqueue({
                type: 'saved',
                report: { id: savedReport.id, ...report, generatedAt: savedReport.generatedAt, previousScore },
              });
            }
          }
        }
      } catch (err) {
        console.error('Error in Twitter report stream:', err);
        safeEnqueue({ type: 'error', message: 'Stream interrupted. Please try again.' });
      } finally {
        safeClose();
      }
    },
    cancel() {
      // Client disconnected (navigation, tab close, aborted fetch) — stop reading from the
      // AI service instead of burning tokens generating a report nobody will receive.
      clientGone = true;
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
