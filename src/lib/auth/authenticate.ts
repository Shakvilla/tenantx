import { createClient } from '@/lib/supabase/server'
import { UnauthorizedError } from '@/lib/errors'
import type { User } from '@supabase/supabase-js'

/**
 * Authentication context returned by authenticate functions.
 */
export interface AuthContext {
  user: User
  tenantId: string
  role: string
}

/**
 * Authenticates a request using Supabase session (for Server Actions and SSR).
 * 
 * @throws UnauthorizedError if not authenticated or no tenant context
 * 
 * @example
 * ```typescript
 * export async function createTenantAction(formData: FormData) {
 *   const { user, tenantId } = await authenticateServerAction()
 *   // ... business logic
 * }
 * ```
 */
export async function authenticateServerAction(): Promise<AuthContext> {
  const supabase = await createClient()
  
  // Use getUser() instead of getSession() for security
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new UnauthorizedError('Authentication required')
  }
  
  // Extract tenant_id from user metadata
  const tenantId = user.user_metadata?.tenant_id
  if (!tenantId) {
    throw new UnauthorizedError('No tenant context found')
  }
  
  const role = user.user_metadata?.role || 'user'
  
  return { user, tenantId, role }
}

/**
 * Authenticates a request using Bearer token (for API Route Handlers).
 * 
 * @param request - The incoming request
 * @throws UnauthorizedError if token is missing, invalid, or no tenant context
 * 
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const { user, tenantId } = await authenticateRequest(request)
 *   // ... business logic
 * }
 * ```
 */
export async function authenticateRequest(request: Request): Promise<AuthContext> {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authorization header missing or invalid')
  }
  
  const token = authHeader.substring(7)
  
  const supabase = await createClient()
  
  // Verify the JWT token
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    throw UnauthorizedError.invalidToken()
  }
  
  // Try to get tenant_id from user metadata first
  let tenantId = user.user_metadata?.tenant_id
  
  // If not in metadata, check X-Tenant-ID header (for API clients)
  if (!tenantId) {
    tenantId = request.headers.get('X-Tenant-ID')
  }
  
  if (!tenantId) {
    throw new UnauthorizedError('No tenant context found')
  }
  
  const role = user.user_metadata?.role || 'user'
  
  return { user, tenantId, role }
}


/**
 * Optional authentication - returns null if not authenticated instead of throwing.
 * Useful for public endpoints that have optional auth.
 */

export async function optionalAuth(): Promise<AuthContext | null> {
  try {
    return await authenticateServerAction()
  } catch {
    return null
  }
}
