import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import PropertyStep from '@/views/onboarding/steps/PropertyStep'

// COVERAGE finding from the whole-branch review: the waiver
// (`|| canWaiveCity` in PropertyStep's `valid`) was deliberately restored
// after being removed in an earlier task. Its negative directions are
// covered (localities-on-demand.test.tsx: a failed/pending fetch must not
// waive City). Its positive direction — a district whose locality list
// comes back genuinely empty must not block Save & continue — was not
// pinned at the form level: deleting `|| canWaiveCity` left every existing
// test green. This file closes that gap for PropertyStep.

vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getPostcodeDistricts: vi.fn(async () => []),
  getCities: vi.fn(async () => [])
}))

vi.mock('@/lib/api/properties', () => ({
  createProperty: vi.fn(async () => ({ success: true, data: { id: 'p1' } }))
}))

vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({
    ref: {
      propertyTypes: [{ value: 'house', label: 'House', description: '' }],
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
import { createProperty } from '@/lib/api/properties'

describe('PropertyStep city waiver — coverage', () => {
  beforeEach(() => vi.clearAllMocks())

  afterEach(() => {
    vi.mocked(getCities).mockReset()
    vi.mocked(getCities).mockImplementation(async () => [])
  })

  it('enables Save & continue when the chosen district has genuinely no localities, City left blank', async () => {
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)

    // No address search is used — the selects only render once the user
    // asks to enter the address by hand.
    fireEvent.click(screen.getByRole('button', { name: /enter the address manually/i }))

    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Test House' } })
    fireEvent.mouseDown(screen.getByLabelText(/property type/i))
    fireEvent.click(await screen.findByRole('option', { name: 'House' }))
    fireEvent.mouseDown(screen.getByLabelText(/region/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Greater Accra' }))
    fireEvent.mouseDown(screen.getByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Accra Metropolitan' }))

    await waitFor(() => expect(getCities).toHaveBeenCalledWith('accra-metro'))

    // City is deliberately left untouched — the empty-list waiver, not a
    // pick, is what must enable the button.
    await waitFor(() => expect(screen.getByRole('button', { name: /save & continue/i })).toBeEnabled())

    fireEvent.click(screen.getByRole('button', { name: /save & continue/i }))

    await waitFor(() => expect(createProperty).toHaveBeenCalled())

    const payload = vi.mocked(createProperty).mock.calls[0][1] as any

    expect(payload.district).toBe('accra-metro')
    expect(payload.address.city).toBe('')
  })
})
