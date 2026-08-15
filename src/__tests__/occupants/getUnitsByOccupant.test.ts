import { describe, it, expect, beforeEach, vi } from 'vitest'

import type * as ApiClient from '@/lib/api/client'

import { getUnitsByOccupant } from '@/lib/api/units'
import { apiGet } from '@/lib/api/client'
import type { Unit } from '@/types/property'

vi.mock('@/lib/api/client', async importOriginal => {
  const actual = await importOriginal<typeof ApiClient>()

  return {
    ...actual,
    apiGet: vi.fn()
  }
})

describe('getUnitsByOccupant', () => {
  const tenantId = 'test-tenant-id'
  const occupantId = 'occ-1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls GET /units/by-occupant/{occupantId} with the X-Tenant-ID header', async () => {
    vi.mocked(apiGet).mockResolvedValue([])

    await getUnitsByOccupant(tenantId, occupantId)

    expect(apiGet).toHaveBeenCalledWith(
      expect.stringContaining(`/units/by-occupant/${occupantId}`),
      expect.objectContaining({
        headers: { 'X-Tenant-ID': tenantId }
      })
    )
  })

  it('returns the bare array from the backend as-is', async () => {
    const units: Partial<Unit>[] = [
      { id: 'u1', unitNo: '101', rent: 1200, status: 'occupied', propertyName: 'Villa', propertyId: 'p1', currency: 'GHS' },
      { id: 'u2', unitNo: '102', rent: 900, status: 'occupied', propertyName: 'Villa', propertyId: 'p1', currency: 'GHS' }
    ]

    vi.mocked(apiGet).mockResolvedValue(units)

    const result = await getUnitsByOccupant(tenantId, occupantId)

    expect(result).toEqual(units)
  })

  it('returns an empty array when the API rejects', async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error('network error'))

    const result = await getUnitsByOccupant(tenantId, occupantId)

    expect(result).toEqual([])
  })

  it('returns an empty array when the response is not an array', async () => {
    vi.mocked(apiGet).mockResolvedValue(null as unknown as Unit[])

    const result = await getUnitsByOccupant(tenantId, occupantId)

    expect(result).toEqual([])
  })
})
