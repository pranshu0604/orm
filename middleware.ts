import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// /dashboard is just a redirect to / now — leave it unprotected so a signed-out visit
// lands on the new landing page instead of Clerk's hosted sign-in.
const isProtectedRoute = createRouteMatcher(['/forum(.*)', '/onboarding(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}