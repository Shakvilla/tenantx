import type { NextRequest } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { successResponse } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  
  if (!userId) {
    return Response.json({ error: 'userId required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  
  console.log(`[DEBUG_API] Checking user: ${userId}`)
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
    
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
  
  return successResponse({
    userId,
    publicUser: user,
    publicError: userError,
    authUser: authUser?.user,
    authError: authError?.message
  })
}
