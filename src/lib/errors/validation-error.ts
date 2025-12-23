import { AppError, ErrorCode } from './app-error'
import type { ZodError } from 'zod'

/**
 * Error thrown when input validation fails.
 * Typically used with Zod schema validation.
 */
export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    details?: unknown,
    field?: string
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details, field)
  }

  /**
   * Creates a ValidationError from a Zod error.
   */
  static fromZodError(zodError: ZodError): ValidationError {
    const firstError = zodError.errors[0]
    const field = firstError?.path?.join('.') || undefined
    const message = firstError?.message || 'Validation failed'
    
    const details = zodError.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }))

    return new ValidationError(message, details, field)
  }
}
