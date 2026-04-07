import { describe, it, expect, beforeEach, vi } from 'vitest'

import type * as ApiClient from '@/lib/api/client'

import { 
  getUnitsByProperty, 
  getAllUnits, 
  getAvailableUnits, 
  getUnitById, 
  createUnit, 
  updateUnit, 
  deleteUnit 
} from '@/lib/api/units'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api/client'

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

describe('Units Service', () => {
  const tenantId = 'test-tenant-id'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUnitsByProperty', () => {
    it('should call apiGet with correct URL and tenantId header', async () => {
      vi.mocked(apiGet).mockResolvedValue({ success: true, data: [] })
      const propertyId = 'prop-1'
      
      await getUnitsByProperty(tenantId, propertyId, { size: 10 })

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining(`/properties/${propertyId}/units?size=10`),
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
    })
  })

  describe('getAllUnits', () => {
    it('should call apiGet and handle raw array response', async () => {
      const mockUnits = [{ id: '1' }, { id: '2' }]
      vi.mocked(apiGet).mockResolvedValue(mockUnits)
      
      const result = await getAllUnits(tenantId)

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining('/units'),
        expect.objectContaining({
          headers: { 'X-Tenant-ID': tenantId }
        })
      )
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUnits)
    })

    it('should handle PaginatedResponse with data property', async () => {
      const mockResponse = { data: [{ id: '1' }], meta: { pagination: { hasNext: false } } }
      vi.mocked(apiGet).mockResolvedValue(mockResponse)
      
      const result = await getAllUnits(tenantId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse.data)
    })

    it('should handle API errors', async () => {
      vi.mocked(apiGet).mockRejectedValue(new Error('Failed'))
      
      const result = await getAllUnits(tenantId)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Failed')
    })
  })

  describe('getAvailableUnits', () => {
    it('should call apiGet with correct URL', async () => {
      vi.mocked(apiGet).mockResolvedValue({ success: true, data: [] })
      
      await getAvailableUnits(tenantId, { propertyId: 'p1' })

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining('/units/available?propertyId=p1'),
        expect.any(Object)
      )
    })
  })

  describe('getUnitById', () => {
    it('should call apiGet with correct URL', async () => {
      vi.mocked(apiGet).mockResolvedValue({ success: true, data: {} })
      const id = 'unit-1'
      
      await getUnitById(tenantId, id)

      expect(apiGet).toHaveBeenCalledWith(
        expect.stringContaining(`/units/${id}`),
        expect.any(Object)
      )
    })
  })

  describe('createUnit', () => {
    it('should call apiPost with correct URL', async () => {
      vi.mocked(apiPost).mockResolvedValue({ success: true, data: {} })
      const propertyId = 'prop-1'
      const payload = { unitNo: '101' }
      
      await createUnit(tenantId, propertyId, payload)

      expect(apiPost).toHaveBeenCalledWith(
        expect.stringContaining(`/properties/${propertyId}/units`),
        payload,
        expect.any(Object)
      )
    })
  })

  describe('updateUnit', () => {
    it('should call apiPatch with correct URL', async () => {
      vi.mocked(apiPatch).mockResolvedValue({ success: true, data: {} })
      const id = 'unit-1'
      const payload = { unitNo: '102' }
      
      await updateUnit(tenantId, id, payload)

      expect(apiPatch).toHaveBeenCalledWith(
        expect.stringContaining(`/units/${id}`),
        payload,
        expect.any(Object)
      )
    })
  })

  describe('deleteUnit', () => {
    it('should call apiDelete with correct URL', async () => {
      vi.mocked(apiDelete).mockResolvedValue(undefined)
      const id = 'unit-1'
      
      await deleteUnit(tenantId, id)

      expect(apiDelete).toHaveBeenCalledWith(
        expect.stringContaining(`/units/${id}`),
        expect.any(Object)
      )
    })
  })
})
