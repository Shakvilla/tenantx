import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/lib/api/occupants', () => ({
  createOccupant: vi.fn(),
  updateOccupant: vi.fn(),
  uploadOccupantAvatar: vi.fn()
}))

vi.mock('@/lib/api/units', () => ({
  getAllUnits: vi.fn()
}))

vi.mock('@/lib/api/storage', () => ({
  getStoredTenantId: vi.fn()
}))

import AddOccupantDialog from '@/views/occupants/AddOccupantDialog'
import { createOccupant, updateOccupant, type OccupantRecord } from '@/lib/api/occupants'
import { getAllUnits } from '@/lib/api/units'
import { getStoredTenantId } from '@/lib/api/storage'

const properties = [{ id: 'prop-1', name: 'Test Property' }]

// Pre-populated so the property/unit/move-in-date required fields are already satisfied
// via edit-mode hydration — this avoids driving MUI's Select popover (which is flaky under
// fireEvent-only interaction in happy-dom) while still exercising the exact same
// emergencyContact/top-level payload-building code path used by "add" mode.
const editData: OccupantRecord = {
  id: 'occ-1',
  tenantId: 'tenant-1',
  firstName: 'Ama',
  lastName: 'Mensah',
  email: 'ama@example.com',
  phone: '0244000000',
  status: 'active',
  propertyId: 'prop-1',
  propertyName: 'Test Property',
  unitId: 'unit-1',
  unitNo: 'A1',
  moveInDate: '2026-01-01T00:00:00.000Z',
  moveOutDate: null,
  emergencyContact: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
}

describe('AddOccupantDialog — profile field payload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getStoredTenantId).mockReturnValue('tenant-1')
    vi.mocked(getAllUnits).mockResolvedValue({ data: [{ id: 'unit-1', unitNo: 'A1' }], meta: {} } as any)
    vi.mocked(createOccupant).mockResolvedValue({ id: 'occ-1' } as any)
    vi.mocked(updateOccupant).mockResolvedValue({ id: 'occ-1' } as any)
  })

  it('sends occupation/familyMembersCount/dob as top-level fields, not inside emergencyContact', async () => {
    render(
      <AddOccupantDialog open handleClose={() => {}} mode='edit' editData={editData} properties={properties} />
    )

    // Wait for edit-mode hydration to populate the form from editData
    await waitFor(() => expect(screen.getByLabelText(/first name/i)).toHaveValue('Ama'))

    fireEvent.change(screen.getByLabelText(/occupation/i), { target: { value: 'Trader' } })
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1990-01-01' } })
    fireEvent.change(screen.getByLabelText(/family members/i), { target: { value: '4' } })

    fireEvent.click(screen.getByRole('button', { name: /update/i }))

    await waitFor(() => expect(updateOccupant).toHaveBeenCalled())

    const [, , payload] = vi.mocked(updateOccupant).mock.calls[0]

    expect(payload.occupation).toBe('Trader')
    expect(payload.dob).toBe('1990-01-01')
    expect(payload.familyMembersCount).toBe(4)
    expect(payload.emergencyContact ?? {}).not.toHaveProperty('occupation')
    expect(payload.emergencyContact ?? {}).not.toHaveProperty('dob')
    expect(payload.emergencyContact ?? {}).not.toHaveProperty('familyMembersCount')
  })
})
