import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { authenticateApiRoute, authenticateRequest } from '@/lib/auth/authenticate'
import { handleError } from '@/lib/errors'
import { 
  successResponse, 
  listResponse, 
  createdResponse 
} from '@/lib/api/response'
import { parseQueryOptions } from '@/lib/api/pagination'
import { 
  getTenantRecords, 
  createTenantRecord 
} from '@/services/tenant-service'

/**
 * @swagger
 * /api/v1/tenants:
 *   get:
 *     summary: List all tenant records
 *     description: Get a paginated list of property tenants (renters) with optional filtering and search
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending]
 *         description: Filter by status
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by property
 *     responses:
 *       200:
 *         description: List of tenant records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TenantRecord'
 *                 meta:
 *                   $ref: '#/components/schemas/Pagination'
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
    
    // Parse query options
    const options = parseQueryOptions(
      request.nextUrl.searchParams,
      ['status', 'propertyId']
    )
    
    // Get tenant records
    const result = await getTenantRecords(supabase, tenantId, options)
    
    // Return paginated response
    return listResponse(result.data, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * @swagger
 * /api/v1/tenants:
 *   post:
 *     summary: Create a new tenant record
 *     description: Create a new property tenant (renter) record
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 example: "+233201234567"
 *               status:
 *                 type: string
 *                 enum: [active, inactive, pending]
 *                 default: pending
 *               propertyId:
 *                 type: string
 *                 format: uuid
 *               unitId:
 *                 type: string
 *                 format: uuid
 *               unitNo:
 *                 type: string
 *                 example: A101
 *               moveInDate:
 *                 type: string
 *                 format: date-time
 *               moveOutDate:
 *                 type: string
 *                 format: date-time
 *               emergencyContact:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   relationship:
 *                     type: string
 *     responses:
 *       201:
 *         description: Tenant record created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TenantRecord'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate request (supports both cookie and Bearer token auth)
    const { tenantId } = await authenticateApiRoute(request)
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Parse request body
    const body = await request.json()
    
    // Create tenant record (validation happens in service)
    const record = await createTenantRecord(supabase, tenantId, body)
    
    // Return created response
    return createdResponse(record)
  } catch (error) {
    return handleError(error)
  }
}
