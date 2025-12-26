import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { User, SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'
import { UnauthorizedError } from '@/lib/errors'
import type { Database } from '@/types/database/database.types'

/**
 * Authentication context returned by authenticate functions.
 */
export interface AuthContext {
  user: User
  tenantId: string
  role: string
  supabase: SupabaseClient<Database>
}

/**
 * Authenticates a request using Supabase session (for Server Actions and SSR).
 * 
 * @throws UnauthorizedError if not authenticated or no tenant context
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
  
  // Set tenant context for RLS policies
  await supabase.rpc('set_tenant_context', { tenant_id: tenantId })
  
  return { user, tenantId, role, supabase }
}

/**
 * Authenticates a request using Bearer token (for API Route Handlers).
 * 
 * Creates a Supabase client that includes the Bearer token in all requests,
 * enabling RLS policies that use auth.uid() to work correctly.
 * 
 * @param request - The incoming request
 * @throws UnauthorizedError if token is missing, invalid, or no tenant context
 */
export async function authenticateRequest(request: Request): Promise<AuthContext> {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authorization header missing or invalid')
  }
  
  const token = authHeader.substring(7)
  
  // Create a client that includes the Bearer token in the Authorization header
  // This ensures auth.uid() works in RLS policies for database queries
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  )
  
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
  
  // Set tenant context for RLS policies (for policies using get_current_tenant_id())
  const { error: rpcError } = await supabase.rpc('set_tenant_context', { tenant_id: tenantId })
  
  if (rpcError) {
    console.error('[authenticateRequest] Failed to set DB tenant context:', rpcError)
  }
  
  return { user, tenantId, role, supabase }
}

/**
 * Optional authentication - returns null if not authenticated instead of throwing.
 */
export async function optionalAuth(): Promise<AuthContext | null> {
  try {
    return await authenticateServerAction()
  } catch {
    return null
  }
}
