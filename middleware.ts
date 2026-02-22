import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/', '/login', '/register'])

export default clerkMiddleware(async (auth, req) => {
  // Skip middleware for API routes - they handle authentication themselves
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return
  }
  
  // Protect all other routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/'],
}
