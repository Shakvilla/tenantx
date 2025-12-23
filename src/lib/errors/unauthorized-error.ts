import { AppError, ErrorCode } from './app-error'

/**
 * Error thrown when authentication is required but missing or invalid.
 */
export class UnauthorizedError extends AppError {
  constructor(
    message: string = 'Authentication required',
    code: ErrorCode = ErrorCode.AUTHENTICATION_REQUIRED
  ) {
    super(message, code, 401)
  }

  /**
   * Creates an UnauthorizedError for invalid tokens.
   */
  static invalidToken(): UnauthorizedError {
    return new UnauthorizedError('Invalid or expired token', ErrorCode.INVALID_TOKEN)
  }

  

  /**
   * Creates an UnauthorizedError for expired tokens.
   */
  static tokenExpired(): UnauthorizedError {
    return new UnauthorizedError('Token has expired', ErrorCode.TOKEN_EXPIRED)
  }
}
