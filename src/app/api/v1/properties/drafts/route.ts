/**
 * @swagger
 * /api/v1/properties/drafts:
 *   post:
 *     summary: Save property as draft
 *     description: Save an incomplete property form as a draft
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
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Draft saved
 *   patch:
 *     summary: Update property draft
 *     description: Update an existing property draft
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
 *               - id
 *               - name
 *     responses:
 *       200:
 *         description: Draft updated
 */

import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { authenticateApiRoute } from '@/lib/auth/authenticate'
import { handleError } from '@/lib/errors'
import { successResponse, createdResponse } from '@/lib/api/response'
import { saveDraft, updateDraft } from '@/services/property-service'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await authenticateApiRoute(request)
    const supabase = await createClient()

    const body = await request.json()
    const property = await saveDraft(supabase, tenantId, body)

    return createdResponse(property)
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { tenantId } = await authenticateApiRoute(request)
    const supabase = await createClient()

    const body = await request.json()
    const { id, ...data } = body
    
    if (!id) {
      return handleError(new Error('Draft ID is required'))
    }
    
    const property = await updateDraft(supabase, tenantId, id, data)

    return successResponse(property)
  } catch (error) {
    return handleError(error)
  }
}
