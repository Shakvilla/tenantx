/**
 * Error codes used across the application.
 * These are returned in API responses for frontend error handling.
 */
export enum ErrorCode {

  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Authentication errors (401)
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Authorization errors (403)
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  TENANT_ACCESS_DENIED = 'TENANT_ACCESS_DENIED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Not found errors (404)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  
  // Conflict errors (409)
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Business logic errors (422)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  
  // Rate limit errors (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * Base application error class.
 * All custom errors should extend this class.
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: unknown
  public readonly field?: string
  public readonly isOperational: boolean

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    details?: unknown,
    field?: string
  ) {
    super(message)
    
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.field = field
    this.isOperational = true // Distinguishes from programming errors
    
    // Maintains proper stack trace for debugging
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Converts error to JSON format for API responses.
   */
  toJSON() {
    const result: {
      code: ErrorCode
      message: string
      details?: unknown
      field?: string
    } = {
      code: this.code,
      message: this.message,
    }

    if (this.details !== undefined) {
      result.details = this.details
    }

    if (this.field !== undefined) {
      result.field = this.field
    }

    return result
  }
}
