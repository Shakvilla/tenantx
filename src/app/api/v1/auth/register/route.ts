/**
 * POST /api/v1/auth/register
 * 
 * Register a new user and optionally create a new tenant.
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { registerUser } from '@/services/auth-service'
import { successResponse, createdResponse } from '@/lib/api/response'
import { handleError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use admin client for registration (bypasses RLS for initial setup)
    const supabase = createAdminClient()
    
    const result = await registerUser(supabase, body)
    
    return createdResponse(result)
  } catch (error) {
    return handleError(error)
  }
}
