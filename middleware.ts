import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define the routes that require the user to be logged in
const isProtectedRoute = createRouteMatcher([
  '/play(.*)',
  '/campaign(.*)',
  '/shop(.*)',
  '/profile(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

// This config tells Next.js EXACTLY when to run this middleware
export const config = {
  runtime: 'nodejs',
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};