import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

import PropertyStep from '@/views/onboarding/steps/PropertyStep'

vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getPostcodeDistricts: vi.fn(async () => []),
  getCities: vi.fn(async () => ['East Legon', 'Dzorwulu'])
}))

vi.mock('@/lib/api/properties', () => ({ createProperty: vi.fn(async () => ({ success: true, data: { id: 'p1' } })) }))

vi.mock('@/lib/api/places', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/places')>()),
  searchPlaces: vi.fn(),

  // Nothing near enough to name: these tests are about what the capture
  // itself is worth, not about the reverse lookup.
  reverseResolve: vi.fn(async () => null)
}))

// Ayawaso West is the district the mocked place resolves to; Accra Metro is a
// second option so tests can exercise a hand-edit away from the picked place.
vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({
    ref: {
      propertyTypes: [{ value: 'house', label: 'House', description: '' }],
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
    },
    getDistricts: () => [
      { value: 'ayawaso-west', label: 'Ayawaso West Municipal', region: 'greater-accra' },
      { value: 'accra-metro', label: 'Accra Metropolitan', region: 'greater-accra' },
      { value: 'tema-metro', label: 'Tema Metropolitan', region: 'greater-accra' }
    ]
  })
}))

import { createProperty } from '@/lib/api/properties'
import { getCities } from '@/lib/api/reference'
import { searchPlaces } from '@/lib/api/places'

const suggestions = [
  {
    label: '23 Lagos Avenue, East Legon',
    street: '23 Lagos Avenue',
    region: 'greater-accra',
    district: 'ayawaso-west',
    city: 'East Legon',
    latitude: 5.6339009,
    longitude: -0.1727902,
    placeId: 'osm:N4951010023'
  },

  // GhanaLocationMatcher's region-wide locality fallback: district null, city
  // present. Offered alongside the one above because the first always
  // resolves a district.
  {
    label: 'Community 25, Tema',
    street: '',
    region: 'greater-accra',
    district: null,
    city: 'Community 25',
    latitude: 5.63,
    longitude: -0.17,
    placeId: 'osm:N999'
  }
]

const field = () => screen.getByRole('combobox', { name: /^address$/i })

/**
 * MUI's Autocomplete resets the input back to '' on the render right after a
 * programmatic value change unless the field is already focused. A real user
 * always focuses before typing; `fireEvent.change` alone does not.
 */
const pick = async (label: string) => {
  const input = field()

  fireEvent.focus(input)
  fireEvent.change(input, { target: { value: 'east legon' } })

  // The search is debounced by 400ms. Advanced on the clock rather than
  // waited out, so a loaded parallel suite cannot race it.
  await act(async () => {
    vi.advanceTimersByTime(500)
  })

  fireEvent.click(await screen.findByText(label))
}

const offerSuggestions = () => vi.mocked(searchPlaces).mockResolvedValue({ status: 'ok', suggestions })

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('PropertyStep address autofill', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    offerSuggestions()
  })

  it('fills the location selects from the picked address', async () => {
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    await pick('23 Lagos Avenue, East Legon')

    // A pick lands in the resolved (text) display, not the selects. Change
    // is what a real user clicks to open them and see what got filled.
    fireEvent.click(await screen.findByRole('button', { name: /change/i }))

    await waitFor(() => expect(screen.getByLabelText(/region/i).textContent).toContain('Greater Accra'))
    expect(screen.getByLabelText(/district/i).textContent).toContain('Ayawaso West Municipal')
  })

  it('sends the coordinates when the property is created', async () => {
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    await pick('23 Lagos Avenue, East Legon')
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Villa' } })
    fireEvent.mouseDown(screen.getByLabelText(/property type/i))
    fireEvent.click(await screen.findByRole('option', { name: 'House' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /save|continue/i })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: /save|continue/i }))

    await waitFor(() =>
      expect(vi.mocked(createProperty).mock.calls[0][1]).toMatchObject({
        latitude: 5.6339009,
        longitude: -0.1727902,
        placeId: 'osm:N4951010023'
      })
    )
  })

  it("drops the picked place's coordinates once the user hand-edits the district", async () => {
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    await pick('23 Lagos Avenue, East Legon')

    // A pick lands in the resolved (text) display. Reaching District to
    // hand-edit it goes through Change, same as a real user correcting it.
    fireEvent.click(await screen.findByRole('button', { name: /change/i }))

    await waitFor(() => expect(screen.getByLabelText(/district/i).textContent).toContain('Ayawaso West Municipal'))

    // The user disagrees with the geocoder's district and picks a different one
    // by hand. The coordinates/placeId describe the ORIGINAL place, not this edit.
    fireEvent.mouseDown(screen.getByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Accra Metropolitan' }))

    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Villa' } })
    fireEvent.mouseDown(screen.getByLabelText(/property type/i))
    fireEvent.click(await screen.findByRole('option', { name: 'House' }))

    // District change clears city too, so a fresh pick is needed to become valid.
    await waitFor(() => expect(screen.getByLabelText(/city/i).textContent).not.toContain('Loading'))
    fireEvent.mouseDown(screen.getByLabelText(/city/i))
    fireEvent.click(await screen.findByRole('option', { name: 'East Legon' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /save|continue/i })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: /save|continue/i }))

    await waitFor(() => expect(createProperty).toHaveBeenCalled())

    const payload = vi.mocked(createProperty).mock.calls[0][1] as any

    expect(payload.district).toBe('accra-metro')
    expect(payload.latitude).toBeUndefined()
    expect(payload.longitude).toBeUndefined()
    expect(payload.placeId).toBeUndefined()
  })

  it('preserves the autofilled city when the user picks the district afterwards', async () => {
    // describeAutofill tells the user "Please choose the district below" for
    // this shape — the district cascade must not then wipe the city it just
    // said was filled (IMPORTANT 2 of the whole-branch review).
    //
    // Tema Metropolitan is the district Community 25 actually belongs to —
    // asserting the preserved city under an unrelated district (e.g. Accra
    // Metropolitan) would pass even if the preservation logic paired the
    // city with the wrong district.
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    await pick('Community 25, Tema')

    await screen.findByText(/please choose the district below/i)

    // The city is on screen as resolved text before the selects are open at all.
    expect(screen.getByText(/Community 25/)).toBeTruthy()

    // Change is what a real user clicks to pick the still-missing district.
    fireEvent.click(await screen.findByRole('button', { name: /change/i }))
    expect(screen.getByLabelText(/city/i).textContent).toContain('Community 25')

    fireEvent.mouseDown(screen.getByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Tema Metropolitan' }))

    expect(screen.getByLabelText(/city/i).textContent).toContain('Community 25')

    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Villa' } })
    fireEvent.mouseDown(screen.getByLabelText(/property type/i))
    fireEvent.click(await screen.findByRole('option', { name: 'House' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /save|continue/i })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: /save|continue/i }))

    await waitFor(() => expect(createProperty).toHaveBeenCalled())

    const payload = vi.mocked(createProperty).mock.calls[0][1] as any

    expect(payload.district).toBe('tema-metro')
    expect(payload.address.city).toBe('Community 25')
  })

  it('preserves the autofilled city when the property name is edited before the district is chosen', async () => {
    // The finding this guards against: cityFromAutofill was reset on EVERY
    // field edit, not just address-field edits. This form lays Property Name
    // directly below the address search, so the natural top-down flow is
    // suggestion -> name -> ... -> district, and the name edit was silently
    // clearing the flag before the district pick got a chance to consume it.
    //
    // Tema Metropolitan is the district Community 25 actually belongs to —
    // asserting the preserved city under an unrelated district would pass
    // even if the preservation logic paired it with the wrong one.
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    await pick('Community 25, Tema')

    await screen.findByText(/please choose the district below/i)
    expect(screen.getByText(/Community 25/)).toBeTruthy()

    // Change is what a real user clicks to see/edit the selects; it isn't
    // itself an address-field edit, so it doesn't disturb cityFromAutofill.
    fireEvent.click(await screen.findByRole('button', { name: /change/i }))
    expect(screen.getByLabelText(/city/i).textContent).toContain('Community 25')

    // Non-address field, edited AFTER the suggestion pick and BEFORE the
    // district pick — the natural top-down order given the form layout.
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Villa' } })

    fireEvent.mouseDown(screen.getByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Tema Metropolitan' }))

    expect(screen.getByLabelText(/city/i).textContent).toContain('Community 25')

    fireEvent.mouseDown(screen.getByLabelText(/property type/i))
    fireEvent.click(await screen.findByRole('option', { name: 'House' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /save|continue/i })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: /save|continue/i }))

    await waitFor(() => expect(createProperty).toHaveBeenCalled())

    const payload = vi.mocked(createProperty).mock.calls[0][1] as any

    expect(payload.district).toBe('tema-metro')
    expect(payload.address.city).toBe('Community 25')
  })

  it('keeps the autofilled city visible when the locality fetch for its district fails', async () => {
    vi.mocked(getCities).mockRejectedValueOnce(new Error('network error'))

    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    await pick('23 Lagos Avenue, East Legon')

    await waitFor(() => expect(getCities).toHaveBeenCalledWith('ayawaso-west'))

    // The resolved view shows the city as plain text regardless of the
    // locality fetch outcome. Change is what a real user clicks to open the
    // selects and see the error/retry state underneath.
    fireEvent.click(await screen.findByRole('button', { name: /change/i }))
    await screen.findByText(/couldn.t load areas/i)

    // The fetch that would have offered "East Legon" as a City option failed,
    // but the value the place assigned is still there and must still render —
    // not fall back to a blank Select next to a note claiming it was filled.
    expect(screen.getByLabelText(/city/i).textContent).toContain('East Legon')
  })
})

describe('PropertyStep street line', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    offerSuggestions()
  })

  const fillNameAndType = async () => {
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Villa' } })
    fireEvent.mouseDown(screen.getByLabelText(/property type/i))
    fireEvent.click(await screen.findByRole('option', { name: 'House' }))
  }

  const save = async () => {
    await waitFor(() => expect(screen.getByRole('button', { name: /save|continue/i })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: /save|continue/i }))
  }

  it('sends the street the user has, never the city', async () => {
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    await pick('23 Lagos Avenue, East Legon')
    await fillNameAndType()
    await save()

    await waitFor(() =>
      expect(vi.mocked(createProperty).mock.calls[0][1].address).toMatchObject({
        street: '23 Lagos Avenue',
        city: 'East Legon'
      })
    )
  })

  it('sends no street at all rather than falling back to the city', async () => {
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    await pick('23 Lagos Avenue, East Legon')

    // Clear the autofilled street: the property genuinely has no street name,
    // which is common in Ghana. Before the street field existed this path
    // wrote the city into address_line_1, so every property's street was a
    // duplicate of its city.
    fireEvent.change(await screen.findByLabelText(/street \/ house address/i), { target: { value: '' } })
    await fillNameAndType()
    await save()

    await waitFor(() => expect(vi.mocked(createProperty)).toHaveBeenCalled())
    const address = vi.mocked(createProperty).mock.calls[0][1].address

    expect(address?.street).toBeUndefined()
    expect(address?.city).toBe('East Legon')
  })
})

describe('PropertyStep device location', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    offerSuggestions()
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      writable: true,
      value: {
        getCurrentPosition: (ok: PositionCallback) =>
          ok({
            coords: { latitude: 5.7101234, longitude: -0.1662345, accuracy: 7 } as GeolocationCoordinates,
            timestamp: Date.now()
          } as GeolocationPosition)
      }
    })
  })

  it('sends the captured position and its accuracy when the property is created', async () => {
    // The whole point of accuracy_metres: a 7m device fix and a geocoded
    // address land in the same columns, so the number is what tells them
    // apart later.
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)

    // Address first, then the device fix — the real order: find the area,
    // then pin the exact spot you are standing on. Coordinates follow the
    // last action, so capturing afterwards is what makes the device fix the
    // one that gets saved. (Picking an address after a capture replaces it,
    // which is the same rule read the other way round.)
    await pick('23 Lagos Avenue, East Legon')

    fireEvent.click(screen.getByRole('button', { name: /use my current location/i }))

    // The fix arrives as a dropdown row that states its own accuracy. Nothing
    // here is near enough to name, so it is the bare capture — the
    // coordinates were kept the moment it landed, whatever happens next.
    // Choosing it applies no address and closes the dropdown.
    fireEvent.click(await screen.findByText(/location captured · ±7 m/i))

    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Villa' } })
    fireEvent.mouseDown(screen.getByLabelText(/property type/i))
    fireEvent.click(await screen.findByRole('option', { name: 'House' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /save|continue/i })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: /save|continue/i }))

    await waitFor(() => expect(createProperty).toHaveBeenCalled())

    const payload = vi.mocked(createProperty).mock.calls[0][1] as any

    expect(payload.accuracyMetres).toBe(7)
    expect(payload.latitude).toBe(5.7101234)
    expect(payload.placeId).toBeNull()
  })
})
