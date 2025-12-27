/**
 * @swagger
 * /api/v1/properties/stats:
 *   get:
 *     summary: Get property statistics
 *     description: Get aggregated statistics for all properties
 *     tags:
 *       - Properties
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Property statistics
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
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     inactive:
 *                       type: integer
 *                     maintenance:
 *                       type: integer
 *                     totalUnits:
 *                       type: integer
 *                     occupiedUnits:
 *                       type: integer
 *                     occupancyRate:
 *                       type: integer
 */

import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { authenticateApiRoute } from '@/lib/auth/authenticate'
import { handleError } from '@/lib/errors'
import { successResponse } from '@/lib/api/response'
import { getPropertyStats } from '@/services/property-service'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await authenticateApiRoute(request)
    const supabase = await createClient()

    const stats = await getPropertyStats(supabase, tenantId)

    return successResponse(stats)
  } catch (error) {
    return handleError(error)
  }
}
