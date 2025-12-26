import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createMockSupabaseClient,
  setMockResult,
  createMockAuthUser,
  createMockUser,
} from '../utils'
import type { MockSupabaseClient } from '../utils/mock-supabase'

// Import the service (will fail until implemented)
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  refreshToken,
} from '@/services/auth-service'

// Import errors for assertions
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '@/lib/errors'

describe('auth-service', () => {
  let mockSupabase: MockSupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
  })

  // ===========================================================================
  // AC1: User Registration (Happy Path)
  // ===========================================================================
  describe('registerUser', () => {
    const validRegistration = {
      email: 'newuser@example.com',
      password: 'Password123',
      name: 'New User',
      tenantName: 'New Tenant',
    }

    it('AC1: should create user, tenant, and return token on successful registration', async () => {
      // Mock Supabase auth admin methods
      mockSupabase.auth.admin = {
        createUser: vi.fn().mockResolvedValue({
          data: {
            user: { id: 'user-123', email: validRegistration.email },
          },
          error: null,
        }),
        updateUserById: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
        listUsers: vi.fn().mockResolvedValue({
          data: { users: [] },
          error: null,
        }),
      } as any

      // Mock signInWithPassword (called after createUser to get session)
      mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: {
          user: { id: 'user-123', email: validRegistration.email },
          session: { access_token: 'token-123', refresh_token: 'refresh-123' },
        },
        error: null,
      })

      // Mock tenant creation
      setMockResult(mockSupabase, {
        data: { id: 'tenant-123', name: validRegistration.tenantName },
        error: null,
        count: null,
      })

      // Mock user record creation
      setMockResult(mockSupabase, {
        data: {
          id: 'user-123',
          tenant_id: 'tenant-123',
          email: validRegistration.email,
          name: validRegistration.name,
          role: 'admin',
        },
        error: null,
        count: null,
      })

      const result = await registerUser(mockSupabase, validRegistration)

      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('refreshToken')
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('tenant')
      expect(result.user.email).toBe(validRegistration.email)
      expect(result.user.role).toBe('admin')
      expect(result.tenant.name).toBe(validRegistration.tenantName)
    })

    // AC2: Validation errors
    it('AC2: should throw ValidationError for invalid email', async () => {
      const invalidPayload = {
        ...validRegistration,
        email: 'invalid-email',
      }

      await expect(registerUser(mockSupabase, invalidPayload)).rejects.toThrow(
        ValidationError
      )
    })

    it('AC2: should throw ValidationError for weak password', async () => {
      const weakPasswordPayload = {
        ...validRegistration,
        password: 'weak',
      }

      await expect(
        registerUser(mockSupabase, weakPasswordPayload)
      ).rejects.toThrow(ValidationError)
    })

    it('AC2: should throw ValidationError for missing tenant name and invite code', async () => {
      const noTenantPayload = {
        email: 'user@example.com',
        password: 'Password123',
        name: 'User',
        // No tenantName or inviteCode
      }

      await expect(
        registerUser(mockSupabase, noTenantPayload as any)
      ).rejects.toThrow()
    })

    // AC3: Duplicate email
    it('AC3: should throw ConflictError when email already exists', async () => {
      // Mock createUser error with message that triggers duplicate check
      mockSupabase.auth.admin = {
        createUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'User has already been registered', status: 422 },
        }),
        updateUserById: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
        listUsers: vi.fn().mockResolvedValue({
          data: { users: [] },
          error: null,
        }),
      } as any

      // Mock users table to return existing user (triggers ConflictError)
      setMockResult(mockSupabase, {
        data: { id: 'existing-user-123' },
        error: null,
        count: null,
      })

      await expect(registerUser(mockSupabase, validRegistration)).rejects.toThrow(
        ConflictError
      )
    })
  })




  // ===========================================================================
  // AC4-AC6: User Login
  // ===========================================================================
  describe('loginUser', () => {
    const validCredentials = {
      email: 'user@example.com',
      password: 'Password123',
    }

    it('AC4: should return token and user info on successful login', async () => {
      // Mock Supabase auth signIn
      mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: validCredentials.email,
            user_metadata: { tenant_id: 'tenant-123', role: 'admin' },
          },
          session: {
            access_token: 'token-123',
            refresh_token: 'refresh-123',
            expires_at: Date.now() + 3600000,
          },
        },
        error: null,
      })

      // Mock user lookup
      setMockResult(mockSupabase, {
        data: createMockUser({ email: validCredentials.email }),
        error: null,
        count: null,
      })

      // Mock tenant lookup
      setMockResult(mockSupabase, {
        data: { id: 'tenant-123', name: 'Test Tenant', subdomain: 'test' },
        error: null,
        count: null,
      })

      const result = await loginUser(mockSupabase, validCredentials)

      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('refreshToken')
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('tenant')
      expect(result.user.email).toBe(validCredentials.email)
    })

    // AC5: Invalid credentials
    it('AC5: should throw UnauthorizedError for invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 },
      })

      await expect(loginUser(mockSupabase, validCredentials)).rejects.toThrow(
        UnauthorizedError
      )
    })

    it('AC5: should not reveal which field is wrong in error message', async () => {
      mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 },
      })

      try {
        await loginUser(mockSupabase, validCredentials)
      } catch (error) {
        expect((error as Error).message).not.toContain('email')
        expect((error as Error).message).not.toContain('password')
        expect((error as Error).message).toContain('Invalid credentials')
      }
    })

    // AC6: Multi-tenant login
    it('AC6: should use specified tenantId when provided', async () => {
      const specificTenantId = '550e8400-e29b-41d4-a716-446655440000'
      const multiTenantLogin = {
        ...validCredentials,
        tenantId: specificTenantId,
      }

      mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: validCredentials.email,
            user_metadata: { role: 'admin' },
          },
          session: {
            access_token: 'token-123',
            refresh_token: 'refresh-123',
          },
        },
        error: null,
      })

      // Mock user lookup with specific tenant
      setMockResult(mockSupabase, {
        data: createMockUser({
          tenant_id: specificTenantId,
          email: validCredentials.email,
        }),
        error: null,
        count: null,
      })

      // Mock tenant lookup
      setMockResult(mockSupabase, {
        data: {
          id: specificTenantId,
          name: 'Specific Tenant',
          subdomain: 'specific',
        },
        error: null,
        count: null,
      })

      const result = await loginUser(mockSupabase, multiTenantLogin)

      expect(result.tenant.id).toBe(specificTenantId)
    })
  })

  // ===========================================================================
  // AC11: Get Current User
  // ===========================================================================
  describe('getCurrentUser', () => {
    it('AC11: should return user profile and tenant info', async () => {
      const mockUser = createMockAuthUser()

      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock user record lookup
      setMockResult(mockSupabase, {
        data: createMockUser(),
        error: null,
        count: null,
      })

      // Mock tenant lookup
      setMockResult(mockSupabase, {
        data: { id: 'tenant-123', name: 'Test Tenant' },
        error: null,
        count: null,
      })

      const result = await getCurrentUser(mockSupabase)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('tenant')
      expect(result.user).not.toHaveProperty('password')
    })

    it('AC11: should throw UnauthorizedError when not authenticated', async () => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      await expect(getCurrentUser(mockSupabase)).rejects.toThrow(
        UnauthorizedError
      )
    })
  })

  // ===========================================================================
  // AC12: Logout
  // ===========================================================================
  describe('logoutUser', () => {
    it('AC12: should successfully logout and invalidate session', async () => {
      mockSupabase.auth.signOut = vi.fn().mockResolvedValue({
        error: null,
      })

      await expect(logoutUser(mockSupabase)).resolves.toBeUndefined()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Profile Update
  // ===========================================================================
  describe('updateUserProfile', () => {
    it('should update user profile with valid data', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+233201234567',
      }

      const mockUser = createMockAuthUser()
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock update
      setMockResult(mockSupabase, {
        data: { ...createMockUser(), ...updateData },
        error: null,
        count: null,
      })

      const result = await updateUserProfile(mockSupabase, updateData)

      expect(result.name).toBe(updateData.name)
    })
  })

  // ===========================================================================
  // Token Refresh
  // ===========================================================================
  describe('refreshToken', () => {
    it('should return new tokens on valid refresh', async () => {
      mockSupabase.auth.refreshSession = vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'new-token-123',
            refresh_token: 'new-refresh-123',
            expires_at: Date.now() + 3600000,
          },
          user: createMockAuthUser(),
        },
        error: null,
      })

      const result = await refreshToken(mockSupabase)

      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('refreshToken')
      expect(result.token).toBe('new-token-123')
    })

    it('should throw UnauthorizedError on invalid refresh token', async () => {
      mockSupabase.auth.refreshSession = vi.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid refresh token' },
      })

      await expect(refreshToken(mockSupabase)).rejects.toThrow(
        UnauthorizedError
      )
    })
  })
})
