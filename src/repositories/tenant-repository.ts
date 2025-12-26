import type { SupabaseClient } from '@supabase/supabase-js'

import { BaseRepository } from './base-repository'
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/types/database/database.types'

/**
 * Tenant record type from database.
 */
export type TenantRecord = Tables<'tenant_records'>
export type TenantRecordInsert = TablesInsert<'tenant_records'>
export type TenantRecordUpdate = TablesUpdate<'tenant_records'>

/**
 * Repository for tenant_records table.
 * Handles CRUD operations for property tenants (not platform tenants).
 */
class TenantRecordRepositoryClass extends BaseRepository<
  TenantRecord,
  TenantRecordInsert,
  TenantRecordUpdate
> {
  protected readonly tableName = 'tenant_records' as const
  protected readonly resourceName = 'Tenant'

  /**
   * Apply search to name and email fields.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected applySearch(query: any, search: string): any {
    // Use OR filter for name and email search
    return query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
    )
  }

  /**
   * Find tenant records by property.
   */
  async findByProperty(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    propertyId: string
  ): Promise<TenantRecord[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  }

  /**
   * Find tenant records by unit.
   */
  async findByUnit(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    unitId: string
  ): Promise<TenantRecord | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('unit_id', unitId)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }

      throw error
    }

    return data
  }

  /**
   * Find tenant record by email.
   */
  async findByEmail(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    email: string
  ): Promise<TenantRecord | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }

      throw error
    }

    return data
  }

  /**
   * Get tenant statistics.
   */
  async getStats(
    supabase: SupabaseClient<Database>,
    tenantId: string
  ): Promise<{
    total: number
    active: number
    inactive: number
    pending: number
  }> {
    const [total, active, inactive, pending] = await Promise.all([
      this.count(supabase, tenantId),
      this.count(supabase, tenantId, { status: 'active' }),
      this.count(supabase, tenantId, { status: 'inactive' }),
      this.count(supabase, tenantId, { status: 'pending' }),
    ])

    return { total, active, inactive, pending }
  }
}

/**
 * Singleton instance of TenantRecordRepository.
 */
export const tenantRecordRepository = new TenantRecordRepositoryClass()
