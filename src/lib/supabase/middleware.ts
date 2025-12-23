import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database/database.types'

/**
 * Creates a Supabase client for use in Next.js middleware.
 * Handles session refresh and cookie management.
 * 
 * @param request - NextRequest from middleware
 */
export async function createMiddlewareClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not call getSession() - use getUser() for security
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user, response: supabaseResponse }
}

/**
 * Extracts tenant ID from various sources in order of priority:
 * 1. JWT claims (from user metadata)
 * 2. X-Tenant-ID header
 * 3. Subdomain
 * 
 * @param request - NextRequest from middleware
 * @param user - Authenticated user from Supabase
 */
export function resolveTenantId(
  request: NextRequest,
  user: { user_metadata?: { tenant_id?: string } } | null
): string | null {
  // 1. Try JWT claims first (most trusted)
  if (user?.user_metadata?.tenant_id) {
    return user.user_metadata.tenant_id
  }

  // 2. Try X-Tenant-ID header (for API clients)
  const headerTenantId = request.headers.get('X-Tenant-ID')
  if (headerTenantId) {
    return headerTenantId
  }

  // 3. Try subdomain extraction
  const host = request.headers.get('host') || ''
  const subdomain = extractSubdomain(host)
  if (subdomain) {
    // TODO: Look up tenant_id from subdomain in database
    // For now, return subdomain as tenant identifier
    return subdomain
  }

  return null
}

/**
 * Extracts subdomain from host header.
 * Handles both production (acme.tenantx.com) and local (acme.localhost:3000) environments.
 */
function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostWithoutPort = host.split(':')[0]
  
  // Split by dots
  const parts = hostWithoutPort.split('.')
  
  // For localhost development (e.g., acme.localhost)
  if (parts.length === 2 && parts[1] === 'localhost') {
    return parts[0]
  }
  
  // For production (e.g., acme.tenantx.com)
  if (parts.length >= 3) {
    // Exclude 'www' as subdomain
    if (parts[0] !== 'www') {
      return parts[0]
    }
  }
  
  return null
}
