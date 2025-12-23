import { AppError, ErrorCode } from './app-error'

/**
 * Error thrown when a requested resource is not found.
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string = 'Resource',
    id?: string
  ) {
    const message = id
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`
    super(message, ErrorCode.RESOURCE_NOT_FOUND, 404)
  }

  /**
   * Factory methods for common not found scenarios.
   */
  static tenant(id?: string): NotFoundError {
    return new NotFoundError('Tenant', id)
  }

  static property(id?: string): NotFoundError {
    return new NotFoundError('Property', id)
  }

  static unit(id?: string): NotFoundError {
    return new NotFoundError('Unit', id)
  }

  static agreement(id?: string): NotFoundError {
    return new NotFoundError('Agreement', id)
  }

  static invoice(id?: string): NotFoundError {
    return new NotFoundError('Invoice', id)
  }

  static user(id?: string): NotFoundError {
    return new NotFoundError('User', id)
  }
}
