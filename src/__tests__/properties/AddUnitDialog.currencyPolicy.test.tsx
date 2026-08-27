import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

/**
 * The currency picker is offered only when the platform supports one.
 *
 * Multi-currency was half-built: choosing USD stored a dollar price that every rent total then
 * added to cedis as though it were the same unit, and the units list rendered a cedi sign over
 * it. With the platform switch off the API now refuses a non-GHS price, so showing the control
 * would be offering a save that fails — worse than not offering it.
 */

vi.mock('@/lib/api/storage', () => ({ getStoredTenantId: () => 'tenant-1' }))
vi.mock('@/lib/api/units', () => ({ createUnit: vi.fn(), updateUnit: vi.fn(), uploadUnitImages: vi.fn() }))

const REF = {
  unitTypes: [{ value: 'single_room', label: 'Single Room' }],
  rentFrequencies: [{ value: 'monthly', label: 'Monthly' }],
  unitStatuses: [{ value: 'available', label: 'Available' }],
  amenities: []
}

let multiCurrencyEnabled = false

vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({
    ref: REF,
    policy: { multiCurrencyEnabled, baseCurrency: 'GHS' }
  })
}))

import AddUnitDialog from '@/views/properties/AddUnitDialog'

const properties = [{ id: 'p1', name: 'Adenta Compound' }] as any

describe('AddUnitDialog — currency is a platform decision', () => {
  beforeEach(() => {
    multiCurrencyEnabled = false
  })

  it('hides the currency picker while the platform is single-currency', async () => {
    render(<AddUnitDialog open handleClose={vi.fn()} properties={properties} />)

    await waitFor(() => expect(screen.getByPlaceholderText('e.g., Unit 101')).toBeTruthy())

    // The rent field is still there — it is the currency CHOICE that goes, not the price.
    expect(screen.getByPlaceholderText('e.g., 1200')).toBeTruthy()
    expect(screen.queryByLabelText(/currency/i)).toBeNull()
  })

  it('offers it once the platform enables multiple currencies', async () => {
    multiCurrencyEnabled = true

    render(<AddUnitDialog open handleClose={vi.fn()} properties={properties} />)

    await waitFor(() => expect(screen.getByLabelText(/currency/i)).toBeTruthy())
  })
})
