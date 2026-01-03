import { type NextRequest, NextResponse } from 'next/server'

/**
 * Public page routes that don't require authentication
 */
const PUBLIC_PAGE_ROUTES = ['/login', '/register', '/forgot-password']

/**
 * Check if a pathname matches any public page route
 */
function isPublicPageRoute(pathname: string): boolean {
  return PUBLIC_PAGE_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Middleware stub - replace with your auth provider's middleware
 * 
 * TODO: Implement authentication check with your new backend
 * For now, allows all routes for development
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // TODO: Replace with your auth check
  // For development, assume authenticated
  const isAuthenticated = true

  // Page route protection
  if (!isAuthenticated && !isPublicPageRoute(pathname)) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isPublicPageRoute(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

// Match all routes except static files and Next.js internals
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
