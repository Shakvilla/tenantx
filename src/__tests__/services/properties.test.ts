import { describe, it, expect, beforeEach, vi } from 'vitest'

import type * as ApiClient from '@/lib/api/client'

import {
  getProperties,
  getPropertyById,
  getMyProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyStats,
  saveDraft,
  updateDraft,
  uploadPropertyImages
} from '@/lib/api/properties'
import { serverGetPropertyById } from '@/lib/api/properties.server'

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

// Mock server-api for serverGetPropertyById
vi.mock('@/lib/api/server-api', () => ({
  serverApiGet: vi.fn()
}))
vi.mock('@/lib/api/properties.server', () => ({
  serverGetPropertyById: vi.fn()
}))

// Mock ImageKit uploads used by uploadPropertyImages
vi.mock('@/lib/imagekit', () => ({
  uploadImages: vi.fn()
}))

// client.ts creates an axios instance at module load, so axios must be mocked
// even though no test asserts on it directly.
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>()
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => ({
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        },
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
      })),
      post: vi.fn(() => Promise.resolve({ data: { success: true } }))
    }
  }
})

import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api/client'

describe('Properties Service', () => {
  const tenantId = 'test-tenant-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProperties', () => {
    it('should call apiGet with correct URL and tenantId header', async () => {
      vi.mocked(apiGet).mockResolvedValue({ success: true, data: [] })
      
      await getProperties(tenantId, { size: 10, search: 'test' })

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining('/properties?size=10&search=test'),
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
    })
  })

  describe('getPropertyById', () => {
    it('should call apiGet with correct URL and tenantId header', async () => {
      vi.mocked(apiGet).mockResolvedValue({ success: true, data: {} })
      const id = 'prop-1'
      
      await getPropertyById(tenantId, id)

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining(`/properties/${id}`),
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
    })
  })

  describe('serverGetPropertyById', () => {
    it('should call serverGetPropertyById', async () => {
      vi.mocked(serverGetPropertyById).mockResolvedValue({ id: '1' } as any)
      const id = 'prop-1'

      const result = await serverGetPropertyById(tenantId, id)

      expect(serverGetPropertyById).toHaveBeenCalledWith(tenantId, id)
      expect(result).toEqual({ id: '1' })
    })
  })

  describe('getMyProperty', () => {
    it('should call apiGet with correct URL and tenantId header', async () => {
      vi.mocked(apiGet).mockResolvedValue({ success: true, data: {} })
      
      await getMyProperty(tenantId)

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining('/properties/my-property'),
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
    })
  })

  describe('createProperty', () => {
    it('should call apiPost with correct URL and tenantId header', async () => {
      vi.mocked(apiPost).mockResolvedValue({ success: true, data: {} })
      const payload = { name: 'New Prop' }
      
      await createProperty(tenantId, payload)

      expect(apiPost).toHaveBeenCalledWith(
        expect.stringContaining('/properties'),
        payload,
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
    })
  })

  describe('updateProperty', () => {
    it('should call apiPut with correct URL and tenantId header', async () => {
      vi.mocked(apiPut).mockResolvedValue({})
      const id = 'prop-1'
      const payload = { name: 'Updated Prop' }

      const result = await updateProperty(tenantId, id, payload)

      expect(apiPut).toHaveBeenCalledWith(
        expect.stringContaining(`/properties/${id}`),
        payload,
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
      expect(result.success).toBe(true)
    })

    it('should return a failure envelope when the request fails', async () => {
      vi.mocked(apiPut).mockRejectedValue(new Error('Failed'))

      const result = await updateProperty(tenantId, 'prop-1', { name: 'X' })

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Failed')
    })
  })

  describe('deleteProperty', () => {
    it('should call apiDelete with correct URL and tenantId header', async () => {
      vi.mocked(apiDelete).mockResolvedValue(undefined)
      const id = 'prop-1'
      
      await deleteProperty(tenantId, id)

      expect(apiDelete).toHaveBeenCalledWith(
        expect.stringContaining(`/properties/${id}`),
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
    })
  })

  describe('getPropertyStats', () => {
    it('should call apiGet and return mapped stats', async () => {
      const mockRawStats = {
        totalProperties: 5,
        occupiedUnits: 10,
        vacantUnits: 2,
        damagedUnits: 1,
        reservedUnits: 3
      }
      vi.mocked(apiGet).mockResolvedValue(mockRawStats)

      const result = await getPropertyStats(tenantId)

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining('/properties/stats'),
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
      expect(result.success).toBe(true)
      expect(result.data?.total).toBe(5)
      expect(result.data?.occupiedUnits).toBe(10)

      // All four statuses, not just occupied + vacant. This assertion previously
      // expected 83 (10/12), which silently dropped the damaged unit from the
      // portfolio — and would have dropped reserved ones too once they existed.
      expect(result.data?.totalUnits).toBe(16)
      expect(result.data?.vacantUnits).toBe(2)
      expect(result.data?.reservedUnits).toBe(3)
      expect(result.data?.occupancyRate).toBe(63) // 10 / 16 * 100
    })

    it('treats an absent reservedUnits as zero rather than NaN', async () => {
      // Defensive: an older backend, or a cached response, omits the new field.
      vi.mocked(apiGet).mockResolvedValue({
        totalProperties: 1,
        occupiedUnits: 1,
        vacantUnits: 1,
        damagedUnits: 0
      })

      const result = await getPropertyStats(tenantId)

      expect(result.data?.reservedUnits).toBe(0)
      expect(result.data?.totalUnits).toBe(2)
      expect(result.data?.occupancyRate).toBe(50)
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(apiGet).mockRejectedValue(new Error('Failed'))
      
      const result = await getPropertyStats(tenantId)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Failed')
    })
  })

  describe('saveDraft', () => {
    it('should call apiPost with correct URL and tenantId header', async () => {
      vi.mocked(apiPost).mockResolvedValue({ success: true, data: {} })
      const payload = { name: 'Draft Prop' }
      
      await saveDraft(tenantId, payload)

      expect(apiPost).toHaveBeenCalledWith(
        expect.stringContaining('/properties/drafts'),
        payload,
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
    })
  })

  describe('updateDraft', () => {
    it('should call apiPatch with the draft id in the URL and tenantId header', async () => {
      vi.mocked(apiPatch).mockResolvedValue({})
      const id = 'draft-1'
      const payload = { name: 'Updated Draft' }

      const result = await updateDraft(tenantId, id, payload)

      expect(apiPatch).toHaveBeenCalledWith(
        expect.stringContaining(`/properties/drafts/${id}`),
        payload,
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
      expect(result.success).toBe(true)
    })
  })

  describe('uploadPropertyImages', () => {
    it('should upload via ImageKit into the tenant property folder', async () => {
      const { uploadImages } = await import('@/lib/imagekit')
      vi.mocked(uploadImages).mockResolvedValue([
        { filePath: '/yiliora/test-tenant-id/properties/prop-1/test.jpg', url: 'https://ik.example/test.jpg', fileId: 'f1' }
      ] as any)
      const files = [new File([], 'test.jpg')]

      const result = await uploadPropertyImages(tenantId, files, 'prop-1')

      expect(uploadImages).toHaveBeenCalledWith(files, {
        folder: `/yiliora/${tenantId}/properties/prop-1`
      })
      expect(result.success).toBe(true)
      expect(result.data?.count).toBe(1)
    })

    it('should return a failure envelope when the upload fails', async () => {
      const { uploadImages } = await import('@/lib/imagekit')
      vi.mocked(uploadImages).mockRejectedValue(new Error('Upload failed'))

      const result = await uploadPropertyImages(tenantId, [new File([], 'test.jpg')])

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Upload failed')
    })
  })
})
