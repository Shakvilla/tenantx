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
import { handleError } from '@/lib/errors'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Try to sign out, but don't fail if session is already invalid
    try {
      await logoutUser(supabase)
    } catch {
      // Session may already be invalid, continue to return success
    }
    
    return noContentResponse()
  } catch (error) {
    return handleError(error)
  }
}
