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
    // The context now also carries what the platform allows; single-currency by
    // default, which is what these tests assume.
    policy: { multiCurrencyEnabled: false, baseCurrency: 'GHS' },
    ref: {
      regions: [
        {
          value: 'greater-accra',
          label: 'Greater Accra',
          districts: [{ value: 'ayawaso-west', label: 'Ayawaso West Municipal', region: 'greater-accra' }]
        },
        {
          value: 'northern',
          label: 'Northern',
          districts: [{ value: 'tamale-metro', label: 'Tamale Metropolitan', region: 'northern' }]
        },
        {
          value: 'ashanti',
          label: 'Ashanti',
          districts: [{ value: 'amansie-central', label: 'Amansie Central District', region: 'ashanti' }]
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
const onPositionCaptured = vi.fn()
const onLocationPicked = vi.fn()

const renderField = () =>
  render(
    <UnifiedAddressField
      gpsCode=''
      onGpsCodeChange={() => {}}
      onDecoded={() => {}}
      onPlaceSelected={onPlaceSelected}
      onManual={onManual}
      onUnavailable={onUnavailable}
      onPositionCaptured={onPositionCaptured}
      onLocationPicked={onLocationPicked}
    />
  )

const field = () => screen.getByRole('combobox', { name: /address/i })

// MUI's Autocomplete resets the input back to '' on the render right after a
// programmatic value change unless the field is already focused (it guards
// that reset with `if (focused && !valueChange) return`). A real user always
// focuses the field before typing; `fireEvent.change` alone does not, so the
// focus event has to be fired explicitly for the keystroke to stick — same
// workaround as UnifiedAddressField.code.test.tsx.
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

  // Migrated from the standalone search field's suite, which this one absorbed.
  it('does not search before the third character', async () => {
    // Two letters match half of Accra. The geocoder is a free community
    // service and a query that cannot be useful is one not worth making.
    renderField()
    type('ea')
    await settle()

    expect(searchPlaces).not.toHaveBeenCalled()
  })

  it('sends the query with its surrounding whitespace trimmed', async () => {
    renderField()
    type('  East Legon  ')
    await settle()

    expect(searchPlaces).toHaveBeenCalledWith('East Legon')
  })

  it('waits for a pause before asking', async () => {
    renderField()
    type('Eas')
    type('East')
    type('East L')
    await settle()

    expect(searchPlaces).toHaveBeenCalledTimes(1)

    // One request, and it is the query the landlord finished on. Counting
    // alone would be satisfied by a burst that sent the FIRST keystroke's
    // query and dropped the rest — the same one request, for two letters of a
    // word the landlord went on to finish.
    expect(searchPlaces).toHaveBeenCalledWith('East L')
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

/**
 * The backend deliberately returns every district an ambiguous locality
 * belongs to rather than guessing between them — Aboabo exists in both
 * Tamale Metropolitan and Amansie Central. That is only useful if the list
 * makes them tellable apart, so the secondary line is load-bearing here, not
 * decoration. Migrated from the standalone search field's suite.
 */
const aboabo = (district: string, region: string): PlaceSuggestion => ({
  label: 'Aboabo',
  street: null,
  region,
  district,
  city: 'Aboabo',
  latitude: 9.4,
  longitude: -0.84,
  // Local suggestions carry no placeId — our catalogue holds localities, not
  // buildings. Two of them must still be distinct rows.
  placeId: null,
  source: 'local'
})

describe('ambiguous localities in the one field', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(searchPlaces).mockReset()
    vi.mocked(searchPlaces).mockResolvedValue({
      status: 'ok',
      suggestions: [aboabo('tamale-metro', 'northern'), aboabo('amansie-central', 'ashanti')]
    })
    onPlaceSelected.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('distinguishes two same-named localities by their district and region', async () => {
    renderField()
    type('Aboabo')
    await settle()

    expect(await screen.findByText('Tamale Metropolitan, Northern')).toBeTruthy()
    expect(screen.getByText('Amansie Central District, Ashanti')).toBeTruthy()
  })

  it('keeps both on screen as separate rows despite sharing a null placeId', async () => {
    renderField()
    type('Aboabo')
    await settle()

    // Two localities plus the manual-entry row that always sits at the end.
    const options = await screen.findAllByRole('option')

    expect(options.filter(option => option.textContent?.startsWith('Aboabo'))).toHaveLength(2)
  })

  it('reports the district the landlord actually clicked', async () => {
    renderField()
    type('Aboabo')
    await settle()

    fireEvent.click(await screen.findByText('Amansie Central District, Ashanti'))

    expect(onPlaceSelected).toHaveBeenCalledWith(expect.objectContaining({ district: 'amansie-central' }))
  })
})
