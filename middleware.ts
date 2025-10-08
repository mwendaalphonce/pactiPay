// middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    
    // Public paths that don't require authentication
    const publicPaths = ['/signin', '/signup', '/error'] // Changed from /auth/signin
    if (publicPaths.some(p => path.startsWith(p))) {
      // If already authenticated, redirect to dashboard
      if (token) {
        return NextResponse.redirect(new URL('/', req.url))
      }
      return NextResponse.next()
    }
    
    // Onboarding flow
    if (path.startsWith('/onboarding')) {
      // If already onboarded, redirect to dashboard
      if (token?.hasCompletedOnboarding) {
        return NextResponse.redirect(new URL('/', req.url))
      }
      return NextResponse.next()
    }
    
    // Protected routes - require authentication
    if (!token) {
      const signInUrl = new URL('/signin', req.url) // Changed from /auth/signin
      signInUrl.searchParams.set('callbackUrl', path)
      return NextResponse.redirect(signInUrl)
    }
    
    // Redirect to onboarding if not completed
    if (!token.hasCompletedOnboarding && !path.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
    
    // Check if company is suspended
    if (token?.company && !token.company.isActive) {
      if (!path.startsWith('/suspended')) {
        return NextResponse.redirect(new URL('/suspended', req.url))
      }
      return NextResponse.next()
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        // Allow public paths without token
        const publicPaths = ['/signin', '/signup', '/error'] // Changed from /auth/
        if (publicPaths.some(p => path.startsWith(p))) {
          return true
        }
        // All other paths require token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
  '/((?!api|_next/static|_next/image|favicon.ico|public|images|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg).*)',
  ],
}