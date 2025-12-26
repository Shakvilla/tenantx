import { describe, it, expect } from 'vitest'

import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
} from '@/lib/validation/schemas/auth.schema'

describe('auth validation schemas', () => {
  // ===========================================================================
  // RegisterSchema
  // ===========================================================================
  describe('RegisterSchema', () => {
    it('should pass with valid registration data and tenantName', () => {
      const validData = {
        email: 'user@example.com',
        password: 'Password123',
        name: 'John Doe',
        tenantName: 'My Company',
      }

      const result = RegisterSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('should pass with valid registration data and inviteCode', () => {
      const validData = {
        email: 'user@example.com',
        password: 'Password123',
        name: 'John Doe',
        inviteCode: 'INVITE123',
      }

      const result = RegisterSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('should fail without tenantName or inviteCode', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'Password123',
        name: 'John Doe',
      }

      const result = RegisterSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('should fail with invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'Password123',
        name: 'John Doe',
        tenantName: 'Company',
      }

      const result = RegisterSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('should fail with password less than 8 characters', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'Pass1',
        name: 'John Doe',
        tenantName: 'Company',
      }

      const result = RegisterSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('should fail with password without uppercase', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe',
        tenantName: 'Company',
      }

      const result = RegisterSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('should fail with password without lowercase', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'PASSWORD123',
        name: 'John Doe',
        tenantName: 'Company',
      }

      const result = RegisterSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('should fail with password without number', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'PasswordABC',
        name: 'John Doe',
        tenantName: 'Company',
      }

      const result = RegisterSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('should fail with empty name', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'Password123',
        name: '',
        tenantName: 'Company',
      }

      const result = RegisterSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })
  })

  // ===========================================================================
  // LoginSchema
  // ===========================================================================
  describe('LoginSchema', () => {
    it('should pass with valid login data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'anypassword',
      }

      const result = LoginSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('should pass with optional tenantId', () => {
      const validData = {
        email: 'user@example.com',
        password: 'anypassword',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      }

      const result = LoginSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('should fail with invalid email', () => {
      const invalidData = {
        email: 'invalid',
        password: 'password',
      }

      const result = LoginSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('should fail with empty password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: '',
      }

      const result = LoginSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('should fail with invalid UUID for tenantId', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'password',
        tenantId: 'not-a-uuid',
      }

      const result = LoginSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })
  })

  // ===========================================================================
  // ForgotPasswordSchema
  // ===========================================================================
  describe('ForgotPasswordSchema', () => {
    it('should pass with valid email', () => {
      const result = ForgotPasswordSchema.safeParse({
        email: 'user@example.com',
      })

      expect(result.success).toBe(true)
    })

    it('should fail with invalid email', () => {
      const result = ForgotPasswordSchema.safeParse({ email: 'invalid' })

      expect(result.success).toBe(false)
    })
  })

  // ===========================================================================
  // ResetPasswordSchema
  // ===========================================================================
  describe('ResetPasswordSchema', () => {
    it('should pass with valid data and matching passwords', () => {
      const validData = {
        token: 'reset-token-123',
        password: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      }

      const result = ResetPasswordSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('should fail when passwords do not match', () => {
      const invalidData = {
        token: 'reset-token-123',
        password: 'NewPassword123',
        confirmPassword: 'DifferentPassword123',
      }

      const result = ResetPasswordSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('should fail with weak new password', () => {
      const invalidData = {
        token: 'reset-token-123',
        password: 'weak',
        confirmPassword: 'weak',
      }

      const result = ResetPasswordSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })
  })

  // ===========================================================================
  // UpdateProfileSchema
  // ===========================================================================
  describe('UpdateProfileSchema', () => {
    it('should pass with valid profile update', () => {
      const validData = {
        name: 'Updated Name',
        phone: '+233201234567',
      }

      const result = UpdateProfileSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('should pass with empty object (all fields optional)', () => {
      const result = UpdateProfileSchema.safeParse({})

      expect(result.success).toBe(true)
    })

    it('should pass with valid avatar URL', () => {
      const validData = {
        avatarUrl: 'https://example.com/avatar.png',
      }

      const result = UpdateProfileSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('should fail with invalid avatar URL', () => {
      const invalidData = {
        avatarUrl: 'not-a-url',
      }

      const result = UpdateProfileSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })
  })

  // ===========================================================================
  // ChangePasswordSchema
  // ===========================================================================
  describe('ChangePasswordSchema', () => {
    it('should pass with valid password change', () => {
      const validData = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
        confirmPassword: 'NewPassword456',
      }

      const result = ChangePasswordSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('should fail when new passwords do not match', () => {
      const invalidData = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
        confirmPassword: 'DifferentPassword789',
      }

      const result = ChangePasswordSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('should fail with weak new password', () => {
      const invalidData = {
        currentPassword: 'OldPassword123',
        newPassword: 'weak',
        confirmPassword: 'weak',
      }

      const result = ChangePasswordSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })
  })
})
