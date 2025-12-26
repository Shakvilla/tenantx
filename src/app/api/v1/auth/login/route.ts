/**
 * POST /api/v1/auth/login
 * 
 * Login with email and password.
 */

import type { NextRequest } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { loginUser } from '@/services/auth-service'
import { successResponse } from '@/lib/api/response'
import { handleError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const supabase = createAdminClient()
    
    const result = await loginUser(supabase, body)
    
    return successResponse(result, 'Login successful')
  } catch (error) {
    return handleError(error)
  }
}
