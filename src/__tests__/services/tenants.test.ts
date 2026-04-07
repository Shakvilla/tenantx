import { describe, it, expect, beforeEach, vi } from 'vitest'

import type * as ApiClient from '@/lib/api/client'

import { getTenants, createTenant, updateTenant, getTenantById, deleteTenant, getTenantStats, uploadTenantImage } from '@/lib/api/tenants'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api/client'

// We need to mock client.ts to use our mocked axios instance or mock it directly.
// The easiest is to mock client.ts and export the same functions.
vi.mock('@/lib/api/client', async importOriginal => {
  const actual = await importOriginal<typeof ApiClient>()

  return {
    ...actual,
    apiGet: vi.fn(),
    apiPost: vi.fn(),
    apiPatch: vi.fn(),
    apiPut: vi.fn(),
    apiDelete: vi.fn()
  }
})

// Mock global fetch for uploadTenantImage
global.fetch = vi.fn()

describe('Tenants Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTenants', () => {
    it('should call apiGet with correct URL and tenantId header', async () => {
      const mockTenants = {
        success: true,
        data: [],
        pagination: { page: 1, pageSize: 10, total: 0 }
      }

      vi.mocked(apiGet).mockResolvedValue(mockTenants)

      const tenantId = 'test-tenant-id'
      const result = await getTenants(tenantId, { page: 1 })

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining('/tenants?page=1'),
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
      expect(result).toEqual(mockTenants)
    })

    it('should handle optional query parameters', async () => {
      vi.mocked(apiGet).mockResolvedValue({ success: true, data: [] })
      const tenantId = 'test-tenant-id'
      
      await getTenants(tenantId, { 
        page: 2, 
        pageSize: 20, 
        search: 'john', 
        status: 'active', 
        propertyId: 'prop-1' 
      })

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining('/tenants?page=2&pageSize=20&search=john&status=active&propertyId=prop-1'),
        expect.any(Object)
      )
    })
  })

  describe('getTenantById', () => {
    it('should call apiGet with correct URL and tenantId header', async () => {
      const mockResponse = { success: true, data: { id: '1' } }
      vi.mocked(apiGet).mockResolvedValue(mockResponse)

      const tenantId = 'test-tenant-id'
      const id = '1'
      const result = await getTenantById(tenantId, id)

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining(`/tenants/${id}`),
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('createTenant', () => {
    it('should call apiPost with correct URL, data, and tenantId header', async () => {
      const mockResponse = { success: true, data: { id: '1' } }

      vi.mocked(apiPost).mockResolvedValue(mockResponse)

      const tenantId = 'test-tenant-id'

      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '123456789'
      }

      const result = await createTenant(tenantId, payload)

      expect(apiPost).toHaveBeenCalledWith(
        expect.stringContaining('/tenants'),
        payload,
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateTenant', () => {
    it('should call apiPatch with correct URL, data, and tenantId header', async () => {
      const mockResponse = { success: true, data: { id: '1' } }

      vi.mocked(apiPatch).mockResolvedValue(mockResponse)

      const tenantId = 'test-tenant-id'
      const id = '1'
      const payload = { firstName: 'Jane' }

      const result = await updateTenant(tenantId, id, payload)

      expect(apiPatch).toHaveBeenCalledWith(
        expect.stringContaining(`/tenants/${id}`),
        payload,
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteTenant', () => {
    it('should call apiDelete with correct URL and tenantId header', async () => {
      vi.mocked(apiDelete).mockResolvedValue(undefined)

      const tenantId = 'test-tenant-id'
      const id = '1'
      await deleteTenant(tenantId, id)

      expect(apiDelete).toHaveBeenCalledWith(
        expect.stringContaining(`/tenants/${id}`),
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
    })
  })

  describe('getTenantStats', () => {
    it('should call apiGet with correct URL and tenantId header', async () => {
      const mockResponse = { success: true, data: { total: 10 } }
      vi.mocked(apiGet).mockResolvedValue(mockResponse)

      const tenantId = 'test-tenant-id'
      const result = await getTenantStats(tenantId)

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining('/tenants/stats'),
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('uploadTenantImage', () => {
    it('should call fetch with correct URL, method, body, and headers', async () => {
      const mockResponse = { success: true, data: { url: 'http://example.com/image.jpg' } }
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const tenantId = 'test-tenant-id'
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const propertyName = 'Test Property'
      const tenantName = 'John Doe'
      
      const result = await uploadTenantImage(tenantId, file, propertyName, tenantName, 'avatar')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tenants/upload'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should throw error if fetch is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'Upload failed' } })
      } as Response)

      const tenantId = 'test-tenant-id'
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      
      await expect(uploadTenantImage(tenantId, file, 'Prop', 'Tenant', 'avatar'))
        .rejects.toThrow('Upload failed')
    })
  })
})
