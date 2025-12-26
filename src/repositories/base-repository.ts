import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database/database.types'
import type { QueryOptions, PaginatedResult } from '@/types/api/response.types'
import { calculateRange } from '@/lib/api/pagination'
import { NotFoundError } from '@/lib/errors'

/**
 * Base repository interface that all repositories must implement.
 */
export interface IBaseRepository<T, TInsert, TUpdate> {
  findAll(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    options?: QueryOptions
  ): Promise<PaginatedResult<T>>
  
  findById(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    id: string
  ): Promise<T | null>
  
  create(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    data: TInsert
  ): Promise<T>
  
  update(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    id: string,
    data: TUpdate
  ): Promise<T>
  
  delete(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    id: string
  ): Promise<void>
}

/**
 * Abstract base repository class providing common CRUD operations.
 * All repositories should extend this class.
 * 
 * @template T - The row type from the database table
 * @template TInsert - The insert type for the table
 * @template TUpdate - The update type for the table
 * 
 * @example
 * ```typescript
 * class TenantRecordRepository extends BaseRepository<
 *   Tables<'tenant_records'>,
 *   TablesInsert<'tenant_records'>,
 *   TablesUpdate<'tenant_records'>
 * > {
 *   protected tableName = 'tenant_records' as const
 *   protected resourceName = 'Tenant'
 * }
 * ```
 */
export abstract class BaseRepository<T, TInsert, TUpdate>
  implements IBaseRepository<T, TInsert, TUpdate>
{
  /**
   * The database table name.
   */
  protected abstract readonly tableName: keyof Database['public']['Tables']
  
  /**
   * Human-readable resource name for error messages.
   */
  protected abstract readonly resourceName: string
  
  /**
   * Default select columns. Override to customize.
   */
  protected selectColumns: string = '*'

  /**
   * Finds all records for a tenant with pagination.
   */
  async findAll(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<T>> {
    const { page = 1, pageSize = 10, sort, search } = options
    const { from, to } = calculateRange(page, pageSize)

    // Build query
    let query = supabase
      .from(this.tableName)
      .select(this.selectColumns, { count: 'exact' })
      .eq('tenant_id', tenantId)

    // Apply search if provided and searchable fields are defined
    if (search) {
      query = this.applySearch(query, search)
    }

    // Apply filters
    if (options.filters) {
      query = this.applyFilters(query, options.filters)
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.order === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return {
      data: (data || []) as T[],
      total: count || 0,
      page,
      pageSize,
    }
  }

  /**
   * Finds a single record by ID.
   */
  async findById(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    id: string
  ): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(this.selectColumns)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }

      throw error
    }

    return data as T
  }

  /**
   * Finds a single record by ID or throws NotFoundError.
   */
  async findByIdOrThrow(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    id: string
  ): Promise<T> {
    const record = await this.findById(supabase, tenantId, id)
    
    if (!record) {
      throw new NotFoundError(this.resourceName, id)
    }
    
    return record
  }

  /**
   * Creates a new record.
   */
  async create(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    data: TInsert
  ): Promise<T> {
    const { data: record, error } = await supabase
      .from(this.tableName)
      .insert({ ...data, tenant_id: tenantId } as never)
      .select(this.selectColumns)
      .single()

    if (error) {
      throw error
    }

    return record as T
  }

  /**
   * Updates an existing record.
   */
  async update(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    id: string,
    data: TUpdate
  ): Promise<T> {
    // First verify the record exists and belongs to tenant
    await this.findByIdOrThrow(supabase, tenantId, id)

    const { data: record, error } = await supabase
      .from(this.tableName)
      .update({ ...data, updated_at: new Date().toISOString() } as never)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select(this.selectColumns)
      .single()

    if (error) {
      throw error
    }

    return record as T
  }

  /**
   * Deletes a record (soft delete by default, override for hard delete).
   */
  async delete(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    id: string
  ): Promise<void> {
    // First verify the record exists and belongs to tenant
    await this.findByIdOrThrow(supabase, tenantId, id)

    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', id)

    if (error) {
      throw error
    }
  }

  /**
   * Counts records matching criteria.
   */
  async count(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    filters?: Record<string, unknown>
  ): Promise<number> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)

    if (filters) {
      query = this.applyFilters(query, filters)
    }

    const { count, error } = await query

    if (error) {
      throw error
    }

    return count || 0
  }

  /**
   * Applies search to query. Override in subclasses to customize searchable fields.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected applySearch(query: any, _search: string): any {
    // Default implementation - override in subclasses
    return query
  }

  /**
   * Applies filters to query. Override in subclasses to customize filtering.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected applyFilters(query: any, filters: Record<string, unknown>): any {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value)
      }
    }

    
return query
  }
}
