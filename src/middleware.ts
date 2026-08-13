import { type NextRequest, NextResponse } from 'next/server'

/**
 * Public page routes that don't require authentication.
 *
 * `/platform-offline` is the screen shown when the platform itself is down.
 * It lived at `/maintenance` until it was found to be shadowing the
 * landlord's own Maintenance section: because these routes were matched with
 * a bare `startsWith`, listing `/maintenance` here made `/maintenance/requests`
 * and every other page under it public, so a signed-out visitor reached them
 * with no redirect to login. See `matchesRoute` below.
 */
const PUBLIC_PAGE_ROUTES = ['/login', '/register', '/forgot-password', '/auth/impersonate', '/platform-offline', '/jobs']

/**
 * Public vacancy listing routes — no auth required
 */
const PUBLIC_VACANCY_ROUTES = ['/vacancies', '/listings']

/**
 * Public routes within the /admin/** space — no admin session needed.
 * All other /admin/** routes require an admin_token cookie.
 */
const ADMIN_PUBLIC_ROUTES = ['/admin/login']

/**
 * Routes that only the tenant LANDLORD (userType=LANDLORD) may access.
 * STAFF users cannot reach these even with a valid token — this is a UX
 * guard only; the backend @PreAuthorize annotations are the real security
 * boundary.
 */
const LANDLORD_ONLY_ROUTES = [
  '/settings/company',
  '/settings/payment',
  '/settings/security',
  '/settings/notification',
  '/settings/recurring-invoice',
  '/settings/team',
]

/**
 * Prefix match on whole path segments.
 *
 * These lists have to match subpaths — `/jobs/<token>` is public, and
 * `/settings/payment` is one entry standing for a page. A bare `startsWith`
 * does that but also matches any route merely *beginning* with those
 * characters, which is how the entire `/maintenance/**` subtree ended up
 * public: it shared a prefix with the platform's offline page. Requiring the
 * next character to be a '/' keeps the subpaths while making a listed route
 * unable to speak for a sibling that happens to start the same way.
 */
function matchesRoute(pathname: string, routes: readonly string[]): boolean {
  return routes.some(route => pathname === route || pathname.startsWith(`${route}/`))
}

function isPublicPageRoute(pathname: string): boolean {
  return matchesRoute(pathname, PUBLIC_PAGE_ROUTES)
}

function isPublicVacancyRoute(pathname: string): boolean {
  return matchesRoute(pathname, PUBLIC_VACANCY_ROUTES)
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin')
}

function isAdminPublicRoute(pathname: string): boolean {
  return matchesRoute(pathname, ADMIN_PUBLIC_ROUTES)
}

function isLandlordOnlyRoute(pathname: string): boolean {
  return matchesRoute(pathname, LANDLORD_ONLY_ROUTES)
}

/**
 * Decodes the JWT payload without verifying the signature — the backend
 * validates the signature on every API call. The middleware only needs to
 * read claims (userType) to make a UX-level routing decision.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payloadB64 = token.split('.')[1]

    if (!payloadB64) return null

    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))

    return JSON.parse(json)
  } catch {
    return null
  }
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
    // /admin/login is always public — no session needed
    if (isAdminPublicRoute(pathname)) {
      // Already logged in as admin → skip the login page, go straight to dashboard
      if (isAdminAuthenticated) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }

      return NextResponse.next()
    }

    // All other /admin/** routes require an active admin session
    if (!isAdminAuthenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Inject admin token as Authorization header for admin Server Components
    const requestHeaders = new Headers(request.headers)

    requestHeaders.set('Authorization', `Bearer ${adminToken}`)

    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH PAGES  /login, /register, etc.
  // ═══════════════════════════════════════════════════════════════════════════
  if (isPublicPageRoute(pathname)) {
    // Platform-offline notice, impersonation, and maintainer job links —
    // always allow through regardless of session state. A job link must render
    // the same for signed-in and signed-out visitors alike, because whoever
    // holds the link (e.g. a maintainer with no TenantX account) is the
    // intended audience — a signed-in landlord tapping it must not be bounced
    // to /dashboard.
    if (matchesRoute(pathname, ['/auth/impersonate', '/platform-offline', '/jobs'])) {
      return NextResponse.next()
    }

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

  // 2. LANDLORD-only routes — block STAFF and other non-LANDLORD userTypes
  if (isLandlordOnlyRoute(pathname)) {
    const claims = decodeJwtPayload(authToken!)
    const userType = (claims?.userType as string) ?? ''

    if (userType !== 'LANDLORD') {
      return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url))
    }
  }

  // 3. Authenticated — inject auth headers for Server Components
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
