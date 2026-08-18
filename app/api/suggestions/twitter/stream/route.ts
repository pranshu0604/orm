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
 * POST /api/suggestions/twitter/stream
 * Same suggestions as /api/suggestions/twitter, but streams raw model tokens live via
 * SSE, then persists + deducts credits once the AI service's "done" event arrives.
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
  const { platformConnectionId, basedOnReportId, customPrompt } = body;
  if (!platformConnectionId) {
    return new Response(JSON.stringify({ error: 'Platform connection ID is required' }), { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }

  if (customPrompt && user.tier === 'FREE') {
    return new Response(JSON.stringify({ error: 'Custom prompts are a paid feature' }), { status: 403 });
  }

  const canProceed = await hasCreditAvailable(user.id, user.tier, user.creditsRemaining, 'CONTENT_SUGGESTION');
  if (!canProceed) {
    return new Response(
      JSON.stringify({ error: 'Credit limit reached. Please upgrade or purchase more credits.' }),
      { status: 403 }
    );
  }

  const platformConnection = await prisma.platformConnection.findUnique({
    where: { id: platformConnectionId },
  });
  if (!platformConnection || platformConnection.userId !== user.id) {
    return new Response(JSON.stringify({ error: 'Platform connection not found' }), { status: 404 });
  }
  if (platformConnection.platform !== 'X') {
    return new Response(JSON.stringify({ error: 'Invalid platform. Expected X/Twitter.' }), { status: 400 });
  }

  let basedOnReport: string | undefined;
  if (basedOnReportId) {
    const report = await prisma.performanceReport.findUnique({ where: { id: basedOnReportId } });
    if (report && report.userId === user.id) basedOnReport = report.content;
  }

  const previousSuggestions = await prisma.contentSuggestion.findMany({
    where: { userId: user.id, platformConnectionId, includedInContext: true },
    orderBy: { generatedAt: 'desc' },
    take: 3,
    select: { content: true },
  });

  const userData = {
    username: platformConnection.username || 'Unknown',
    bio: platformConnection.platformAspiration || user.aspiration || '',
    role_aspiration: platformConnection.platformRole || user.role || '',
  };

  const usageType = customPrompt ? 'CUSTOM_PROMPT' : 'CONTENT_SUGGESTION';

  const aiResponse = await fetch(`${AI_SERVICE_URL}/v1/suggestions/twitter/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_data: userData,
      target_tier: platformConnection.targetTier,
      based_on_report: basedOnReport,
      custom_prompt: customPrompt,
      previous_suggestions: previousSuggestions.map((s) => s.content),
    }),
  });

  if (!aiResponse.ok || !aiResponse.body) {
    await recordFailedUsage({
      userId: user.id,
      usageType,
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
            let evt: { type: string; content?: string; suggestions?: Record<string, unknown>; message?: string };
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
                usageType,
                platformType: 'X',
                errorMessage: evt.message || 'Unknown streaming error',
              });
              safeEnqueue({ type: 'error', message: evt.message });
            } else if (evt.type === 'done' && evt.suggestions) {
              const suggestions = evt.suggestions;
              const savedSuggestion = await prisma.contentSuggestion.create({
                data: {
                  userId: user.id,
                  platformConnectionId,
                  suggestionType: 'TWEET',
                  content: JSON.stringify(suggestions),
                  customPrompt,
                  basedOnReportId,
                  includedInContext: true,
                },
              });

              try {
                await recordUsage({ userId: user.id, tier: user.tier, usageType, platformType: 'X' });
              } catch (creditError) {
                await recordFailedUsage({
                  userId: user.id,
                  usageType,
                  platformType: 'X',
                  errorMessage: creditError instanceof Error ? creditError.message : 'Credit deduction failed',
                });
                safeEnqueue({ type: 'error', message: 'No credits remaining. Please purchase more credits.' });
                safeClose();
                return;
              }

              safeEnqueue({
                type: 'saved',
                suggestion: { id: savedSuggestion.id, ...suggestions, generatedAt: savedSuggestion.generatedAt },
              });
            }
          }
        }
      } catch (err) {
        console.error('Error in Twitter suggestions stream:', err);
        safeEnqueue({ type: 'error', message: 'Stream interrupted. Please try again.' });
      } finally {
        safeClose();
      }
    },
    cancel() {
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
