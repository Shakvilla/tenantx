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
})
