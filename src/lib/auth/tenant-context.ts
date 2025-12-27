import type { SupabaseClient } from '@supabase/supabase-js'

import { createClientWithTenantContext } from '@/lib/supabase/server'
import type { Database } from '@/types/database/database.types'

/**
 * Tenant context for database operations.
 */
export interface TenantContext {
  tenantId: string
  supabase: SupabaseClient<Database>
}

/**
 * Creates a Supabase client with tenant context set for RLS.
 * Use this for all tenant-scoped database operations.
 * 
 * @param tenantId - The tenant ID to set in the database session
 * 
 * @example
 * ```typescript
 * const { supabase, tenantId } = await createTenantContext(auth.tenantId)
 * const { data } = await supabase.from('properties').select('*')
 * // RLS will automatically filter by tenant_id
 * ```
 */
export async function createTenantContext(
  tenantId: string
): Promise<TenantContext> {
  const supabase = await createClientWithTenantContext(tenantId)
  
  return {
    tenantId,
    supabase,
  }
}

/**
 * Sets tenant context in the database session.
 * Called automatically by createClientWithTenantContext.
 * 
 * @param supabase - Supabase client
 * @param tenantId - Tenant ID to set
 */
export async function setTenantContext(
  supabase: SupabaseClient<Database>,
  tenantId: string
): Promise<void> {
  await supabase.rpc('set_tenant_context', { p_tenant_id: tenantId })
}

/**
 * Clears tenant context from the database session.
 * Use after completing tenant-scoped operations if needed.
 */
export async function clearTenantContext(
  supabase: SupabaseClient<Database>
): Promise<void> {
  await supabase.rpc('clear_tenant_context')
}
