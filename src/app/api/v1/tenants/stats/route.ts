import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { authenticateApiRoute, authenticateRequest } from '@/lib/auth/authenticate'
import { handleError } from '@/lib/errors'
import { successResponse } from '@/lib/api/response'
import { getTenantRecordStats } from '@/services/tenant-service'

/**
 * @swagger
 * /api/v1/tenants/stats:
 *   get:
 *     summary: Get tenant statistics
 *     description: Get aggregated statistics for all tenant records
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenant statistics
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
 *                     total:
 *                       type: integer
 *                       example: 50
 *                       description: Total number of tenant records
 *                     active:
 *                       type: integer
 *                       example: 35
 *                       description: Number of active tenants
 *                     inactive:
 *                       type: integer
 *                       example: 5
 *                       description: Number of inactive tenants
 *                     pending:
 *                       type: integer
 *                       example: 10
 *                       description: Number of pending tenants
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const { tenantId } = await authenticateApiRoute(request)
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Get statistics
    const stats = await getTenantRecordStats(supabase, tenantId)
    
    return successResponse(stats)
  } catch (error) {
    return handleError(error)
  }
}
