import { NextResponse } from 'next/server'

import { ZodError } from 'zod'

import { AppError, ErrorCode } from './app-error'
import { ValidationError } from './validation-error'

/**
 * Centralized error handler for API routes.
 * Converts errors to standardized API responses.
 * 
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   try {
 *     // ... route logic
 *   } catch (error) {
 *     return handleError(error)
 *   }
 * }
 * ```
 */
export function handleError(error: unknown): NextResponse {
  console.error('API Error:', error)

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationError = ValidationError.fromZodError(error)

    
return NextResponse.json(
      {
        success: false,
        data: null,
        error: validationError.toJSON(),
      },
      { status: validationError.statusCode }
    )
  }

  // Handle AppError and its subclasses
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.toJSON(),
      },
      { status: error.statusCode }
    )
  }

  // Handle Supabase errors
  if (isSupabaseError(error)) {
    const statusCode = getSupabaseErrorStatusCode(error)

    
return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: error.message || 'Database operation failed',
          details: error.details || undefined,
        },
      },
      { status: statusCode }
    )
  }

  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  )
}

/**
 * Type guard for Supabase errors.
 */
function isSupabaseError(error: unknown): error is { 
  message: string
  details?: string
  code?: string 
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  )
}

/**
 * Maps Supabase error codes to HTTP status codes.
 */
function getSupabaseErrorStatusCode(error: { code?: string }): number {
  switch (error.code) {
    case 'PGRST116': // Not found
      return 404
    case 'PGRST301': // Unique violation
      return 409
    case '23505': // PostgreSQL unique violation
      return 409
    case '42501': // RLS policy violation
      return 403
    default:
      return 500
  }
}
