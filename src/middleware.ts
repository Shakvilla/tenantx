import { type NextRequest, NextResponse } from 'next/server'

/**
 * Public page routes that don't require authentication
 */
const PUBLIC_PAGE_ROUTES = ['/login', '/register', '/forgot-password']

/**
 * Public vacancy listing routes — no auth required
 */
const PUBLIC_VACANCY_ROUTES = ['/vacancies']

function isPublicPageRoute(pathname: string): boolean {
  return PUBLIC_PAGE_ROUTES.some(route => pathname.startsWith(route))
}

function isPublicVacancyRoute(pathname: string): boolean {
  return PUBLIC_VACANCY_ROUTES.some(route => pathname.startsWith(route))
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Vacancy listing pages are always public ──────────────────────────────
  if (isPublicVacancyRoute(pathname)) {
    return NextResponse.next()
  }

  // ── Read cookies ──────────────────────────────────────────────────────────
  const adminToken = request.cookies.get('admin_token')?.value
  const authToken  = request.cookies.get('auth_token')?.value
  const tenantId   = request.cookies.get('tenant_id')?.value

  const isAdminAuthenticated  = !!adminToken
  const isTenantAuthenticated = !!authToken && !!tenantId

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN ROUTES  /admin/**
  // ═══════════════════════════════════════════════════════════════════════════
  if (isAdminRoute(pathname)) {
    if (!isAdminAuthenticated) {
      // Not logged in as admin → send to /login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Inject admin token as Authorization header for any admin Server Components
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('Authorization', `Bearer ${adminToken}`)

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH PAGES  /login, /register, etc.
  // ═══════════════════════════════════════════════════════════════════════════
  if (isPublicPageRoute(pathname)) {
    // Already logged in as admin → go to admin dashboard
    if (isAdminAuthenticated) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // Already logged in as tenant → go to tenant dashboard
    if (isTenantAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TENANT ROUTES  (everything else)
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. Unauthenticated → login
  if (!isTenantAuthenticated) {
    const redirectUrl = new URL('/login', request.url)
    if (pathname !== '/') {
      redirectUrl.searchParams.set('redirectTo', pathname)
    }
    return NextResponse.redirect(redirectUrl)
  }

  // 2. Authenticated — inject auth headers for Server Components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('Authorization', `Bearer ${authToken}`)
  requestHeaders.set('X-Tenant-ID', tenantId!)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

// Match all routes except API, static files, and Next.js internals
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
