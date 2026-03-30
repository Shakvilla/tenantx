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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Read auth tokens from cookies
  const authToken = request.cookies.get('auth_token')?.value
  const tenantId = request.cookies.get('tenant_id')?.value

  // We consider the user fully authenticated if they have both an auth token and a selected tenant
  const isAuthenticated = !!authToken && !!tenantId

  // 1. Unauthenticated users trying to access protected routes -> redirect to login
  if (!isAuthenticated && !isPublicPageRoute(pathname)) {
    const redirectUrl = new URL('/login', request.url)

    if (pathname !== '/') {
      redirectUrl.searchParams.set('redirectTo', pathname)
    }

    return NextResponse.redirect(redirectUrl)
  }
  
  // 2. Authenticated users trying to access public auth routes -> redirect to dashboard
  if (isAuthenticated && isPublicPageRoute(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3. For all other requests, pass through and inject auth headers for Server Components
  const requestHeaders = new Headers(request.headers)

  if (authToken) {
    requestHeaders.set('Authorization', `Bearer ${authToken}`)
  }

  if (tenantId) {
    requestHeaders.set('X-Tenant-ID', tenantId)
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Match all routes except API, static files, and Next.js internals
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
