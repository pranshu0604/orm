import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)'])

const isPublicRoute = createRouteMatcher([ //for reference
    '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/sync-user(.*)',
  '/api/auth(.*)'
])

// Routes that should be accessible in production (waitlist-only mode)
const isProductionAllowedRoute = createRouteMatcher([
  '/',
  '/api/waitlist(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // In production, only allow access to the waitlist page and its API
  if (process.env.NODE_ENV === 'production') {
    if (!isProductionAllowedRoute(req)) {
      // Redirect all other routes to the homepage (waitlist)
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // In development, apply normal Clerk authentication for protected routes
  if (isProtectedRoute(req)) await auth.protect();
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}