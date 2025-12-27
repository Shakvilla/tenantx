import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database/database.types'

/**
 * Tenant history event types.
 */
export type TenantHistoryEventType =
  | 'move_in'
  | 'move_out'
  | 'status_change'
  | 'property_change'
  | 'unit_change'
  | 'payment'
  | 'agreement_signed'
  | 'agreement_renewed'
  | 'agreement_terminated'
  | 'note_added'
  | 'document_uploaded'
  | 'other'

/**
 * Tenant history record type.
 */
export interface TenantHistory {
  id: string
  tenant_id: string
  tenant_record_id: string
  event_type: TenantHistoryEventType
  event_date: string
  property_id: string | null
  unit_id: string | null
  agreement_id: string | null
  invoice_id: string | null
  details: Record<string, unknown>
  created_by: string | null
  notes: string | null
  created_at: string
}

/**
 * Tenant history insert type.
 */
export interface TenantHistoryInsert {
  tenant_id: string
  tenant_record_id: string
  event_type: TenantHistoryEventType
  event_date?: string
  property_id?: string | null
  unit_id?: string | null
  agreement_id?: string | null
  invoice_id?: string | null
  details?: Record<string, unknown>
  created_by?: string | null
  notes?: string | null
}

/**
 * Query options for tenant history.
 */
interface HistoryQueryOptions {
  page?: number
  pageSize?: number
  eventType?: TenantHistoryEventType
  startDate?: string
  endDate?: string
  sort?: string
  order?: 'asc' | 'desc'
}

/**
 * Paginated result for tenant history.
 */
interface PaginatedHistoryResult {
  data: TenantHistory[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/**
 * Repository for tenant_history table.
 * Handles history tracking for property tenants (renters).
 * 
 * Note: Uses explicit typing since tenant_history table may not be in 
 * generated types until migration is run and types are regenerated.
 */
class TenantHistoryRepositoryClass {
  private readonly tableName = 'tenant_history'

  /**
   * Get history for a specific tenant record with pagination.
   */
  async findByTenantRecord(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    tenantRecordId: string,
    options?: HistoryQueryOptions
  ): Promise<PaginatedHistoryResult> {
    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 20
    const offset = (page - 1) * pageSize

    // Get total count - use 'any' since table may not be in generated types yet
    const { count, error: countError } = await (supabase as any)
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('tenant_record_id', tenantRecordId)

    if (countError) {
      throw countError
    }

    // Build query
    let query = (supabase as any)
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('tenant_record_id', tenantRecordId)

    // Apply event_type filter if provided
    if (options?.eventType) {
      query = query.eq('event_type', options.eventType)
    }

    // Apply date range filter if provided
    if (options?.startDate) {
      query = query.gte('event_date', options.startDate)
    }
    if (options?.endDate) {
      query = query.lte('event_date', options.endDate)
    }

    // Apply sorting (default: event_date DESC)
    const sortField = options?.sort ?? 'event_date'
    const sortOrder = options?.order === 'asc'
    query = query.order(sortField, { ascending: sortOrder })

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1)

    const { data, error } = await query

    if (error) {
      throw error
    }

    const total = count ?? 0

    return {
      data: (data ?? []) as TenantHistory[],
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  /**
   * Create a new history entry.
   */
  async create(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    data: Omit<TenantHistoryInsert, 'tenant_id'>
  ): Promise<TenantHistory> {
    const { data: result, error } = await (supabase as any)
      .from(this.tableName)
      .insert({
        tenant_id: tenantId,
        ...data,
        details: data.details ?? {},
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return result as TenantHistory
  }

  /**
   * Get recent history entries across all tenant records (for dashboard).
   */
  async getRecentActivity(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    limit: number = 10
  ): Promise<TenantHistory[]> {
    const { data, error } = await (supabase as any)
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('event_date', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return (data ?? []) as TenantHistory[]
  }

  /**
   * Get history by event type (for reporting).
   */
  async findByEventType(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    eventType: TenantHistoryEventType,
    options?: { startDate?: string; endDate?: string; limit?: number }
  ): Promise<TenantHistory[]> {
    let query = (supabase as any)
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('event_type', eventType)

    if (options?.startDate) {
      query = query.gte('event_date', options.startDate)
    }
    if (options?.endDate) {
      query = query.lte('event_date', options.endDate)
    }

    query = query.order('event_date', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return (data ?? []) as TenantHistory[]
  }
}

/**
 * Singleton instance of TenantHistoryRepository.
 */
export const tenantHistoryRepository = new TenantHistoryRepositoryClass()
