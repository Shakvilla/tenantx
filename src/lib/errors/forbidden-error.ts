import { AppError, ErrorCode } from './app-error'

/**
 * Error thrown when user is authenticated but lacks permission for the action.
 */
export class ForbiddenError extends AppError {
  constructor(
    message: string = 'You do not have permission to perform this action',
    code: ErrorCode = ErrorCode.INSUFFICIENT_PERMISSIONS
  ) {
    super(message, code, 403)
  }

  /**
   * Creates a ForbiddenError for tenant access denial.
   */
  static tenantAccessDenied(tenantId?: string): ForbiddenError {
    const message = tenantId
      ? `Access denied for tenant: ${tenantId}`
      : 'Access denied for this tenant'

    
return new ForbiddenError(message, ErrorCode.TENANT_ACCESS_DENIED)
  }
}
