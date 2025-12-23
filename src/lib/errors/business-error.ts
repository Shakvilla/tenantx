import { AppError, ErrorCode } from './app-error'

/**
 * Error thrown when a resource conflict occurs (e.g., duplicate entry).
 */
export class ConflictError extends AppError {
  constructor(
    message: string = 'Resource conflict',
    details?: unknown
  ) {
    super(message, ErrorCode.DUPLICATE_ENTRY, 409, details)
  }

  /**
   * Creates a ConflictError for duplicate entries.
   */
  static duplicate(resource: string, field?: string): ConflictError {
    const message = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`
    return new ConflictError(message)
  }
}

/**
 * Error thrown when a business rule is violated.
 */
export class BusinessError extends AppError {
  constructor(
    message: string,
    details?: unknown
  ) {
    super(message, ErrorCode.BUSINESS_RULE_VIOLATION, 422, details)
  }

  /**
   * Creates a BusinessError for limit exceeded scenarios.
   */
  static limitExceeded(resource: string, limit: number): BusinessError {
    return new BusinessError(
      `${resource} limit of ${limit} exceeded`,
      { resource, limit }
    )
  }

  /**
   * Creates a BusinessError for invalid state transitions.
   */
  static invalidStateTransition(from: string, to: string): BusinessError {
    return new BusinessError(
      `Cannot transition from '${from}' to '${to}'`,
      { from, to }
    )
  }
}
