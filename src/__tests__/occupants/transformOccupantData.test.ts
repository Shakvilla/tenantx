import { describe, it, expect } from 'vitest'
import { transformOccupantData } from '@/views/occupants/view/OccupantViewClient'
import type { OccupantRecord } from '@/lib/api/occupants'

const baseRecord: OccupantRecord = {
  id: 'occ-1',
  tenantId: 'tenant-1',
  firstName: 'Ama',
  lastName: 'Mensah',
  email: 'ama@example.com',
  phone: '0244000000',
  status: 'active',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  occupation: 'Trader',
  familyMembersCount: 4,
  previousAddress: { city: 'Tema', country: 'Ghana' },
  permanentAddress: { city: 'Takoradi', country: 'Ghana' },
  emergencyContact: { name: 'Kofi', phone: '0201111111', relationship: 'SIBLING' }
}

describe('transformOccupantData — profile fields from top-level record', () => {
  it('reads job/familyMembers/addresses from the top-level record, not emergencyContact', () => {
    const result = transformOccupantData(baseRecord, [], [], null)

    expect(result.job).toBe('Trader')
    expect(result.familyMembers).toBe(4)
    expect(result.previousAddress).toEqual({ city: 'Tema', country: 'Ghana' })
    expect(result.permanentAddress).toEqual({ city: 'Takoradi', country: 'Ghana' })
  })

  it('falls back to undefined when the record has no profile fields', () => {
    const record = { ...baseRecord, occupation: undefined, familyMembersCount: undefined,
                      previousAddress: undefined, permanentAddress: undefined }

    const result = transformOccupantData(record, [], [], null)

    expect(result.job).toBeUndefined()
    expect(result.familyMembers).toBeUndefined()
    expect(result.previousAddress).toBeUndefined()
    expect(result.permanentAddress).toBeUndefined()
  })
})
