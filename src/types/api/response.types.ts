/**
 * Standard API success response type.
 */
export interface SuccessResponse<T> {
  success: true
  data: T
  meta?: ResponseMeta
}

/**
 * Standard API error response type.
 */
export interface ErrorResponse {
  success: false
  data: null
  error: {
    code: string
    message: string
    details?: unknown
    field?: string
  }
}

/**
 * Union type for all API responses.
 */
export type APIResponse<T> = SuccessResponse<T> | ErrorResponse

/**
 * Pagination metadata for list responses.
 */
export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  cursor?: string
}

/**
 * Response metadata.
 */
export interface ResponseMeta {
  pagination?: PaginationMeta
  filters?: Record<string, unknown>
  sort?: SortMeta
}

/**
 * Sort metadata.
 */
export interface SortMeta {
  field: string
  order: 'asc' | 'desc'
}

/**
 * Query options for list endpoints.
 */
export interface QueryOptions {
  page?: number
  pageSize?: number
  cursor?: string
  sort?: SortMeta
  filters?: Record<string, unknown>
  search?: string
}

/**
 * Service result type for service layer responses.
 */
export type ServiceResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

/**
 * Paginated list result from services.
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
