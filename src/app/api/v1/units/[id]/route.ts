/**
 * @swagger
 * /api/v1/units/{id}:
 *   get:
 *     summary: Get unit
 *     description: Get a single unit by ID
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
 *     responses:
 *       200:
 *         description: Unit details
 *       404:
 *         description: Unit not found
 *   put:
 *     summary: Update unit
 *     description: Full update of a unit
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
 *     responses:
 *       200:
 *         description: Unit updated
 *   patch:
 *     summary: Partial update unit
 *     description: Partial update of a unit
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
 *     responses:
 *       200:
 *         description: Unit updated
 *   delete:
 *     summary: Delete unit
 *     description: Delete a unit
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
 *     responses:
 *       204:
 *         description: Unit deleted
 */

import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { authenticateApiRoute } from '@/lib/auth/authenticate'
import { handleError } from '@/lib/errors'
import { successResponse, noContentResponse } from '@/lib/api/response'
import { 
  getUnitById, 
  updateUnit, 
  patchUnit, 
  deleteUnit 
} from '@/services/unit-service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tenantId } = await authenticateApiRoute(request)
    const supabase = await createClient()
    const { id } = await params

    const unit = await getUnitById(supabase, tenantId, id)

    return successResponse(unit)
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
    const unit = await updateUnit(supabase, tenantId, id, body)

    return successResponse(unit)
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
    const unit = await patchUnit(supabase, tenantId, id, body)

    return successResponse(unit)
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tenantId } = await authenticateApiRoute(request)
    const supabase = await createClient()
    const { id } = await params

    await deleteUnit(supabase, tenantId, id)

    return noContentResponse()
  } catch (error) {
    return handleError(error)
  }
}
