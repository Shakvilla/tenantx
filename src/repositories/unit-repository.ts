import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, Tables, TablesInsert, TablesUpdate } from '@/types/database/database.types'
import type { QueryOptions, PaginatedResult } from '@/types/api/response.types'
import { BaseRepository } from './base-repository'
import { calculateRange } from '@/lib/api/pagination'

/**
 * Unit type from database.
 */
export type Unit = Tables<'units'>
export type UnitInsert = TablesInsert<'units'>
export type UnitUpdate = TablesUpdate<'units'>

/**
 * Unit with property info.
 */
export interface UnitWithProperty extends Unit {
  property?: {
    id: string
    name: string
  }
}

/**
 * Unit repository for database operations.
 */
class UnitRepositoryClass extends BaseRepository<Unit, UnitInsert, UnitUpdate> {
  protected readonly tableName = 'units' as const
  protected readonly resourceName = 'Unit'

  /**
   * Apply search filter for units.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected applySearch(query: any, search: string): any {
    return query.ilike('unit_no', `%${search}%`)
  }

  /**
   * Find units by property ID.
   */
  async findByProperty(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    propertyId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<Unit>> {
    const { page = 1, pageSize = 10, sort } = options
    const { from, to } = calculateRange(page, pageSize)

    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId)

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.order === 'asc' })
    } else {
      query = query.order('unit_no', { ascending: true })
    }

    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return {
      data: (data || []) as Unit[],
      total: count || 0,
      page,
      pageSize,
    }
  }

  /**
   * Find all units across all properties (no status filter).
   */
  async findAllWithProperty(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    options: QueryOptions & { propertyId?: string; status?: string; minRent?: number; maxRent?: number } = {}
  ): Promise<PaginatedResult<UnitWithProperty>> {
    const { page = 1, pageSize = 10, propertyId, status, minRent, maxRent } = options
    const { from, to } = calculateRange(page, pageSize)

    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        property:properties!inner(id, name)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId)

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    // Only filter by status if explicitly provided
    if (status) {
      query = query.eq('status', status)
    }

    if (minRent !== undefined) {
      query = query.gte('rent', minRent)
    }

    if (maxRent !== undefined) {
      query = query.lte('rent', maxRent)
    }

    query = query.order('unit_no', { ascending: true }).range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return {
      data: (data || []) as UnitWithProperty[],
      total: count || 0,
      page,
      pageSize,
    }
  }

  /**
   * Find available units across all properties (status = 'available' only).
   */
  async findAvailable(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    options: QueryOptions & { propertyId?: string; minRent?: number; maxRent?: number } = {}
  ): Promise<PaginatedResult<UnitWithProperty>> {
    const { page = 1, pageSize = 10, propertyId, minRent, maxRent } = options
    const { from, to } = calculateRange(page, pageSize)

    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        property:properties!inner(id, name)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('status', 'available')

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    if (minRent !== undefined) {
      query = query.gte('rent', minRent)
    }

    if (maxRent !== undefined) {
      query = query.lte('rent', maxRent)
    }

    query = query.order('rent', { ascending: true }).range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return {
      data: (data || []) as UnitWithProperty[],
      total: count || 0,
      page,
      pageSize,
    }
  }

  /**
   * Create unit with property_id.
   */
  async createForProperty(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    propertyId: string,
    data: Omit<UnitInsert, 'tenant_id' | 'property_id'>
  ): Promise<Unit> {
    const { data: unit, error } = await supabase
      .from(this.tableName)
      .insert({
        ...data,
        tenant_id: tenantId,
        property_id: propertyId,
      } as never)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return unit as Unit
  }

  /**
   * Check if unit number exists in property.
   */
  async existsByUnitNo(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    propertyId: string,
    unitNo: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId)
      .ilike('unit_no', unitNo)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { count, error } = await query

    if (error) {
      throw error
    }

    return (count || 0) > 0
  }

  /**
   * Assign tenant to unit.
   */
  async assignTenant(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    unitId: string,
    tenantRecordId: string
  ): Promise<Unit> {
    return this.update(supabase, tenantId, unitId, {
      tenant_record_id: tenantRecordId,
      status: 'occupied',
    } as UnitUpdate)
  }

  /**
   * Remove tenant from unit.
   */
  async removeTenant(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    unitId: string
  ): Promise<Unit> {
    return this.update(supabase, tenantId, unitId, {
      tenant_record_id: null,
      status: 'available',
    } as UnitUpdate)
  }
}

// Export singleton instance
export const unitRepository = new UnitRepositoryClass()
