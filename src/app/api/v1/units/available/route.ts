/**
 * @swagger
 * /api/v1/units/available:
 *   get:
 *     summary: List available units
 *     description: Get all available units across all properties
 *     tags:
 *       - Units
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by property
 *       - in: query
 *         name: minRent
 *         schema:
 *           type: number
 *         description: Minimum rent filter
 *       - in: query
 *         name: maxRent
 *         schema:
 *           type: number
 *         description: Maximum rent filter
 *     responses:
 *       200:
 *         description: List of available units
 */

import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { authenticateApiRoute } from '@/lib/auth/authenticate'
import { handleError } from '@/lib/errors'
import { listResponse } from '@/lib/api/response'
import { getAvailableUnits } from '@/services/unit-service'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await authenticateApiRoute(request)
    const supabase = await createClient()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), 100)
    const propertyId = searchParams.get('propertyId') || undefined
    const minRent = searchParams.get('minRent') 
      ? parseFloat(searchParams.get('minRent')!) 
      : undefined
    const maxRent = searchParams.get('maxRent') 
      ? parseFloat(searchParams.get('maxRent')!) 
      : undefined

    const result = await getAvailableUnits(supabase, tenantId, {
      page,
      pageSize,
      propertyId,
      minRent,
      maxRent,
    })

    return listResponse(result.data, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    })
  } catch (error) {
    return handleError(error)
  }
}
