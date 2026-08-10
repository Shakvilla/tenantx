import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

import UnifiedAddressField from '@/components/address/UnifiedAddressField'
import { reverseResolve, searchPlaces } from '@/lib/api/places'

vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getPostcodeDistricts: vi.fn(async () => [])
}))

vi.mock('@/lib/api/places', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/places')>()),
  searchPlaces: vi.fn(async () => ({ status: 'ok', suggestions: [] })),
  reverseResolve: vi.fn()
}))

vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({ ref: { regions: [] } })
}))

const resolved = {
  region: 'greater-accra',
  regionLabel: 'Greater Accra',
  district: 'la-nkwantanang-madina',
  districtLabel: 'La-Nkwantanang-Madina Municipal',
  city: 'Ashiyie',
  distanceMetres: 150,
  confident: true
}

const onPositionCaptured = vi.fn()
const onLocationPicked = vi.fn()

const grantPosition = (accuracy = 8) => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    writable: true,
    value: {
      getCurrentPosition: (ok: PositionCallback) =>
        ok({
          coords: { latitude: 5.71, longitude: -0.166, accuracy } as GeolocationCoordinates,
          timestamp: 0
        } as GeolocationPosition)
    }
  })
}

/** GeolocationPositionError codes are spec-stable numbers: 1 denied, 3 timeout. */
const refusePosition = (code: number) => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    writable: true,
    value: {
      getCurrentPosition: (_ok: PositionCallback, fail: PositionErrorCallback) =>
        fail({ code, message: '' } as GeolocationPositionError)
    }
  })
}

const renderField = () =>
  render(
    <UnifiedAddressField
      gpsCode=''
      onGpsCodeChange={() => {}}
      onDecoded={() => {}}
      onPlaceSelected={() => {}}
      onManual={() => {}}
      onPositionCaptured={onPositionCaptured}
      onLocationPicked={onLocationPicked}
    />
  )

const pin = () => screen.getByRole('button', { name: /use my current location/i })

describe('capturing a position from the one field', () => {
  beforeEach(() => {
    vi.mocked(searchPlaces).mockResolvedValue({ status: 'ok', suggestions: [] })
    vi.mocked(reverseResolve).mockReset()
    vi.mocked(reverseResolve).mockResolvedValue(resolved)
    onPositionCaptured.mockClear()
    onLocationPicked.mockClear()
    grantPosition()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not ask for a position until the pin is tapped', () => {
    // A permission prompt that appears because a dialog opened is hostile,
    // and most landlords add a property while not standing at it.
    const getCurrentPosition = vi.fn()

    Object.defineProperty(navigator, 'geolocation', { configurable: true, writable: true, value: { getCurrentPosition } })

    renderField()

    expect(getCurrentPosition).not.toHaveBeenCalled()
  })

  it('says it is working, out loud, while it waits', async () => {
    // A cold GPS lock can take fifteen seconds. A spinner alone tells a
    // screen-reader user nothing, and a form that looks inert gets tapped
    // again.
    let settle: (position: GeolocationPosition) => void = () => {}

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      writable: true,
      value: { getCurrentPosition: (ok: PositionCallback) => (settle = ok) }
    })

    renderField()
    fireEvent.click(pin())

    const status = await screen.findByRole('status')

    expect(status.textContent).toMatch(/finding you/i)

    await act(async () => {
      settle({
        coords: { latitude: 5.71, longitude: -0.166, accuracy: 8 } as GeolocationCoordinates,
        timestamp: 0
      } as GeolocationPosition)
    })

    expect(screen.queryByText(/finding you/i)).toBeNull()
  })

  it('keeps the coordinates as soon as a fix arrives', async () => {
    // The capture succeeded. Whether the landlord goes on to accept the
    // resolved place changes nothing about where the phone was.
    renderField()
    fireEvent.click(pin())

    await waitFor(() =>
      expect(onPositionCaptured).toHaveBeenCalledWith({ latitude: 5.71, longitude: -0.166, accuracyMetres: 8 })
    )
  })

  it('offers the resolved place as the top row, carrying its accuracy', async () => {
    renderField()
    fireEvent.click(pin())

    expect(await screen.findByText('Ashiyie')).toBeTruthy()
    expect(screen.getByText(/La-Nkwantanang-Madina Municipal · ±8 m/)).toBeTruthy()
  })

  it('says how far away an unconfident guess is', async () => {
    // "Nearest we know" is a different claim from "where you are", and the
    // distance is what lets the landlord tell them apart.
    vi.mocked(reverseResolve).mockResolvedValue({ ...resolved, distanceMetres: 42000, confident: false })

    renderField()
    fireEvent.click(pin())

    expect(await screen.findByText(/nearest we know · 42.0 km away/)).toBeTruthy()
  })

  it('applies nothing until the row is picked', async () => {
    // An OSM place node is a point, not a boundary, so a property near a
    // district edge can resolve to its neighbour.
    renderField()
    fireEvent.click(pin())

    await screen.findByText('Ashiyie')

    expect(onLocationPicked).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Ashiyie'))

    await waitFor(() => expect(onLocationPicked).toHaveBeenCalledWith(resolved))
  })

  it('still offers the row when no locality is near enough to name', async () => {
    vi.mocked(reverseResolve).mockResolvedValue(null)

    renderField()
    fireEvent.click(pin())

    expect(await screen.findByText(/no nearby place we know/i)).toBeTruthy()
    expect(onPositionCaptured).toHaveBeenCalled()
  })

  it('picking an unnamed capture applies no address', async () => {
    vi.mocked(reverseResolve).mockResolvedValue(null)

    renderField()
    fireEvent.click(pin())

    fireEvent.click(await screen.findByText(/location captured/i))

    expect(onLocationPicked).not.toHaveBeenCalled()
  })

  it('tells a landlord who blocked location what to do about it', async () => {
    // Three different problems with three different remedies. Collapsing them
    // into "couldn't get your location" leaves nothing to act on.
    refusePosition(1)

    renderField()
    fireEvent.click(pin())

    expect(await screen.findByText(/allow it in your browser/i)).toBeTruthy()
  })

  it('tells a landlord who timed out to go outside', async () => {
    refusePosition(3)

    renderField()
    fireEvent.click(pin())

    expect(await screen.findByText(/being outdoors usually helps/i)).toBeTruthy()
  })

  it('hides the pin where the browser has no geolocation at all', () => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, writable: true, value: undefined })

    renderField()

    expect(screen.queryByRole('button', { name: /use my current location/i })).toBeNull()
  })
})
