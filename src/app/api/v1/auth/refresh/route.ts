/**
 * POST /api/v1/auth/refresh
 * 
 * Refresh access token using refresh token.
 */

import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { refreshToken } from '@/services/auth-service'
import { successResponse } from '@/lib/api/response'
import { handleError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const result = await refreshToken(supabase)
    
    return successResponse(result, 'Token refreshed successfully')
  } catch (error) {
    return handleError(error)
  }
}
