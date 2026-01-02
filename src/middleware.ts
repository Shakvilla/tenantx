import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Public page routes that don't require authentication
 */
const PUBLIC_PAGE_ROUTES = ['/login', '/register', '/forgot-password', '/api-docs']

/**
 * Public API routes that don't require authentication
 */
const PUBLIC_API_ROUTES = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/refresh',
]

/**
 * Check if a pathname matches any public page route
 */
function isPublicPageRoute(pathname: string): boolean {
  return PUBLIC_PAGE_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if a pathname matches any public API route
 */
function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Middleware to:
 * 1. Refresh Supabase auth session on every request
 * 2. Protect dashboard routes - redirect unauthenticated users to login
 * 3. Redirect authenticated users away from auth pages to dashboard
 * 4. Protect API routes - return 401 for unauthenticated requests
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user session - this also refreshes the session cookies if needed
  const { data: { user } } = await supabase.auth.getUser()

  // Check if this is an API route
  const isApiRoute = pathname.startsWith('/api/')
  
  // API route authorization
  if (isApiRoute) {
    // Allow public API routes without auth
    if (isPublicApiRoute(pathname)) {
      return response
    }
    
    // Check for Bearer token (for external API clients)
    const authHeader = request.headers.get('Authorization')
    const hasBearerToken = authHeader?.startsWith('Bearer ')
    
    // If no cookie session AND no Bearer token, return 401
    if (!user && !hasBearerToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Authentication required' 
          } 
        },
        { status: 401 }
      )
    }
    
    // API route has auth (cookie or bearer), let it proceed to route handler
    return response
  }
  
  // Page route protection
  // If not authenticated and trying to access a protected page, redirect to login
  if (!user && !isPublicPageRoute(pathname)) {
    const redirectUrl = new URL('/login', request.url)
    // Preserve the original URL for post-login redirect
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // If authenticated and trying to access auth pages, redirect to dashboard
  if (user && isPublicPageRoute(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

// Match all routes except static files and Next.js internals
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
