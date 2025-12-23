import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database/database.types'

/**
 * Creates a Supabase admin client with service role key.
 * This client bypasses RLS - use only for administrative operations.
 * 
 * @warning This client has full database access. Never expose to client-side code.
 * 
 * @example
 * ```typescript
 * const adminClient = createAdminClient()
 * // Bypass RLS for admin operations
 * const { data } = await adminClient.from('tenants').select('*')
 * ```
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Creates a Supabase admin client with tenant context for RLS.
 * Useful for batch operations that need admin access within a tenant scope.
 * 
 * @param tenantId - The tenant ID to set in the database session
 */
export async function createAdminClientWithTenantContext(tenantId: string) {
  const adminClient = createAdminClient()
  
  // Set tenant context for operations that still need tenant scoping
  await adminClient.rpc('set_tenant_context', { tenant_id: tenantId })
  
  return adminClient
}
