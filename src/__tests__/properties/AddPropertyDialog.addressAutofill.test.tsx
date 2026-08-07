import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

import AddPropertyDialog from '@/views/properties/AddPropertyDialog'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))

vi.mock('@/lib/api/places', () => ({ searchPlaces: vi.fn() }))

vi.mock('@/lib/api/reference', () => ({ getCities: vi.fn() }))

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
    ref: {
      propertyTypes: [],
      propertyConditions: [],
      amenities: [],
      regions: [
        {
          value: 'greater-accra',
          label: 'Greater Accra',
          districts: [
            { value: 'ayawaso-west', label: 'Ayawaso West Municipal', region: 'greater-accra' },
            { value: 'accra-metro', label: 'Accra Metropolitan', region: 'greater-accra' }
          ]
        }
      ]
    }
  })
}))

import { searchPlaces } from '@/lib/api/places'
import { getCities } from '@/lib/api/reference'
import { saveDraft } from '@/lib/api/properties'

// Same shape the backend returns for a confidently-matched address — see
// src/__tests__/places/address-autofill.test.tsx.
const place = {
  label: '23 Lagos Avenue, East Legon, Accra',
  street: '23 Lagos Avenue',
  region: 'greater-accra',
  district: 'ayawaso-west',
  city: 'East Legon',
  latitude: 5.6339009,
  longitude: -0.1727902,
  placeId: 'osm:N4951010023'
}

const typeAddress = (value: string) => {
  // See AddressSearchField.test.tsx: MUI's Autocomplete needs the field
  // focused before a programmatic value change sticks.
  const input = screen.getByRole('combobox', { name: /search for an address/i })

  fireEvent.focus(input)
  fireEvent.change(input, { target: { value } })
}

async function pickPlace() {
  typeAddress('east legon')
  await act(async () => {
    vi.advanceTimersByTime(1000)
  })
  fireEvent.click(await screen.findByText(place.label))
}

describe('AddPropertyDialog address autofill', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(searchPlaces).mockResolvedValue({ status: 'ok', suggestions: [place] })
    vi.mocked(getCities).mockResolvedValue(['East Legon', 'Dzorwulu'])
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('drops the picked place\'s coordinates once the user hand-edits the district', async () => {
    render(<AddPropertyDialog open handleClose={vi.fn()} setData={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Test Property' } })

    await pickPlace()
    await waitFor(() => expect(getCities).toHaveBeenCalledWith('ayawaso-west'))

    // The user disagrees with the geocoder's district and picks a different
    // one by hand. The coordinates describe the ORIGINAL place, not this edit.
    fireEvent.mouseDown(screen.getByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Accra Metropolitan' }))
    await waitFor(() => expect(getCities).toHaveBeenCalledWith('accra-metro'))

    fireEvent.click(screen.getByRole('button', { name: /save draft/i }))

    await waitFor(() => expect(saveDraft).toHaveBeenCalled())

    const payload = vi.mocked(saveDraft).mock.calls[0][1]

    expect(payload.district).toBe('accra-metro')
    expect(payload.latitude).toBeUndefined()
    expect(payload.longitude).toBeUndefined()
    expect(payload.placeId).toBeUndefined()
  })

  it('still shows the autofilled city once the locality fetch for its district fails', async () => {
    vi.mocked(getCities).mockRejectedValue(new Error('network error'))

    render(<AddPropertyDialog open handleClose={vi.fn()} setData={vi.fn()} />)

    await pickPlace()
    await waitFor(() => expect(getCities).toHaveBeenCalledWith('ayawaso-west'))
    await screen.findByText(/couldn.t load areas/i)

    // The fetch that would have offered "East Legon" as a City option failed,
    // but the value the place assigned is still there and must still render —
    // not fall back to a blank Select next to a note claiming it was filled.
    expect(screen.getByText('East Legon')).toBeInTheDocument()
  })
})
