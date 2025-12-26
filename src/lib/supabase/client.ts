import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/database/database.types'

/**
 * Creates a Supabase client for use in browser/client components.
 * This client uses the anon key and respects RLS policies.
 * 
 * @example
 * ```typescript
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 * 
 * const supabase = createClient()
 * const { data } = await supabase.from('properties').select('*')
 * ```
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
