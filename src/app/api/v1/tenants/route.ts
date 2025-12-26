import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/auth/authenticate'
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
 * GET /api/v1/tenants
 * 
 * List all tenant records with pagination, filtering, and search.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 10, max: 100)
 * - search: Search by name or email
 * - status: Filter by status (active, inactive, pending)
 * - propertyId: Filter by property
 * - sort: Sort field (default: created_at)
 * - order: Sort order (asc, desc - default: desc)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const { tenantId } = await authenticateRequest(request)
    
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
 * POST /api/v1/tenants
 * 
 * Create a new tenant record.
 * 
 * Request Body:
 * - firstName: string (required)
 * - lastName: string (required)
 * - email: string (required)
 * - phone: string (required)
 * - status: 'active' | 'inactive' | 'pending' (optional, default: 'pending')
 * - propertyId: string (optional)
 * - unitId: string (optional)
 * - unitNo: string (optional)
 * - moveInDate: string (optional)
 * - moveOutDate: string (optional)
 * - emergencyContact: { name, phone, relationship } (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const { tenantId } = await authenticateRequest(request)
    
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
