/**
 * @swagger
 * /api/v1/properties:
 *   get:
 *     summary: List properties
 *     description: Get paginated list of properties with optional filters
 *     tags:
 *       - Properties
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [residential, commercial, mixed, house, apartment]
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of properties
 *   post:
 *     summary: Create property
 *     description: Create a new property
 *     tags:
 *       - Properties
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - type
 *               - ownership
 *               - region
 *               - district
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: object
 *               type:
 *                 type: string
 *               ownership:
 *                 type: string
 *               region:
 *                 type: string
 *               district:
 *                 type: string
 *     responses:
 *       201:
 *         description: Property created
 */

import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { authenticateApiRoute } from '@/lib/auth/authenticate'
import { handleError } from '@/lib/errors'
import { createdResponse, listResponse } from '@/lib/api/response'
import { getProperties, createProperty } from '@/services/property-service'
import { PropertyQuerySchema } from '@/lib/validation/schemas'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await authenticateApiRoute(request)
    const supabase = await createClient()

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams

    const queryValidation = PropertyQuerySchema.safeParse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      type: searchParams.get('type'),
      region: searchParams.get('region'),
      district: searchParams.get('district'),
      sort: searchParams.get('sort'),
      order: searchParams.get('order'),
    })

    // Use validated data or defaults
    const page = queryValidation.success ? queryValidation.data.page : 1
    const pageSize = queryValidation.success ? queryValidation.data.pageSize : 10
    const search = queryValidation.success ? queryValidation.data.search : undefined
    const status = queryValidation.success ? queryValidation.data.status : undefined
    const type = queryValidation.success ? queryValidation.data.type : undefined
    const region = queryValidation.success ? queryValidation.data.region : undefined
    const district = queryValidation.success ? queryValidation.data.district : undefined
    const sort = queryValidation.success ? queryValidation.data.sort : undefined
    const order = queryValidation.success ? queryValidation.data.order : 'desc'

    const result = await getProperties(supabase, tenantId, {
      page,
      pageSize,
      search,
      status,
      type,
      region,
      district,
      sort: sort ? { field: sort, order } : undefined,
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

export async function POST(request: NextRequest) {
  try {
    // Use the supabase client from auth which has tenant context set
    const { tenantId, supabase } = await authenticateApiRoute(request)

    const body = await request.json()
    const property = await createProperty(supabase, tenantId, body)

    return createdResponse(property)
  } catch (error) {
    return handleError(error)
  }
}
