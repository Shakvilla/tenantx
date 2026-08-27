import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import AddPropertyDialog from '@/views/properties/AddPropertyDialog'

// COVERAGE finding from the whole-branch review: the waiver
// (`!canWaiveCity` in validateStep) was deliberately restored after being
// removed in an earlier task, and its negative directions are covered
// (localities-on-demand.test.tsx: a failed/pending fetch must not waive
// City). Its positive direction — a district whose locality list comes back
// genuinely empty must not block the step — was not pinned at the form
// level: deleting `!canWaiveCity` from validateStep left every existing test
// green. This file exists to close that gap for AddPropertyDialog.
//
// This test file carries its own reference-data mock (with real
// propertyTypes/propertyConditions options) rather than reusing
// AddPropertyDialog.addressAutofill.test.tsx's, whose mock deliberately
// leaves those two empty and so can never fully validate step 1.

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))

vi.mock('@/lib/api/places', () => ({ searchPlaces: vi.fn(), reverseResolve: vi.fn(async () => null) }))

vi.mock('@/lib/api/reference', () => ({ getCities: vi.fn(), getPostcodeDistricts: vi.fn(async () => []) }))

vi.mock('@/lib/api/storage', () => ({ getStoredTenantId: () => 'tenant-1' }))

vi.mock('@/lib/api/properties', () => ({
  saveDraft: vi.fn(async () => ({ success: true, data: { id: 'draft-1' } })),
  updateDraft: vi.fn(async () => ({ success: true, data: { id: 'draft-1' } })),
  createProperty: vi.fn(async () => ({ success: true, data: { id: 'prop-1' } })),
  updateProperty: vi.fn(async () => ({ success: true, data: { id: 'prop-1' } })),
  uploadPropertyImages: vi.fn()
}))

vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({
    // The context now also carries what the platform allows; single-currency by
    // default, which is what these tests assume.
    policy: { multiCurrencyEnabled: false, baseCurrency: 'GHS' },
    ref: {
      propertyTypes: [{ value: 'house', label: 'House', description: '' }],
      propertyConditions: [{ value: 'good', label: 'Good', description: '' }],
      amenities: [],
      regions: [
        {
          value: 'greater-accra',
          label: 'Greater Accra',
          districts: [{ value: 'accra-metro', label: 'Accra Metropolitan', region: 'greater-accra' }]
        }
      ]
    }
  })
}))

import { getCities } from '@/lib/api/reference'

describe('AddPropertyDialog city waiver — coverage', () => {
  beforeEach(() => {
    vi.mocked(getCities).mockResolvedValue([])
  })

  afterEach(() => vi.clearAllMocks())

  it('advances past Step 1 when the chosen district has genuinely no localities, City left blank', async () => {
    render(<AddPropertyDialog open handleClose={vi.fn()} setData={vi.fn()} />)

    // No address search is used — the selects only render once the user
    // asks to enter the address by hand.
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /^address$/i }))
    fireEvent.click(await screen.findByText(/enter the address manually/i))

    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Test Property' } })

    fireEvent.mouseDown(screen.getByLabelText(/property type/i))
    fireEvent.click(await screen.findByRole('option', { name: 'House' }))

    fireEvent.mouseDown(screen.getByLabelText(/condition/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Good' }))

    fireEvent.mouseDown(screen.getByLabelText(/region/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Greater Accra' }))

    fireEvent.mouseDown(screen.getByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Accra Metropolitan' }))

    await waitFor(() => expect(getCities).toHaveBeenCalledWith('accra-metro'))

    // Wait for the locality fetch to resolve (empty list) and citiesStatus to
    // settle at 'loaded' — that's what flips onStatusChange to
    // canWaiveCity: true. Racing ahead of it would exercise a false negative,
    // not the waiver.
    await waitFor(() => expect(screen.getByLabelText(/^city/i)).not.toHaveAttribute('aria-disabled', 'true'))

    // City is deliberately left untouched — the empty-list waiver, not a
    // pick, is what must let Next through.
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 2 (Property Features) content proves validateStep(0) returned
    // true — a City error would have kept the stepper on step 1.
    await waitFor(() => expect(screen.getByLabelText(/bedrooms/i)).toBeTruthy())
    expect(screen.queryByLabelText(/^city/i)).toBeNull()
  })
})
