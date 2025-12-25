/**
 * GET /api/v1/auth/me - Get current user profile
 * PATCH /api/v1/auth/me - Update current user profile
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, updateUserProfile } from '@/services/auth-service'
import { successResponse } from '@/lib/api/response'
import { handleError } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth/authenticate'

/**
 * GET /api/v1/auth/me
 * Get current authenticated user's profile and tenant info.
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request and get the authenticated client + user
    const { supabase, user } = await authenticateRequest(request)
    
    const result = await getCurrentUser(supabase, user)
    
    return successResponse(result)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/v1/auth/me
 * Update current authenticated user's profile.
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate the request
    const { supabase, user } = await authenticateRequest(request)
    
    const body = await request.json()
    
    const result = await updateUserProfile(supabase, body, user)
    
    return successResponse(result, 'Profile updated successfully')
  } catch (error) {
    return handleError(error)
  }
}
