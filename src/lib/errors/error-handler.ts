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

  // A Supabase branch used to sit here, left behind after the SDK was dropped.
  // Its type guard matched any object with a `message`, i.e. every Error, so it
  // ran instead of the generic handler below — labelling everything
  // DATABASE_ERROR and returning error.message verbatim in production, which
  // the generic branch deliberately withholds outside development.

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

