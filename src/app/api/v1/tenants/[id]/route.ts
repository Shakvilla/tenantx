import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { authenticateApiRoute, authenticateRequest } from '@/lib/auth/authenticate'
import { handleError } from '@/lib/errors'
import { 
  successResponse, 
  noContentResponse 
} from '@/lib/api/response'
import { 
  getTenantRecordById, 
  updateTenantRecord,
  deleteTenantRecord 
} from '@/services/tenant-service'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   get:
 *     summary: Get a tenant record
 *     description: Retrieve a single property tenant (renter) by ID
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tenant record ID
 *     responses:
 *       200:
 *         description: Tenant record found
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
 *       404:
 *         description: Tenant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate request
    const { tenantId } = await authenticateApiRoute(request)
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Await params (Next.js 15 async params)
    const { id } = await params
    
    // Get tenant record
    const record = await getTenantRecordById(supabase, tenantId, id)
    
    return successResponse(record)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   put:
 *     summary: Update a tenant record (full)
 *     description: Replace all fields of a tenant record
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tenant record ID
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
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, pending]
 *     responses:
 *       200:
 *         description: Tenant updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TenantRecord'
 *       404:
 *         description: Tenant not found
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate request (supports both cookie and Bearer token auth)
    const { tenantId } = await authenticateApiRoute(request)
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Await params
    const { id } = await params
    
    // Parse request body
    const body = await request.json()
    
    // Update tenant record
    const record = await updateTenantRecord(supabase, tenantId, id, body)
    
    return successResponse(record)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   patch:
 *     summary: Update a tenant record (partial)
 *     description: Update specific fields of a tenant record
 *     tags:
 *       - Tenants
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
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, pending]
 *     responses:
 *       200:
 *         description: Tenant updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TenantRecord'
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate request (supports both cookie and Bearer token auth)
    const { tenantId } = await authenticateApiRoute(request)
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Await params
    const { id } = await params
    
    // Parse request body
    const body = await request.json()
    
    // Update tenant record (partial)
    const record = await updateTenantRecord(supabase, tenantId, id, body)
    
    return successResponse(record)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   delete:
 *     summary: Delete a tenant record
 *     description: Permanently delete a tenant record
 *     tags:
 *       - Tenants
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Tenant deleted successfully
 *       404:
 *         description: Tenant not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate request (supports both cookie and Bearer token auth)
    const { tenantId } = await authenticateApiRoute(request)
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Await params
    const { id } = await params
    
    // Delete tenant record
    await deleteTenantRecord(supabase, tenantId, id)
    
    return noContentResponse()
  } catch (error) {
    return handleError(error)
  }
}
