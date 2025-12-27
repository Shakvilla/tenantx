/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: User registration
 *     description: Register a new user and optionally create a new tenant (organization)
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
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "SecurePass123!"
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: "+233201234567"
 *               tenantName:
 *                 type: string
 *                 description: Name for new organization (creates new tenant)
 *                 example: "My Property Management Co"
 *               inviteCode:
 *                 type: string
 *                 description: Invite code to join existing organization
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     tenant:
 *                       type: object
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */

import type { NextRequest } from 'next/server'

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
