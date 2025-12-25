import { describe, it, expect } from 'vitest'
import { ZodError, z } from 'zod'
import {
  AppError,
  ErrorCode,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  BusinessError,
} from '@/lib/errors'

describe('error classes', () => {
  // =========================================================================
  // AppError
  // =========================================================================
  describe('AppError', () => {
    it('should create error with default values', () => {
      const error = new AppError('Something went wrong')

      expect(error.message).toBe('Something went wrong')
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR)
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(true)
    })

    it('should create error with custom values', () => {
      const error = new AppError(
        'Custom error',
        ErrorCode.VALIDATION_ERROR,
        400,
        { field: 'email' },
        'email'
      )

      expect(error.message).toBe('Custom error')
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.statusCode).toBe(400)
      expect(error.details).toEqual({ field: 'email' })
      expect(error.field).toBe('email')
    })

    it('should convert to JSON correctly', () => {
      const error = new AppError(
        'Test error',
        ErrorCode.VALIDATION_ERROR,
        400,
        { foo: 'bar' },
        'testField'
      )

      const json = error.toJSON()

      expect(json).toEqual({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Test error',
        details: { foo: 'bar' },
        field: 'testField',
      })
    })

    it('should omit undefined details and field in JSON', () => {
      const error = new AppError('Simple error')
      const json = error.toJSON()

      expect(json).toEqual({
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Simple error',
      })
      expect(json).not.toHaveProperty('details')
      expect(json).not.toHaveProperty('field')
    })
  })

  // =========================================================================
  // ValidationError
  // =========================================================================
  describe('ValidationError', () => {
    it('should create with default message', () => {
      const error = new ValidationError()

      expect(error.message).toBe('Validation failed')
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.statusCode).toBe(400)
    })

    it('should create from Zod error', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      })

      try {
        schema.parse({ email: 'invalid', age: 15 })
      } catch (e) {
        const error = ValidationError.fromZodError(e as ZodError)

        expect(error.statusCode).toBe(400)
        expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
        expect(error.field).toBe('email')
        expect(Array.isArray(error.details)).toBe(true)
      }
    })
  })

  // =========================================================================
  // UnauthorizedError
  // =========================================================================
  describe('UnauthorizedError', () => {
    it('should create with default values', () => {
      const error = new UnauthorizedError()

      expect(error.message).toBe('Authentication required')
      expect(error.code).toBe(ErrorCode.AUTHENTICATION_REQUIRED)
      expect(error.statusCode).toBe(401)
    })

    it('should create invalidToken error', () => {
      const error = UnauthorizedError.invalidToken()

      expect(error.message).toBe('Invalid or expired token')
      expect(error.code).toBe(ErrorCode.INVALID_TOKEN)
    })

    it('should create tokenExpired error', () => {
      const error = UnauthorizedError.tokenExpired()

      expect(error.message).toBe('Token has expired')
      expect(error.code).toBe(ErrorCode.TOKEN_EXPIRED)
    })
  })

  // =========================================================================
  // ForbiddenError
  // =========================================================================
  describe('ForbiddenError', () => {
    it('should create with default values', () => {
      const error = new ForbiddenError()

      expect(error.message).toBe('You do not have permission to perform this action')
      expect(error.code).toBe(ErrorCode.INSUFFICIENT_PERMISSIONS)
      expect(error.statusCode).toBe(403)
    })

    it('should create tenantAccessDenied error with ID', () => {
      const error = ForbiddenError.tenantAccessDenied('tenant-123')

      expect(error.message).toBe('Access denied for tenant: tenant-123')
      expect(error.code).toBe(ErrorCode.TENANT_ACCESS_DENIED)
    })

    it('should create tenantAccessDenied error without ID', () => {
      const error = ForbiddenError.tenantAccessDenied()

      expect(error.message).toBe('Access denied for this tenant')
    })
  })

  // =========================================================================
  // NotFoundError
  // =========================================================================
  describe('NotFoundError', () => {
    it('should create with resource name only', () => {
      const error = new NotFoundError('Property')

      expect(error.message).toBe('Property not found')
      expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
      expect(error.statusCode).toBe(404)
    })

    it('should create with resource name and ID', () => {
      const error = new NotFoundError('Property', 'prop-123')

      expect(error.message).toBe("Property with ID 'prop-123' not found")
    })

    it('should have factory methods for common resources', () => {
      expect(NotFoundError.tenant('t-1').message).toBe("Tenant with ID 't-1' not found")
      expect(NotFoundError.property('p-1').message).toBe("Property with ID 'p-1' not found")
      expect(NotFoundError.unit('u-1').message).toBe("Unit with ID 'u-1' not found")
      expect(NotFoundError.agreement('a-1').message).toBe("Agreement with ID 'a-1' not found")
      expect(NotFoundError.invoice('i-1').message).toBe("Invoice with ID 'i-1' not found")
      expect(NotFoundError.user('usr-1').message).toBe("User with ID 'usr-1' not found")
    })
  })

  // =========================================================================
  // ConflictError
  // =========================================================================
  describe('ConflictError', () => {
    it('should create with default values', () => {
      const error = new ConflictError()

      expect(error.message).toBe('Resource conflict')
      expect(error.code).toBe(ErrorCode.DUPLICATE_ENTRY)
      expect(error.statusCode).toBe(409)
    })

    it('should create duplicate error with field', () => {
      const error = ConflictError.duplicate('User', 'email')

      expect(error.message).toBe('User with this email already exists')
    })

    it('should create duplicate error without field', () => {
      const error = ConflictError.duplicate('Property')

      expect(error.message).toBe('Property already exists')
    })
  })

  // =========================================================================
  // BusinessError
  // =========================================================================
  describe('BusinessError', () => {
    it('should create with custom message', () => {
      const error = new BusinessError('Cannot delete active agreement')

      expect(error.message).toBe('Cannot delete active agreement')
      expect(error.code).toBe(ErrorCode.BUSINESS_RULE_VIOLATION)
      expect(error.statusCode).toBe(422)
    })

    it('should create limitExceeded error', () => {
      const error = BusinessError.limitExceeded('Properties', 10)

      expect(error.message).toBe('Properties limit of 10 exceeded')
      expect(error.details).toEqual({ resource: 'Properties', limit: 10 })
    })

    it('should create invalidStateTransition error', () => {
      const error = BusinessError.invalidStateTransition('draft', 'completed')

      expect(error.message).toBe("Cannot transition from 'draft' to 'completed'")
      expect(error.details).toEqual({ from: 'draft', to: 'completed' })
    })
  })
})
