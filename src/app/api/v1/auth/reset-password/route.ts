/**
 * POST /api/v1/auth/reset-password
 * 
 * Reset password using reset token.
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resetPassword } from '@/services/auth-service'
import { successResponse } from '@/lib/api/response'
import { handleError, ValidationError } from '@/lib/errors'
import { ResetPasswordSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = ResetPasswordSchema.safeParse(body)
    if (!validation.success) {
      throw ValidationError.fromZodError(validation.error)
    }
    
    const { token, password } = validation.data
    
    const supabase = await createClient()
    
    await resetPassword(supabase, token, password)
    
    return successResponse(
      { message: 'Password has been reset successfully.' },
      'Password reset successful'
    )
  } catch (error) {
    return handleError(error)
  }
}
