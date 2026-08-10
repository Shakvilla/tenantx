import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

import UnifiedAddressField from '@/components/address/UnifiedAddressField'
import { searchPlaces, type PlaceSuggestion } from '@/lib/api/places'

vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getPostcodeDistricts: vi.fn(async () => [])
}))

vi.mock('@/lib/api/places', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/places')>()),
  searchPlaces: vi.fn()
}))

vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({
    ref: {
      regions: [
        {
          value: 'greater-accra',
          label: 'Greater Accra',
          districts: [{ value: 'ayawaso-west', label: 'Ayawaso West Municipal', region: 'greater-accra' }]
        }
      ]
    }
  })
}))

const place = (over: Partial<PlaceSuggestion> = {}): PlaceSuggestion => ({
  label: 'East Legon',
  street: null,
  region: 'greater-accra',
  district: 'ayawaso-west',
  city: 'East Legon',
  latitude: 5.63,
  longitude: -0.16,
  placeId: 'osm:N1',
  source: 'local',
  ...over
})

const onPlaceSelected = vi.fn()
const onManual = vi.fn()
const onUnavailable = vi.fn()

const renderField = () =>
  render(
    <UnifiedAddressField
      gpsCode=''
      onGpsCodeChange={() => {}}
      onDecoded={() => {}}
      onPlaceSelected={onPlaceSelected}
      onManual={onManual}
      onUnavailable={onUnavailable}
    />
  )

const field = () => screen.getByRole('combobox', { name: /address/i })

// MUI's Autocomplete resets the input back to '' on the render right after a
// programmatic value change unless the field is already focused (it guards
// that reset with `if (focused && !valueChange) return`). A real user always
// focuses the field before typing; `fireEvent.change` alone does not, so the
// focus event has to be fired explicitly for the keystroke to stick — same
// workaround as AddressSearchField.test.tsx and UnifiedAddressField.code.test.tsx.
const type = (text: string) => {
  const input = field()

  fireEvent.focus(input)
  fireEvent.change(input, { target: { value: text } })
}

const settle = async () => {
  await act(async () => {
    vi.advanceTimersByTime(500)
  })
}

describe('searching from the one field', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(searchPlaces).mockReset()
    vi.mocked(searchPlaces).mockResolvedValue({ status: 'ok', suggestions: [place()] })
    onPlaceSelected.mockClear()
    onManual.mockClear()
    onUnavailable.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('offers what the search returns', async () => {
    renderField()
    type('East Legon')
    await settle()

    expect(await screen.findByText('East Legon')).toBeTruthy()
  })

  it('names the district and region under each result', async () => {
    // Load-bearing, not decoration: the backend returns every district an
    // ambiguous locality belongs to rather than guessing, and Aboabo in
    // Tamale and Aboabo in Amansie Central are otherwise identical rows.
    renderField()
    type('East Legon')
    await settle()

    expect(await screen.findByText('Ayawaso West Municipal, Greater Accra')).toBeTruthy()
  })

  it('hands the picked place back', async () => {
    renderField()
    type('East Legon')
    await settle()

    fireEvent.click(await screen.findByText('East Legon'))

    await waitFor(() => expect(onPlaceSelected).toHaveBeenCalledWith(expect.objectContaining({ city: 'East Legon' })))
  })

  it('never sends code-shaped text to the geocoder', async () => {
    // A GPS code is not an address query, and the geocoder is a free
    // community service.
    renderField()
    type('GD-184-7915')
    await settle()

    expect(searchPlaces).not.toHaveBeenCalled()
  })

  it('waits for a pause before asking', async () => {
    renderField()
    type('Eas')
    type('East')
    type('East L')
    await settle()

    expect(searchPlaces).toHaveBeenCalledTimes(1)
  })

  it('ignores a slow answer to a query the landlord has since erased', async () => {
    // Whichever run bumped the request id last owns the options; a stale run
    // must not repopulate them.
    let release: (value: { status: 'ok'; suggestions: PlaceSuggestion[] }) => void = () => {}

    vi.mocked(searchPlaces).mockReturnValueOnce(new Promise(resolve => (release = resolve)))

    renderField()
    type('East Legon')
    await settle()
    type('')
    await settle()

    await act(async () => {
      release({ status: 'ok', suggestions: [place()] })
    })

    expect(screen.queryByText('Ayawaso West Municipal, Greater Accra')).toBeNull()
  })

  it('offers manual entry even when the search finds nothing', async () => {
    // Today a fruitless search is a dead end; the escape hatch belongs where
    // it is needed.
    vi.mocked(searchPlaces).mockResolvedValue({ status: 'ok', suggestions: [] })

    renderField()
    type('Nowhere At All')
    await settle()

    fireEvent.click(await screen.findByText(/enter the address manually/i))

    expect(onManual).toHaveBeenCalled()
  })

  it('stops asking once the geocoder says it is down', async () => {
    // It is a free community service; retrying on every keystroke is how you
    // get blocked.
    vi.mocked(searchPlaces).mockResolvedValue({ status: 'unavailable', suggestions: [] })

    renderField()
    type('East Legon')
    await settle()

    await waitFor(() => expect(onUnavailable).toHaveBeenCalled())

    type('East Legon Extension')
    await settle()

    expect(searchPlaces).toHaveBeenCalledTimes(1)
  })
})
