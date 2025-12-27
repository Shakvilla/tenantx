/**
 * @swagger
 * /api/v1/properties/{id}/units:
 *   get:
 *     summary: List units for property
 *     description: Get all units belonging to a property
 *     tags:
 *       - Units
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Property ID
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
 *     responses:
 *       200:
 *         description: List of units
 *   post:
 *     summary: Create unit
 *     description: Create a new unit for a property
 *     tags:
 *       - Units
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - unitNo
 *               - type
 *               - rent
 *             properties:
 *               unitNo:
 *                 type: string
 *               type:
 *                 type: string
 *               rent:
 *                 type: number
 *     responses:
 *       201:
 *         description: Unit created
 */

import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { authenticateApiRoute } from '@/lib/auth/authenticate'
import { handleError } from '@/lib/errors'
import { createdResponse, listResponse } from '@/lib/api/response'
import { getUnitsByProperty, createUnit } from '@/services/unit-service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tenantId } = await authenticateApiRoute(request)
    const supabase = await createClient()
    const { id: propertyId } = await params

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), 100)

    const result = await getUnitsByProperty(supabase, tenantId, propertyId, {
      page,
      pageSize,
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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tenantId } = await authenticateApiRoute(request)
    const supabase = await createClient()
    const { id: propertyId } = await params

    const body = await request.json()
    const unit = await createUnit(supabase, tenantId, propertyId, body)

    return createdResponse(unit)
  } catch (error) {
    return handleError(error)
  }
}
