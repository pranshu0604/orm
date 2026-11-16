import 'server-only';

export function isDemoOwner(userId: string | null): boolean {
  return Boolean(userId && userId === process.env.DEMO_OWNER_CLERK_USER_ID);
}

// Browser mutations must come from the configured demo origin.
export function allowsDemoOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Non-browser clients still need the verified owner session.
  const appUrl = process.env.NEXTAUTH_URL;
  return Boolean(appUrl && origin === new URL(appUrl).origin);
}
