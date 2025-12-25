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
   * Note: Zod v4 uses .issues, but we also check .errors for backwards compatibility
   */
  static fromZodError(zodError: ZodError): ValidationError {
    // Zod v4 uses .issues, older versions use .errors
    const issues = (zodError as unknown as { issues?: Array<{ path: (string | number)[]; message: string; code: string }> }).issues || 
                   (zodError as unknown as { errors?: Array<{ path: (string | number)[]; message: string; code: string }> }).errors || 
                   []
    const firstError = issues[0]
    const field = firstError?.path?.join('.') || undefined
    const message = firstError?.message || 'Validation failed'
    
    const details = issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }))

    return new ValidationError(message, details, field)
  }
}
