/**
 * @swagger
 * /api/v1/properties/{id}:
 *   get:
 *     summary: Get property
 *     description: Get a single property by ID
 *     tags:
 *       - Properties
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
 *       200:
 *         description: Property details
 *       404:
 *         description: Property not found
 *   put:
 *     summary: Update property
 *     description: Full update of a property
 *     tags:
 *       - Properties
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
 *     responses:
 *       200:
 *         description: Property updated
 *   patch:
 *     summary: Partial update property
 *     description: Partial update of a property
 *     tags:
 *       - Properties
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
 *     responses:
 *       200:
 *         description: Property updated
 *   delete:
 *     summary: Delete property
 *     description: Delete a property
 *     tags:
 *       - Properties
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
 *         description: Property deleted
 */

import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { authenticateApiRoute } from '@/lib/auth/authenticate'
import { handleError } from '@/lib/errors'
import { successResponse, noContentResponse } from '@/lib/api/response'
import { 
  getPropertyById, 
  updateProperty, 
  patchProperty, 
  deleteProperty 
} from '@/services/property-service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tenantId } = await authenticateApiRoute(request)
    const supabase = await createClient()
    const { id } = await params

    const property = await getPropertyById(supabase, tenantId, id)

    return successResponse(property)
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { tenantId } = await authenticateApiRoute(request)
    const supabase = await createClient()
    const { id } = await params

    const body = await request.json()
    const property = await updateProperty(supabase, tenantId, id, body)

    return successResponse(property)
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tenantId } = await authenticateApiRoute(request)
    const supabase = await createClient()
    const { id } = await params

    const body = await request.json()
    const property = await patchProperty(supabase, tenantId, id, body)

    return successResponse(property)
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tenantId } = await authenticateApiRoute(request)
    const supabase = await createClient()
    const { id } = await params

    await deleteProperty(supabase, tenantId, id)

    return noContentResponse()
  } catch (error) {
    return handleError(error)
  }
}
