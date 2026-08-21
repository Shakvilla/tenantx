import { type NextRequest, NextResponse } from 'next/server'

/**
 * ── Security headers ──────────────────────────────────────────────────────
 *
 * The app served no security headers at all: no CSP, no HSTS, no framing or
 * MIME-sniffing protection. That matters more here than in most apps because
 * the access and refresh tokens live in localStorage, which script running on
 * the page can read — so a single injected script is a full account takeover,
 * with seven days of persistence from the refresh token. Storage is the deeper
 * issue and is not fixed here; a CSP is what stands between an injection and
 * that storage in the meantime.
 *
 * The policy is nonce-based rather than `'unsafe-inline'`. Next injects inline
 * hydration scripts, so a policy permissive enough to allow those by keyword
 * would allow an attacker's inline script equally, which is a header that looks
 * like protection and is not. Next stamps its own scripts with the nonce it
 * reads from the request's CSP header, so that header is set on the request as
 * well as the response.
 *
 * Trade-off accepted: emitting a per-request nonce opts routes out of static
 * rendering. Nearly every route here is behind auth and already dynamic.
 */
function buildCsp(nonce: string, isHttps: boolean): string {
  const isProd = process.env.NODE_ENV === 'production'

  // Where the browser is allowed to send requests: our own API, and ImageKit,
  // which the browser uploads to directly and reads signed document links from.
  const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_BASE_URL)
  const imageKitOrigin = originOf(process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT)

  const connect = ["'self'", apiOrigin, imageKitOrigin, 'https://upload.imagekit.io']
    .filter(Boolean)
    .join(' ')

  const img = ["'self'", 'data:', 'blob:', imageKitOrigin, 'https://images.unsplash.com']
    .filter(Boolean)
    .join(' ')

  return [
    "default-src 'self'",

    // 'strict-dynamic' lets Next's nonced bootstrap load the chunks it needs
    // without every chunk URL being listed. The bare `https:` after it is
    // ignored by browsers that understand 'strict-dynamic' and acts as the
    // fallback for those that don't. 'unsafe-eval' is dev-only — React Refresh
    // needs it and production does not.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:${isProd ? '' : " 'unsafe-eval'"}`,

    // Emotion (MUI) inserts style elements at runtime that a nonce cannot cover.
    // Style injection is a far weaker primitive than script injection.
    "style-src 'self' 'unsafe-inline'",

    `img-src ${img}`,
    "font-src 'self' data:",
    `connect-src ${connect}`,

    // Clickjacking: frame-ancestors is the modern control; X-Frame-Options below
    // covers browsers that still only honour that.
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Keyed on the scheme actually in use, NOT on NODE_ENV. A production *build*
    // is not the same as being *served over TLS*: gating this on NODE_ENV sent
    // upgrade-insecure-requests to the plain-HTTP Docker stack, which rewrote every
    // request to https:// against a server with no TLS and took the whole app down
    // with ERR_SSL_PROTOCOL_ERROR. Behind Coolify the proxy sets x-forwarded-proto,
    // so this switches itself on there and stays off locally.
    ...(isHttps ? ['upgrade-insecure-requests'] : []),
  ].join('; ')
}

/** Whether the browser reached us over TLS, accounting for a terminating proxy. */
function isHttpsRequest(request: NextRequest): boolean {
  const forwardedProto = request.headers.get('x-forwarded-proto')

  if (forwardedProto) {
    return forwardedProto.split(',')[0].trim() === 'https'
  }

  return request.nextUrl.protocol === 'https:'
}

/** The scheme+host of a configured URL, or '' when unset or unparseable. */
function originOf(url: string | undefined): string {
  if (!url) return ''

  try {
    return new URL(url).origin
  } catch {
    return ''
  }
}

function generateNonce(): string {
  return btoa(crypto.randomUUID())
}

function applySecurityHeaders(response: NextResponse, csp: string, isHttps: boolean): NextResponse {
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()')

  // RFC 6797: a user agent must ignore this over a non-secure transport, so it is
  // only sent where it means something.
  if (isHttps) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

/**
 * `NextResponse.next()` carrying the nonce and CSP on the *request* — that is
 * where Next looks when deciding what nonce to stamp on its own script tags.
 */
function nextWithHeaders(
  request: NextRequest,
  nonce: string,
  csp: string,
  extra?: Record<string, string>
): NextResponse {
  const headers = new Headers(request.headers)

  headers.set('x-nonce', nonce)
  headers.set('Content-Security-Policy', csp)

  for (const [key, value] of Object.entries(extra ?? {})) {
    headers.set(key, value)
  }

  return NextResponse.next({ request: { headers } })
}

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

// AUTH-L7-05: when the deployment provides the backend's JWT secret (JWT_SECRET env var, server
// side only — middleware runs on the Next server, never in the browser), role-gate claims are
// VERIFIED with jose rather than merely decoded, so a STAFF user editing their own cookie can no
// longer reach landlord-only pages. Without the env var the previous decode-only behavior stands
// (UI gate only; data stays server-gated by the backend).
const rawJwtSecret = process.env.JWT_SECRET

const encodedJwtSecret = rawJwtSecret && rawJwtSecret.length > 0 ? new TextEncoder().encode(rawJwtSecret) : null

/**
 * Returns the token's claims for routing decisions. Signature-verified when JWT_SECRET is
 * configured (null on any verification failure); decode-only otherwise.
 */
async function jwtClaimsForRouting(token: string): Promise<Record<string, unknown> | null> {
  if (encodedJwtSecret) {
    try {
      const { jwtVerify } = await import('jose')
      const { payload } = await jwtVerify(token, encodedJwtSecret)

      return payload as Record<string, unknown>
    } catch {
      return null
    }
  }

  return decodeJwtPayload(token)
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
  const nonce = generateNonce()
  const isHttps = isHttpsRequest(request)
  const csp = buildCsp(nonce, isHttps)

  const response = await handleRouting(request, nonce, csp)

  return applySecurityHeaders(response, csp, isHttps)
}

async function handleRouting(request: NextRequest, nonce: string, csp: string) {
  const { pathname } = request.nextUrl

  // ── Vacancy listing pages are always public ──────────────────────────────
  if (isPublicVacancyRoute(pathname)) {
    return nextWithHeaders(request, nonce, csp)
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

      return nextWithHeaders(request, nonce, csp)
    }

    // All other /admin/** routes require an active admin session
    if (!isAdminAuthenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Inject admin token as Authorization header for admin Server Components
    return nextWithHeaders(request, nonce, csp, { Authorization: `Bearer ${adminToken}` })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH PAGES  /login, /register, etc.
  // ═══════════════════════════════════════════════════════════════════════════
  if (isPublicPageRoute(pathname)) {
    // Platform-offline notice, impersonation, and maintainer job links —
    // always allow through regardless of session state. A job link must render
    // the same for signed-in and signed-out visitors alike, because whoever
    // holds the link (e.g. a maintainer with no Yiliora account) is the
    // intended audience — a signed-in landlord tapping it must not be bounced
    // to /dashboard.
    if (matchesRoute(pathname, ['/auth/impersonate', '/platform-offline', '/jobs'])) {
      return nextWithHeaders(request, nonce, csp)
    }

    // Already logged in as admin → go to admin dashboard
    if (isAdminAuthenticated) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // Already logged in as tenant → go to tenant dashboard
    if (isTenantAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return nextWithHeaders(request, nonce, csp)
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

  // 2. LANDLORD-only routes — block STAFF and other non-LANDLORD userTypes.
  // AUTH-L7-05: claims are signature-verified when JWT_SECRET is configured; a token that fails
  // verification is treated as no session at all, not merely as non-LANDLORD.
  if (isLandlordOnlyRoute(pathname)) {
    const claims = await jwtClaimsForRouting(authToken!)

    if (claims === null && encodedJwtSecret) {
      const redirectUrl = new URL('/login', request.url)

      redirectUrl.searchParams.set('redirectTo', pathname)

      return NextResponse.redirect(redirectUrl)
    }

    const userType = (claims?.userType as string) ?? ''

    if (userType !== 'LANDLORD') {
      return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url))
    }
  }

  // 3. Authenticated — inject auth headers for Server Components
  return nextWithHeaders(request, nonce, csp, {
    Authorization: `Bearer ${authToken}`,
    'X-Tenant-ID': tenantId!,
  })
}

// Match all routes except API, static files, and Next.js internals
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
