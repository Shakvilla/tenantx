import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/auth/authenticate'
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
 * GET /api/v1/tenants/:id
 * 
 * Get a single tenant record by ID.
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
    
    // Get tenant record
    const record = await getTenantRecordById(supabase, tenantId, id)
    
    return successResponse(record)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PUT /api/v1/tenants/:id
 * 
 * Update a tenant record (full update).
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate request
    const { tenantId } = await authenticateRequest(request)
    
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
 * PATCH /api/v1/tenants/:id
 * 
 * Partial update a tenant record.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate request
    const { tenantId } = await authenticateRequest(request)
    
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
 * DELETE /api/v1/tenants/:id
 * 
 * Delete a tenant record.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Authenticate request
    const { tenantId } = await authenticateRequest(request)
    
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
