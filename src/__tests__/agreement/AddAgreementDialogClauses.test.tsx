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
import { createAgreement, updateAgreement } from '@/lib/api/agreements'
import { getProperties } from '@/lib/api/properties'
import { getAllUnits } from '@/lib/api/units'
import { getOccupants } from '@/lib/api/occupants'
import { getStoredTenantId } from '@/lib/api/storage'

// A legacy agreement (created before this feature) whose clause booleans are
// all null — i.e. "not discussed". Editing it without touching the clause
// controls must preserve those nulls, never coerce them to false.
const legacyAgreement = {
  id: 'agr-legacy',
  agreementNumber: 'AGR-2025-099',
  type: 'LEASE',
  status: 'ACTIVE',
  occupantId: 'occ-1',
  occupantName: 'Ama Mensah',
  propertyId: 'prop-1',
  propertyName: 'Sunset Villa',
  unitId: 'unit-1',
  unitNo: 'A1',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  signedDate: null,
  rent: 1000,
  securityDeposit: null,
  lateFee: null,
  totalAmount: null,
  currency: 'GHS',
  paymentFrequency: 'MONTHLY',
  duration: null,
  terms: null,
  conditions: null,
  renewalOptions: null,
  documentUrl: null,
  sublettingAllowed: null,
  petsAllowed: null,
  noiseRestrictionsApply: null,
  noticePeriodDays: null,
  rentDueDay: null,
  maxOccupants: null,
  earlyTerminationAllowed: null,
  witnessName: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: null
} as any

describe('AddAgreementDialog — structured clauses + witness', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // vitest.config.ts sets mockReset/restoreMocks true, wiping factory return
    // values before the first test — re-establish them here in beforeEach.
    vi.mocked(createAgreement).mockResolvedValue({ id: 'agr-1' } as any)
    vi.mocked(updateAgreement).mockResolvedValue({ id: 'agr-legacy' } as any)
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
    await screen.findByLabelText(/^occupant \*$/i)

    // Property → Unit → Occupant (MUI Select: mouseDown to open, then click the option).
    fireEvent.mouseDown(screen.getByLabelText(/property/i))
    fireEvent.click(await screen.findByText('Sunset Villa'))

    fireEvent.mouseDown(screen.getByLabelText(/unit/i))
    fireEvent.click(await screen.findByText('A1'))

    fireEvent.mouseDown(screen.getByLabelText(/^occupant \*$/i))
    fireEvent.click(await screen.findByText('Ama Mensah'))

    // Required dates.
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2026-01-01' } })
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-12-31' } })

    // Clause checkboxes + witness/notice fields.
    fireEvent.click(screen.getByLabelText(/subletting allowed/i))
    fireEvent.click(screen.getByLabelText(/pets allowed/i))
    fireEvent.change(screen.getByLabelText(/notice period/i), { target: { value: '30' } })
    fireEvent.change(screen.getByLabelText(/rent due day/i), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText(/occupants allowed/i), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/witness name/i), { target: { value: 'Kwame Witness' } })

    fireEvent.click(screen.getByRole('button', { name: /save now/i }))

    await waitFor(() => expect(createAgreement).toHaveBeenCalled())
    const payload = vi.mocked(createAgreement).mock.calls[0][0]
    expect(payload.sublettingAllowed).toBe(true)
    expect(payload.petsAllowed).toBe(true)
    // Untouched checkboxes stay null ("not discussed"), not coerced to false.
    expect(payload.noiseRestrictionsApply).toBeNull()
    expect(payload.earlyTerminationAllowed).toBeNull()
    expect(payload.noticePeriodDays).toBe(30)
    expect(payload.rentDueDay).toBe(1)
    expect(payload.maxOccupants).toBe(2)
    expect(payload.witnessName).toBe('Kwame Witness')
  })

  it('preserves null clause booleans when editing a legacy agreement without touching them', async () => {
    render(<AddAgreementDialog open handleClose={() => {}} editAgreement={legacyAgreement} onSaved={() => {}} />)

    await screen.findByLabelText(/^occupant \*$/i)

    // On edit-open the component's property-change effect clears the pre-selected
    // unit, so re-select it to satisfy validation (target the menu option by role
    // to avoid matching the selects' already-displayed values). Property, occupant
    // and dates are retained from hydration; the clause checkboxes stay untouched.
    fireEvent.mouseDown(screen.getByLabelText(/unit/i))
    fireEvent.click(await screen.findByRole('option', { name: 'A1' }))

    // Save without touching any clause checkbox — the untouched null values must
    // round-trip as null, so the backend null-guard leaves the legacy row alone.
    fireEvent.click(screen.getByRole('button', { name: /update/i }))

    await waitFor(() => expect(updateAgreement).toHaveBeenCalled())
    const payload = vi.mocked(updateAgreement).mock.calls[0][1]
    expect(payload.sublettingAllowed).toBeNull()
    expect(payload.petsAllowed).toBeNull()
    expect(payload.noiseRestrictionsApply).toBeNull()
    expect(payload.earlyTerminationAllowed).toBeNull()
    // Left blank on the form: null ("not recorded"), never 0, which the backend
    // CHECK constraint would reject outright.
    expect(payload.rentDueDay).toBeNull()
    expect(payload.maxOccupants).toBeNull()
  })
})
