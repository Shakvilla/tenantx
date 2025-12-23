/**
 * Pagination options for list queries.
 */
export interface PaginationOptions {
  page?: number
  pageSize?: number
  cursor?: string
}

/**
 * Sort options for list queries.
 */
export interface SortOptions {
  field: string
  order: 'asc' | 'desc'
}

/**
 * Query options combining pagination, sorting, and filtering.
 */
export interface QueryOptions extends PaginationOptions {
  sort?: SortOptions
  filters?: Record<string, unknown>
  search?: string
}



/**
 * Default pagination values.
 */
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

/**
 * Parses and validates pagination parameters from URL search params.
 * 
 * @example
 * ```typescript
 * const { page, pageSize } = parsePaginationParams(request.nextUrl.searchParams)
 * ```
 */

export function parsePaginationParams(
  searchParams: URLSearchParams
): Required<PaginationOptions> {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const requestedPageSize = parseInt(
    searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE),
    10
  )
  const pageSize = Math.min(Math.max(1, requestedPageSize), MAX_PAGE_SIZE)
  const cursor = searchParams.get('cursor') || undefined

  return { 
    page, 
    pageSize,
    cursor: cursor ?? ''
  }
}

/**
 * Parses sort parameters from URL search params.
 * 
 * @example
 * ```typescript
 * const sort = parseSortParams(searchParams, { field: 'createdAt', order: 'desc' })
 * ```
 */

export function parseSortParams(
  searchParams: URLSearchParams,
  defaultSort: SortOptions = { field: 'created_at', order: 'desc' }
): SortOptions {
  const sortField = searchParams.get('sort') || defaultSort.field
  const sortOrder = (searchParams.get('order') || defaultSort.order) as 'asc' | 'desc'

  return {
    field: sortField,
    order: ['asc', 'desc'].includes(sortOrder) ? sortOrder : defaultSort.order,
  }
}

/**
 * Calculates Supabase range for pagination.
 * 
 * @example
 * ```typescript
 * const { from, to } = calculateRange(page, pageSize)
 * const { data } = await supabase.from('tenants').select('*').range(from, to)
 * ```
 */
export function calculateRange(
  page: number,
  pageSize: number
): { from: number; to: number } {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  return { from, to }
}

/**
 * Parses all query options from URL search params.
 */
export function parseQueryOptions(
  searchParams: URLSearchParams,
  allowedFilters: string[] = []
): QueryOptions {
  const { page, pageSize, cursor } = parsePaginationParams(searchParams)
  const sort = parseSortParams(searchParams)
  const search = searchParams.get('search') || undefined

  // Parse allowed filters
  const filters: Record<string, unknown> = {}
  allowedFilters.forEach((key) => {
    const value = searchParams.get(key)
    if (value !== null) {
      filters[key] = value
    }
  })

  return {
    page,
    pageSize,
    cursor: cursor || undefined,
    sort,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
    search,
  }
}
