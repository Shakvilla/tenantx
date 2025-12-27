/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Set a new password using the reset token from email
 *     tags:
 *       - Auth
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token from email link
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "NewSecurePass123!"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset successful
 *       400:
 *         description: Validation error or invalid token
 */

import type { NextRequest } from 'next/server'

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
