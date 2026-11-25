import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Public (no sign-in): /, /demo, /api/ai/warm, and the metadata routes (icons, OG image, robots, sitemap).
// Only the onboarding wizard is gated here; API routes check auth themselves.
const isProtectedRoute = createRouteMatcher(['/onboarding(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
}, { jwtKey: process.env.CLERK_JWT_KEY })

export const config = {
  matcher: [
    // Skips Next internals, static files, and metadata routes so crawlers never hit Clerk's dev handshake.
    '/((?!_next|robots\\.txt|sitemap\\.xml|opengraph-image|twitter-image|icon|apple-icon|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
