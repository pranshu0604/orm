import { clerkMiddleware } from '@clerk/nextjs/server';
import { type NextFetchEvent, type NextRequest, NextResponse } from 'next/server';

const authenticate = clerkMiddleware({
  jwtKey: process.env.CLERK_JWT_KEY,
  authorizedParties: process.env.NEXTAUTH_URL ? [new URL(process.env.NEXTAUTH_URL).origin] : undefined,
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;
  if (pathname === '/' || pathname === '/mvp') return NextResponse.next();
  return authenticate(request, event);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
