/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get the authenticated user's profile and tenant information
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [viewer, user, manager, admin, super_admin]
 *                     status:
 *                       type: string
 *                     tenant_id:
 *                       type: string
 *                       format: uuid
 *                     tenant:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         plan:
 *                           type: string
 *       401:
 *         description: Not authenticated
 *   patch:
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Updated
 *               phone:
 *                 type: string
 *                 example: "+233201234567"
 *               avatar_url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */

import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, updateUserProfile } from '@/services/auth-service'
import { successResponse } from '@/lib/api/response'
import { handleError } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth/authenticate'

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
