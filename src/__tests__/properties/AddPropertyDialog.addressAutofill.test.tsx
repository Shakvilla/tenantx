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
            { value: 'accra-metro', label: 'Accra Metropolitan', region: 'greater-accra' },
            { value: 'tema-metro', label: 'Tema Metropolitan', region: 'greater-accra' }
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

  it('preserves the autofilled city when the user picks the district afterwards', async () => {
    // GhanaLocationMatcher's region-wide locality fallback: district null,
    // city present. describeAutofill tells the user "Please choose the
    // district below" — the district cascade must not then wipe the city it
    // just said was filled (IMPORTANT 2 of the whole-branch review).
    //
    // The district chosen here (Tema Metropolitan) is the district Community
    // 25 actually belongs to — asserting the preserved city under a district
    // it has no relationship to (e.g. Accra Metropolitan) would pass even if
    // the preservation logic paired the city with the wrong district.
    const fallbackPlace = {
      label: 'Community 25, Tema',
      street: '',
      region: 'greater-accra',
      district: null,
      city: 'Community 25',
      latitude: 5.63,
      longitude: -0.17,
      placeId: 'osm:N999'
    }

    vi.mocked(searchPlaces).mockResolvedValue({ status: 'ok', suggestions: [fallbackPlace] })
    vi.mocked(getCities).mockResolvedValue(['Community 25', 'Community 1'])

    render(<AddPropertyDialog open handleClose={vi.fn()} setData={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Test Property' } })

    typeAddress('community 25')
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    fireEvent.click(await screen.findByText(fallbackPlace.label))

    expect(await screen.findByText(/please choose the district below/i)).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Tema Metropolitan' }))
    await waitFor(() => expect(getCities).toHaveBeenCalledWith('tema-metro'))

    fireEvent.click(screen.getByRole('button', { name: /save draft/i }))

    await waitFor(() => expect(saveDraft).toHaveBeenCalled())

    const payload = vi.mocked(saveDraft).mock.calls[0][1]

    expect(payload.district).toBe('tema-metro')
    expect(payload.address?.city).toBe('Community 25')
  })

  it('preserves the autofilled city when a non-address field is edited before the district is chosen', async () => {
    // The finding this guards against: cityFromAutofill was reset on EVERY
    // field edit, not just address-field edits. Both forms lay the address
    // search above Property Name, so the natural top-down flow is
    // suggestion -> name -> ... -> district, and the name edit was silently
    // clearing the flag before the district pick ever got to consume it —
    // wiping the city the autofill note had just told the user was filled.
    const fallbackPlace = {
      label: 'Community 25, Tema',
      street: '',
      region: 'greater-accra',
      district: null,
      city: 'Community 25',
      latitude: 5.63,
      longitude: -0.17,
      placeId: 'osm:N999'
    }

    vi.mocked(searchPlaces).mockResolvedValue({ status: 'ok', suggestions: [fallbackPlace] })
    vi.mocked(getCities).mockResolvedValue(['Community 25', 'Community 1'])

    render(<AddPropertyDialog open handleClose={vi.fn()} setData={vi.fn()} />)

    typeAddress('community 25')
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    fireEvent.click(await screen.findByText(fallbackPlace.label))

    expect(await screen.findByText(/please choose the district below/i)).toBeInTheDocument()

    // Non-address field, edited AFTER the suggestion pick and BEFORE the
    // district pick — the natural top-down order given the form layout.
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Test Property' } })

    fireEvent.mouseDown(screen.getByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Tema Metropolitan' }))
    await waitFor(() => expect(getCities).toHaveBeenCalledWith('tema-metro'))

    fireEvent.click(screen.getByRole('button', { name: /save draft/i }))

    await waitFor(() => expect(saveDraft).toHaveBeenCalled())

    const payload = vi.mocked(saveDraft).mock.calls[0][1]

    expect(payload.district).toBe('tema-metro')
    expect(payload.address?.city).toBe('Community 25')
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
