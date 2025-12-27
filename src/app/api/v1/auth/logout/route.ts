/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Invalidate the current session and logout
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Logout successful
 *       401:
 *         description: Not authenticated
 */

import type { NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { logoutUser } from '@/services/auth-service'
import { noContentResponse } from '@/lib/api/response'
import { handleError, UnauthorizedError } from '@/lib/errors'
import { authenticateRequest } from '@/lib/auth/authenticate'

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated first
    await authenticateRequest(request)
    
    const supabase = await createClient()
    
    await logoutUser(supabase)
    
    return noContentResponse()
  } catch (error) {
    return handleError(error)
  }
}
