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
 * MUI's `TablePagination` sentinel for "the total is not known". It renders as
 * "1–10 of more than 10" and keeps next/prev working.
 */
export const UNKNOWN_TOTAL = -1

/**
 * The row count to hand `TablePagination`, given the API's reported total.
 *
 * The cursor-paginated tables used to derive this from page arithmetic —
 * `hasNext ? (page + 2) * pageSize : (page + 1) * pageSize` — which rounds the
 * total up to the next multiple of the page size. One property read as
 * "1–10 of 10". The API has been returning the real figure all along, in
 * `meta.pagination.total`; it simply was not read.
 *
 * A missing or nonsensical total returns {@link UNKNOWN_TOTAL} rather than a
 * guess: "more than 10" is true, and inventing a number is the bug being fixed.
 */
export function tablePaginationCount(total: number | null | undefined): number {
  return typeof total === 'number' && Number.isInteger(total) && total >= 0 ? total : UNKNOWN_TOTAL
}

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
  const parsedPage = parseInt(searchParams.get('page') || '1', 10)
  const page = Number.isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)
  
  const parsedPageSize = parseInt(
    searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE),
    10
  )

  const pageSize = Number.isNaN(parsedPageSize) 
    ? DEFAULT_PAGE_SIZE 
    : Math.min(Math.max(1, parsedPageSize), MAX_PAGE_SIZE)
  
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
