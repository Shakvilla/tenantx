import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/lib/api/agreements', () => ({
  createAgreement: vi.fn(),
  updateAgreement: vi.fn()
}))

vi.mock('@/lib/api/properties', () => ({
  getProperties: vi.fn()
}))

vi.mock('@/lib/api/units', () => ({
  getAllUnits: vi.fn()
}))

vi.mock('@/lib/api/occupants', () => ({
  getOccupants: vi.fn()
}))

vi.mock('@/lib/api/storage', () => ({
  getStoredTenantId: vi.fn()
}))

vi.mock('@/lib/imagekit', () => ({
  uploadImage: vi.fn()
}))

import AddAgreementDialog from '@/views/agreement/AddAgreementDialog'
import { createAgreement } from '@/lib/api/agreements'
import { getProperties } from '@/lib/api/properties'
import { getAllUnits } from '@/lib/api/units'
import { getOccupants } from '@/lib/api/occupants'
import { getStoredTenantId } from '@/lib/api/storage'

describe('AddAgreementDialog — structured clauses + witness', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // vitest.config.ts sets mockReset/restoreMocks true, wiping factory return
    // values before the first test — re-establish them here in beforeEach.
    vi.mocked(createAgreement).mockResolvedValue({ id: 'agr-1' } as any)
    vi.mocked(getStoredTenantId).mockReturnValue('tenant-1')

    vi.mocked(getProperties).mockResolvedValue({
      data: [{ id: 'prop-1', name: 'Sunset Villa' }]
    } as any)

    vi.mocked(getAllUnits).mockResolvedValue({
      data: [{ id: 'unit-1', unitNo: 'A1', propertyId: 'prop-1' }]
    } as any)

    vi.mocked(getOccupants).mockResolvedValue({
      data: [{ id: 'occ-1', firstName: 'Ama', lastName: 'Mensah', propertyId: 'prop-1', propertyName: 'Sunset Villa', unitId: 'unit-1', unitNo: 'A1' }]
    } as any)
  })

  it('includes the six clause/witness fields in the create payload', async () => {
    render(<AddAgreementDialog open handleClose={() => {}} onSaved={() => {}} />)

    // Wait for reference data to finish loading (Selects render behind a Skeleton until then).
    await screen.findByLabelText(/occupant/i)

    // Property → Unit → Occupant (MUI Select: mouseDown to open, then click the option).
    fireEvent.mouseDown(screen.getByLabelText(/property/i))
    fireEvent.click(await screen.findByText('Sunset Villa'))

    fireEvent.mouseDown(screen.getByLabelText(/unit/i))
    fireEvent.click(await screen.findByText('A1'))

    fireEvent.mouseDown(screen.getByLabelText(/occupant/i))
    fireEvent.click(await screen.findByText('Ama Mensah'))

    // Required dates.
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-01-01' } })
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-12-31' } })

    // Clause checkboxes + witness/notice fields.
    fireEvent.click(screen.getByLabelText(/subletting allowed/i))
    fireEvent.click(screen.getByLabelText(/pets allowed/i))
    fireEvent.change(screen.getByLabelText(/notice period/i), { target: { value: '30' } })
    fireEvent.change(screen.getByLabelText(/witness name/i), { target: { value: 'Kwame Witness' } })

    fireEvent.click(screen.getByRole('button', { name: /save now/i }))

    await waitFor(() => expect(createAgreement).toHaveBeenCalled())
    const payload = vi.mocked(createAgreement).mock.calls[0][0]
    expect(payload.sublettingAllowed).toBe(true)
    expect(payload.petsAllowed).toBe(true)
    expect(payload.noiseRestrictionsApply).toBe(false)
    expect(payload.earlyTerminationAllowed).toBe(false)
    expect(payload.noticePeriodDays).toBe(30)
    expect(payload.witnessName).toBe('Kwame Witness')
  })
})
