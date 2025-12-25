import { NextResponse } from 'next/server'

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
 * Standard successful API response.
 */
export interface SuccessResponse<T> {
  success: true
  message?: string
  data: T
  meta?: {
    pagination?: PaginationMeta
    filters?: Record<string, unknown>
    sort?: { field: string; order: 'asc' | 'desc' }
  }
}

/**
 * Standard error API response.
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
 * Creates a successful JSON response.
 * 
 * @example
 * ```typescript
 * return successResponse(tenant) // 200
 * return successResponse(tenant, 201) // 201 Created
 * ```
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200,
  meta?: SuccessResponse<T>['meta']
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      message,
      data,
      ...(meta && { meta }),
    },
    { status }
  )
}

/**
 * Creates a successful list response with pagination.
 * 
 * @example
 * ```typescript
 * return listResponse(tenants, { page: 1, pageSize: 10, total: 100 })
 * ```
 */
export function listResponse<T>(
  data: T[],
  pagination: Omit<PaginationMeta, 'totalPages' | 'hasNext' | 'hasPrev'> & 
    Partial<Pick<PaginationMeta, 'totalPages' | 'hasNext' | 'hasPrev'>>,
  options?: {
    filters?: Record<string, unknown>
    sort?: { field: string; order: 'asc' | 'desc' }
  }
): NextResponse<SuccessResponse<T[]>> {
  const { page, pageSize, total, cursor } = pagination
  const totalPages = Math.ceil(total / pageSize)
  
  return NextResponse.json({
    success: true as const,
    message: 'Success',
    data,
    meta: {
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: pagination.hasNext ?? page < totalPages,
        hasPrev: pagination.hasPrev ?? page > 1,
        ...(cursor && { cursor }),
      },
      ...options,
    },
  })
}

/**
 * Creates an error JSON response.
 * 
 * @example
 * ```typescript
 * return errorResponse('Validation failed', 'VALIDATION_ERROR', 400)
 * ```
 */
export function errorResponse(
  message: string,
  code: string,
  status: number = 400,
  details?: unknown,
  field?: string
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      message,
      data: null,
      error: {
        code,
        message,
        ...(details && { details }),
        ...(field && { field }),
      },
    },
    { status }
  )
}

/**
 * Creates a 204 No Content response for successful deletions.
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

/**
 * Creates a 201 Created response.
 */
export function createdResponse<T>(data: T): NextResponse<SuccessResponse<T>> {
  return successResponse(data, 'Successful', 201)
}
