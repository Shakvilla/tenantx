/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate with email and password to obtain a JWT token
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
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *                     session:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           type: string
 *                         refresh_token:
 *                           type: string
 *                         expires_at:
 *                           type: integer
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */

import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { loginUser } from '@/services/auth-service'
import { successResponse } from '@/lib/api/response'
import { handleError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use the SSR server client which handles cookies automatically
    // This ensures the session is stored in cookies for subsequent requests
    const supabase = await createClient()
    
    const result = await loginUser(supabase, body)
    
    return successResponse(result, 'Login successful')
  } catch (error) {
    return handleError(error)
  }
}

