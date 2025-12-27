/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using the refresh token from cookies
 *     tags:
 *       - Auth
 *     security: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                   example: Token refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           type: string
 *                         refresh_token:
 *                           type: string
 *                         expires_at:
 *                           type: integer
 *       401:
 *         description: Invalid or expired refresh token
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
