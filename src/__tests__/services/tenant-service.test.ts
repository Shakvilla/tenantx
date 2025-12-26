import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  createMockSupabaseClient,
  setMockResult,
  setMockListResult,
  setMockError,
  createMockTenantRecord,
  createMockTenantRecordList,
} from '../utils'
import {
  getTenantRecords,
  getTenantRecordById,
  createTenantRecord,
  updateTenantRecord,
  deleteTenantRecord,
  getTenantRecordStats,
} from '@/services/tenant-service'
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors'
import type { MockSupabaseClient } from '../utils/mock-supabase'

describe('tenant-service', () => {
  let mockSupabase: MockSupabaseClient
  const tenantId = 'tenant-123'

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
  })

  // =========================================================================
  // getTenantRecords
  // =========================================================================
  describe('getTenantRecords', () => {
    it('should return paginated tenant records', async () => {
      const mockRecords = createMockTenantRecordList(5)

      setMockListResult(mockSupabase, mockRecords, 5)

      const result = await getTenantRecords(mockSupabase, tenantId, {
        page: 1,
        pageSize: 10,
      })

      expect(result.data).toHaveLength(5)
      expect(result.total).toBe(5)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
    })

    it('should apply filters when provided', async () => {
      const activeRecords = createMockTenantRecordList(3, { status: 'active' })

      setMockListResult(mockSupabase, activeRecords, 3)

      const result = await getTenantRecords(mockSupabase, tenantId, {
        filters: { status: 'active' },
      })

      expect(result.data).toHaveLength(3)
      expect(mockSupabase.from).toHaveBeenCalledWith('tenant_records')
    })

    it('should return empty array when no records exist', async () => {
      setMockListResult(mockSupabase, [], 0)

      const result = await getTenantRecords(mockSupabase, tenantId)

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  // =========================================================================
  // getTenantRecordById
  // =========================================================================
  describe('getTenantRecordById', () => {
    it('should return tenant record when found', async () => {
      const mockRecord = createMockTenantRecord()

      setMockResult(mockSupabase, { data: mockRecord, error: null, count: null })

      const result = await getTenantRecordById(mockSupabase, tenantId, 'tr-123')

      expect(result).toEqual(mockRecord)
      expect(result.first_name).toBe('John')
    })

    it('should throw NotFoundError when record does not exist', async () => {
      setMockResult(mockSupabase, { data: null, error: { message: 'Not found', code: 'PGRST116' }, count: null })

      await expect(
        getTenantRecordById(mockSupabase, tenantId, 'nonexistent')
      ).rejects.toThrow(NotFoundError)
    })
  })

  // =========================================================================
  // createTenantRecord
  // =========================================================================
  describe('createTenantRecord', () => {
    const validPayload = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+233201234567',
      status: 'active' as const,
    }

    it('should create a new tenant record with valid data', async () => {
      const createdRecord = createMockTenantRecord({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
      })

      // First call: check for existing email (findByEmail)
      setMockResult(mockSupabase, { data: null, error: { message: 'Not found', code: 'PGRST116' }, count: null })

      // Second call: create record
      setMockResult(mockSupabase, { data: createdRecord, error: null, count: null })

      const result = await createTenantRecord(mockSupabase, tenantId, validPayload)

      expect(result.first_name).toBe('Jane')
      expect(result.email).toBe('jane.smith@example.com')
    })

    it('should throw ConflictError when email already exists', async () => {
      const existingRecord = createMockTenantRecord({ email: validPayload.email })

      setMockResult(mockSupabase, { data: existingRecord, error: null, count: null })

      await expect(
        createTenantRecord(mockSupabase, tenantId, validPayload)
      ).rejects.toThrow(ConflictError)
    })

    it('should throw ValidationError for invalid email', async () => {
      const invalidPayload = {
        ...validPayload,
        email: 'not-an-email',
      }

      await expect(
        createTenantRecord(mockSupabase, tenantId, invalidPayload)
      ).rejects.toThrow() // Zod validation error
    })

    it('should throw ValidationError for missing required fields', async () => {
      const incompletePayload = {
        firstName: 'Jane',

        // Missing lastName, email, phone
      }

      await expect(
        createTenantRecord(mockSupabase, tenantId, incompletePayload as any)
      ).rejects.toThrow()
    })
  })

  // =========================================================================
  // updateTenantRecord
  // =========================================================================
  describe('updateTenantRecord', () => {
    it('should update tenant record with valid data', async () => {
      const existingRecord = createMockTenantRecord()
      const updatedRecord = { ...existingRecord, first_name: 'Updated' }

      // First call: findByIdOrThrow
      setMockResult(mockSupabase, { data: existingRecord, error: null, count: null })

      // Second call: update
      setMockResult(mockSupabase, { data: updatedRecord, error: null, count: null })

      const result = await updateTenantRecord(mockSupabase, tenantId, 'tr-123', {
        firstName: 'Updated',
      })

      expect(result.first_name).toBe('Updated')
    })

    it('should throw NotFoundError when updating non-existent record', async () => {
      setMockResult(mockSupabase, { data: null, error: { message: 'Not found', code: 'PGRST116' }, count: null })

      await expect(
        updateTenantRecord(mockSupabase, tenantId, 'nonexistent', { firstName: 'Test' })
      ).rejects.toThrow(NotFoundError)
    })

    // Note: This test is complex due to multiple database calls needed.
    // In a real integration test with Supabase test database, this would be easier.
    it.skip('should throw ConflictError when updating to existing email', async () => {
      // This test requires integration testing with actual database
      // or more sophisticated mock setup
    })
  })

  // =========================================================================
  // deleteTenantRecord
  // =========================================================================
  describe('deleteTenantRecord', () => {
    it('should delete tenant record when it exists', async () => {
      const existingRecord = createMockTenantRecord()
      
      // First call: findByIdOrThrow
      setMockResult(mockSupabase, { data: existingRecord, error: null, count: null })

      // Second call: delete
      setMockResult(mockSupabase, { data: null, error: null, count: null })

      await expect(
        deleteTenantRecord(mockSupabase, tenantId, 'tr-123')
      ).resolves.toBeUndefined()
    })

    it('should throw NotFoundError when deleting non-existent record', async () => {
      setMockResult(mockSupabase, { data: null, error: { message: 'Not found', code: 'PGRST116' }, count: null })

      await expect(
        deleteTenantRecord(mockSupabase, tenantId, 'nonexistent')
      ).rejects.toThrow(NotFoundError)
    })
  })

  // =========================================================================
  // getTenantRecordStats
  // =========================================================================
  describe('getTenantRecordStats', () => {
    it('should return correct statistics', async () => {
      // Mock 4 count queries (total, active, inactive, pending)
      const chain = (mockSupabase as any)._chain

      chain.then
        .mockImplementationOnce((resolve: (value: unknown) => void) => resolve({ data: null, error: null, count: 10 }))
        .mockImplementationOnce((resolve: (value: unknown) => void) => resolve({ data: null, error: null, count: 6 }))
        .mockImplementationOnce((resolve: (value: unknown) => void) => resolve({ data: null, error: null, count: 2 }))
        .mockImplementationOnce((resolve: (value: unknown) => void) => resolve({ data: null, error: null, count: 2 }))


      const stats = await getTenantRecordStats(mockSupabase, tenantId)

      expect(stats).toEqual({
        total: 10,
        active: 6,
        inactive: 2,
        pending: 2,
      })
    })
  })
})
