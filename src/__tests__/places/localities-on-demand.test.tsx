import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import PropertyStep from '@/views/onboarding/steps/PropertyStep'

vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getPostcodeDistricts: vi.fn(async () => []),
  getCities: vi.fn(async () => ['Accra', 'Osu', 'Labone'])
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
    },
    getDistricts: (r: string) =>
      r === 'greater-accra' ? [{ value: 'accra-metro', label: 'Accra Metropolitan', region: 'greater-accra' }] : []
  })
}))

import { getCities } from '@/lib/api/reference'

// Picks Greater Accra / Accra Metropolitan and fills the other required fields
// so City is the only thing standing between the form and "valid".
async function fillEverythingButCity() {
  // None of these tests use the address search, so the address selects only
  // appear once the user asks to enter the address by hand — the same click
  // a real user who skips the search would make.
  fireEvent.mouseDown(screen.getByRole('combobox', { name: /^address$/i }))
  fireEvent.click(await screen.findByText(/enter the address manually/i))

  fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Test House' } })
  fireEvent.mouseDown(screen.getByLabelText(/property type/i))
  fireEvent.click(await screen.findByRole('option', { name: 'House' }))
  fireEvent.mouseDown(screen.getByLabelText(/region/i))
  fireEvent.click(await screen.findByRole('option', { name: 'Greater Accra' }))
  fireEvent.mouseDown(screen.getByLabelText(/district/i))
  fireEvent.click(await screen.findByRole('option', { name: 'Accra Metropolitan' }))
}

describe('PropertyStep localities', () => {
  beforeEach(() => vi.clearAllMocks())

  afterEach(() => {
    // Tests below override the mock's resolution/rejection; restore the
    // default so later tests in this file aren't affected by test order.
    ;(getCities as unknown as Mock).mockReset()
    ;(getCities as unknown as Mock).mockImplementation(async () => ['Accra', 'Osu', 'Labone'])
  })

  it('does not fetch localities before a district is chosen', () => {
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    expect(getCities).not.toHaveBeenCalled()
  })

  it('fetches the chosen district localities and offers them', async () => {
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)

    // No address search is used here — the selects only render once the user
    // asks to enter the address by hand.
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /^address$/i }))
    fireEvent.click(await screen.findByText(/enter the address manually/i))

    fireEvent.mouseDown(screen.getByLabelText(/region/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Greater Accra' }))
    fireEvent.mouseDown(screen.getByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Accra Metropolitan' }))

    await waitFor(() => expect(getCities).toHaveBeenCalledWith('accra-metro'))
    fireEvent.mouseDown(screen.getByLabelText(/city/i))
    expect(await screen.findByRole('option', { name: 'Osu' })).toBeTruthy()
  })

  it('keeps Save & continue disabled while the locality fetch is pending', async () => {
    let resolveFetch: (cities: string[]) => void = () => {}

    ;(getCities as unknown as Mock).mockImplementation(
      () => new Promise<string[]>(resolve => { resolveFetch = resolve })
    )

    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)

    await fillEverythingButCity()
    await waitFor(() => expect(getCities).toHaveBeenCalledWith('accra-metro'))

    // Region, district, name and type are all filled — only the pending
    // locality fetch stands between this form and "valid". An empty `cities`
    // array can't be told apart from "not loaded yet" on its own, which is
    // exactly the bug this guards against.
    expect(screen.getByRole('button', { name: /save & continue/i })).toBeDisabled()

    resolveFetch(['Accra', 'Osu', 'Labone'])
    await waitFor(() => expect(screen.getByRole('button', { name: /save & continue/i })).toBeDisabled())

    // Still disabled — the fetch resolved with real localities, so City is
    // required and none has been picked yet.
  })

  it('does not waive City after a failed locality fetch, and offers a retry', async () => {
    ;(getCities as unknown as Mock).mockRejectedValue(new Error('network error'))

    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)

    await fillEverythingButCity()
    await waitFor(() => expect(getCities).toHaveBeenCalledWith('accra-metro'))

    expect(await screen.findByText(/couldn.t load areas/i)).toBeTruthy()

    // A failed fetch must not be silently treated as "this district has no
    // localities" — City stays required and Save & continue stays disabled.
    expect(screen.getByRole('button', { name: /save & continue/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy()
  })
})
