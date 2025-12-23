import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database/database.types'

/**
 * Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * This client respects RLS policies and uses the user's session.
 * 
 * @example
 * ```typescript
 * const supabase = await createClient()
 * const { data, error } = await supabase.from('properties').select('*')
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase client for Route Handlers with tenant context.
 * Sets the tenant_id in the database session for RLS policies.
 * 
 * @param tenantId - The tenant ID to set in the database session
 */
export async function createClientWithTenantContext(tenantId: string) {
  const supabase = await createClient()
  
  // Set tenant context for RLS policies
  await supabase.rpc('set_tenant_context', { tenant_id: tenantId })
  
  return supabase
}
