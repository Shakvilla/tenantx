/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send a password reset email to the specified address
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
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Request processed (always returns success to prevent enumeration)
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
 *                   example: Password reset email sent
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *       400:
 *         description: Validation error
 */

import type { NextRequest } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { forgotPassword } from '@/services/auth-service'
import { successResponse } from '@/lib/api/response'
import { handleError, ValidationError } from '@/lib/errors'
import { ForgotPasswordSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = ForgotPasswordSchema.safeParse(body)

    if (!validation.success) {
      throw ValidationError.fromZodError(validation.error)
    }
    
    const supabase = createAdminClient()
    
    await forgotPassword(supabase, validation.data.email)
    
    // Always return success to prevent email enumeration
    return successResponse(
      { message: 'If an account exists with this email, a password reset link has been sent.' },
      'Password reset email sent'
    )
  } catch (error) {
    // Don't reveal if email exists or not - always return success
    if (error instanceof ValidationError) {
      return handleError(error)
    }
    
    // Log the error but return success to prevent enumeration
    console.error('Forgot password error:', error)
    
    return successResponse(
      { message: 'If an account exists with this email, a password reset link has been sent.' },
      'Password reset email sent'
    )
  }
}
