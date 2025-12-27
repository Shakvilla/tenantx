import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, Tables, TablesInsert, TablesUpdate } from '@/types/database/database.types'
import type { QueryOptions, PaginatedResult } from '@/types/api/response.types'
import { BaseRepository } from './base-repository'

/**
 * Property type from database.
 */
export type Property = Tables<'properties'>
export type PropertyInsert = TablesInsert<'properties'>
export type PropertyUpdate = TablesUpdate<'properties'>

/**
 * Property statistics type.
 */
export interface PropertyStats {
  total: number
  active: number
  inactive: number
  maintenance: number
  totalUnits: number
  occupiedUnits: number
  occupancyRate: number
}

/**
 * Property repository for database operations.
 */
class PropertyRepositoryClass extends BaseRepository<Property, PropertyInsert, PropertyUpdate> {
  protected readonly tableName = 'properties' as const
  protected readonly resourceName = 'Property'

  /**
   * Apply search filter for properties.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected applySearch(query: any, search: string): any {
    return query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  /**
   * Find all properties with extended filtering.
   */
  async findAllWithFilters(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    options: QueryOptions & {
      status?: string
      type?: string
      region?: string
      district?: string
    } = {}
  ): Promise<PaginatedResult<Property>> {
    const { status, type, region, district, ...baseOptions } = options

    return this.findAll(supabase, tenantId, {
      ...baseOptions,
      filters: {
        ...(status && { status }),
        ...(type && { type }),
        ...(region && { region }),
        ...(district && { district }),
      },
    })
  }

  /**
   * Get property statistics.
   */
  async getStats(
    supabase: SupabaseClient<Database>,
    tenantId: string
  ): Promise<PropertyStats> {
    // Get status counts
    const { data, error } = await supabase
      .from(this.tableName)
      .select('status, total_units, occupied_units')
      .eq('tenant_id', tenantId)

    if (error) {
      throw error
    }

    const properties = data || []
    
    const total = properties.length
    const active = properties.filter(p => p.status === 'active').length
    const inactive = properties.filter(p => p.status === 'inactive').length
    const maintenance = properties.filter(p => p.status === 'maintenance').length
    
    const totalUnits = properties.reduce((sum, p) => sum + (p.total_units || 0), 0)
    const occupiedUnits = properties.reduce((sum, p) => sum + (p.occupied_units || 0), 0)
    const occupancyRate = totalUnits > 0 
      ? Math.round((occupiedUnits / totalUnits) * 100) 
      : 0

    return {
      total,
      active,
      inactive,
      maintenance,
      totalUnits,
      occupiedUnits,
      occupancyRate,
    }
  }

  /**
   * Check if a property name already exists for this tenant.
   */
  async existsByName(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    name: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .ilike('name', name)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { count, error } = await query

    if (error) {
      throw error
    }

    return (count || 0) > 0
  }
}

// Export singleton instance
export const propertyRepository = new PropertyRepositoryClass()
