import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/auth/authenticate'
import { handleError } from '@/lib/errors'
import { successResponse } from '@/lib/api/response'
import { getTenantRecordStats } from '@/services/tenant-service'

/**
 * GET /api/v1/tenants/stats
 * 
 * Get tenant record statistics.
 * 
 * Response:
 * - total: Total number of tenant records
 * - active: Number of active tenants
 * - inactive: Number of inactive tenants
 * - pending: Number of pending tenants
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const { tenantId } = await authenticateRequest(request)
    
    // Get Supabase client
    const supabase = await createClient()
    
    // Get statistics
    const stats = await getTenantRecordStats(supabase, tenantId)
    
    return successResponse(stats)
  } catch (error) {
    return handleError(error)
  }
}
