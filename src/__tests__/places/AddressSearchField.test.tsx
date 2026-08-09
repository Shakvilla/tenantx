import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

import AddressSearchField from '@/components/address/AddressSearchField'

vi.mock('@/lib/api/places', () => ({ searchPlaces: vi.fn() }))

import { searchPlaces } from '@/lib/api/places'

const suggestion = {
  label: '23 Lagos Avenue, East Legon, Accra',
  street: '23 Lagos Avenue',
  region: 'greater-accra',
  district: 'ayawaso-west',
  city: 'East Legon',
  latitude: 5.6339009,
  longitude: -0.1727902,
  placeId: 'osm:N4951010023'
}

const type = (value: string) => {
  // MUI's Autocomplete resets the input back to '' on the render right after a
  // programmatic value change unless the field is already focused (it guards
  // that reset with `if (focused && !valueChange) return`). A real user always
  // focuses the field before typing; `fireEvent.change` alone does not, so the
  // focus event has to be fired explicitly for the keystroke to stick.
  const input = screen.getByRole('combobox', { name: /search for an address/i })

  fireEvent.focus(input)
  fireEvent.change(input, { target: { value } })
}

describe('AddressSearchField', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(searchPlaces).mockResolvedValue({ status: 'ok', suggestions: [suggestion] })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('does not search before the third character', async () => {
    render(<AddressSearchField onSelect={vi.fn()} />)
    type('ea')
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(searchPlaces).not.toHaveBeenCalled()
  })

  it('issues one request per burst of typing, not one per keystroke', async () => {
    render(<AddressSearchField onSelect={vi.fn()} />)
    type('eas')
    type('east')
    type('east l')
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(searchPlaces).toHaveBeenCalledTimes(1)
    expect(searchPlaces).toHaveBeenCalledWith('east l')
  })

  it('hands the whole selected place to its caller', async () => {
    const onSelect = vi.fn()
    render(<AddressSearchField onSelect={onSelect} />)
    type('east legon')
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    fireEvent.click(await screen.findByText('23 Lagos Avenue, East Legon, Accra'))
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(suggestion))
  })

  it('says the search is unavailable rather than showing no matches', async () => {
    vi.mocked(searchPlaces).mockResolvedValue({ status: 'unavailable', suggestions: [] })
    render(<AddressSearchField onSelect={vi.fn()} />)
    type('east legon')
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(await screen.findByText(/address search is unavailable/i)).toBeTruthy()
  })

  it('stops querying once the search is known to be down', async () => {
    vi.mocked(searchPlaces).mockResolvedValue({ status: 'unavailable', suggestions: [] })
    render(<AddressSearchField onSelect={vi.fn()} />)
    type('east legon')
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    type('east legon road')
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    // Hammering a free community service that just failed is how you get blocked.
    expect(searchPlaces).toHaveBeenCalledTimes(1)
  })

  it('discards a stale response for a query the user has already cleared', async () => {
    let resolveSearch: (result: { status: 'ok'; suggestions: typeof suggestion[] }) => void = () => {}

    vi.mocked(searchPlaces).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveSearch = resolve
        })
    )

    render(<AddressSearchField onSelect={vi.fn()} />)
    type('east legon')
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(searchPlaces).toHaveBeenCalledTimes(1)

    // The user erases the query before the slow response ever lands.
    type('')

    // The stale response for "east legon" now resolves.
    await act(async () => {
      resolveSearch({ status: 'ok', suggestions: [suggestion] })
    })

    // It must not repopulate the dropdown with results for a query that is gone.
    expect(screen.queryByText('23 Lagos Avenue, East Legon, Accra')).not.toBeInTheDocument()
  })
})

/**
 * The backend deliberately returns every district an ambiguous locality
 * belongs to rather than guessing between them — Aboabo exists in both
 * Tamale Metropolitan and Amansie Central. That is only useful if the list
 * makes them tellable apart, so the secondary line is load-bearing here, not
 * decoration.
 */
vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({
    ref: {
      regions: [
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

const aboabo = (district: string, region: string) => ({
  label: 'Aboabo',
  street: null,
  region,
  district,
  city: 'Aboabo',
  latitude: 9.4,
  longitude: -0.84,
  // Local suggestions carry no placeId — our catalogue holds localities, not
  // buildings. Two of them must still be distinct options.
  placeId: null,
  source: 'local' as const
})

describe('AddressSearchField ambiguous localities', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(searchPlaces).mockResolvedValue({
      status: 'ok',
      suggestions: [aboabo('tamale-metro', 'northern'), aboabo('amansie-central', 'ashanti')]
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('distinguishes two same-named localities by their district and region', async () => {
    render(<AddressSearchField onSelect={vi.fn()} />)
    type('Aboabo')

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(await screen.findByText(/Tamale Metropolitan/)).toBeTruthy()
    expect(screen.getByText(/Amansie Central/)).toBeTruthy()
  })

  it('keeps both on screen as separate options despite sharing a null placeId', async () => {
    // isOptionEqualToValue compared placeId alone, which is null for every
    // local suggestion — so MUI treated every local row as the same option.
    render(<AddressSearchField onSelect={vi.fn()} />)
    type('Aboabo')

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(await screen.findAllByRole('option')).toHaveLength(2)
  })

  it('reports the district the landlord actually clicked', async () => {
    const onSelect = vi.fn()

    render(<AddressSearchField onSelect={onSelect} />)
    type('Aboabo')

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    const options = await screen.findAllByRole('option')

    fireEvent.click(options[1])

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ district: 'amansie-central' }))
  })
})
