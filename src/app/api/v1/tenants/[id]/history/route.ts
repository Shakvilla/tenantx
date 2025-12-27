import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/auth/authenticate'
import { handleError } from '@/lib/errors'
import { listResponse } from '@/lib/api/response'
import { getTenantRecordHistory } from '@/services/tenant-service'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/v1/tenants/{id}/history:
 *   get:
 *     summary: Get tenant history
 *     description: Get paginated history of events for a specific tenant record
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
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *           enum: [move_in, move_out, status_change, property_change, unit_change, payment, agreement_signed, agreement_renewed, agreement_terminated, note_added, document_uploaded, other]
 *         description: Filter by event type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events before this date
 *     responses:
 *       200:
 *         description: List of history events
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
 *                     $ref: '#/components/schemas/TenantHistory'
 *                 meta:
 *                   $ref: '#/components/schemas/Pagination'
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
    const { tenantId } = await authenticateRequest(request)
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Await params (Next.js 15 async params)
    const { id } = await params
    
    // Parse query options
    const searchParams = request.nextUrl.searchParams
    const options = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: Math.min(parseInt(searchParams.get('pageSize') || '20'), 100),
      eventType: searchParams.get('eventType') as any,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    }
    
    // Get tenant record history
    const result = await getTenantRecordHistory(supabase, tenantId, id, options)
    
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
