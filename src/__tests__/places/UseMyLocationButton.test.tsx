import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import UseMyLocationButton from '@/components/address/UseMyLocationButton'

/**
 * Capturing the property's position from the landlord's device.
 *
 * Most of what is asserted here is about honesty rather than mechanics. A GPS
 * fix is 5-20m, a wifi fix 20-100m, an IP-derived fix kilometres — and they
 * arrive through the identical API. Presenting all three the same way is how a
 * guess ends up in the same column as a survey.
 */
const mockGeolocation = (impl: Partial<Geolocation>) => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    writable: true,
    value: impl
  })
}

const grants = (coords: Partial<GeolocationCoordinates>) =>
  mockGeolocation({
    getCurrentPosition: (ok: PositionCallback) =>
      ok({ coords: coords as GeolocationCoordinates, timestamp: Date.now() } as GeolocationPosition)
  })

const refuses = (code: number, message = 'nope') =>
  mockGeolocation({
    getCurrentPosition: (_ok: PositionCallback, fail?: PositionErrorCallback | null) =>
      fail?.({ code, message } as GeolocationPositionError)
  })

const click = () => fireEvent.click(screen.getByRole('button', { name: /use my current location/i }))

describe('UseMyLocationButton', () => {
  beforeEach(() => {
    grants({ latitude: 5.6339009, longitude: -0.1727902, accuracy: 8 })
  })

  afterEach(() => vi.clearAllMocks())

  it('reports the position and the accuracy it was given', async () => {
    const onCaptured = vi.fn()

    render(<UseMyLocationButton onCaptured={onCaptured} />)
    click()

    expect(await screen.findByText(/within 8 m/i)).toBeTruthy()
    expect(onCaptured).toHaveBeenCalledWith({
      latitude: 5.6339009,
      longitude: -0.1727902,
      accuracyMetres: 8
    })
  })

  it('presents a poor fix as approximate rather than as a position', async () => {
    // An IP-derived fix can be kilometres out. Rendering it identically to a
    // GPS fix is the same dishonesty as an autofill note claiming a field it
    // never filled.
    grants({ latitude: 5.6, longitude: -0.2, accuracy: 3000 })

    render(<UseMyLocationButton onCaptured={vi.fn()} />)
    click()

    expect(await screen.findByText(/approximate/i)).toBeTruthy()
  })

  it('does not call a good fix approximate', async () => {
    render(<UseMyLocationButton onCaptured={vi.fn()} />)
    click()

    expect(await screen.findByText(/within 8 m/i)).toBeTruthy()
    expect(screen.queryByText(/approximate/i)).toBeNull()
  })

  it('still reports a poor fix to its caller, marked for what it is', async () => {
    // Withholding it would be its own dishonesty — the landlord asked. The
    // accuracy travels with it so the record says how much to trust it.
    const onCaptured = vi.fn()

    grants({ latitude: 5.6, longitude: -0.2, accuracy: 3000 })
    render(<UseMyLocationButton onCaptured={onCaptured} />)
    click()

    expect(await screen.findByText(/approximate/i)).toBeTruthy()
    expect(onCaptured).toHaveBeenCalledWith(expect.objectContaining({ accuracyMetres: 3000 }))
  })

  it('explains a denied permission instead of failing silently', async () => {
    refuses(1)

    render(<UseMyLocationButton onCaptured={vi.fn()} />)
    click()

    expect(await screen.findByText(/permission/i)).toBeTruthy()
  })

  it('distinguishes a timeout from a refusal', async () => {
    // Different problems, different remedies: one is "allow it", the other is
    // "go outside and try again".
    refuses(3)

    render(<UseMyLocationButton onCaptured={vi.fn()} />)
    click()

    expect(await screen.findByText(/timed out|took too long/i)).toBeTruthy()
    expect(screen.queryByText(/permission/i)).toBeNull()
  })

  it('offers a retry after a failure', async () => {
    refuses(2)

    render(<UseMyLocationButton onCaptured={vi.fn()} />)
    click()

    expect(await screen.findByRole('button', { name: /use my current location|try again/i })).toBeTruthy()
  })

  it('renders nothing at all when the browser has no geolocation', () => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, writable: true, value: undefined })

    render(<UseMyLocationButton onCaptured={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /use my current location/i })).toBeNull()
  })

  it('asks for a fresh reading rather than accepting a cached one', () => {
    // maximumAge: 0. A cached fix from another part of town, presented as
    // "your current location", is wrong in a way nothing on screen would
    // reveal.
    const getCurrentPosition = vi.fn()

    mockGeolocation({ getCurrentPosition })
    render(<UseMyLocationButton onCaptured={vi.fn()} />)
    click()

    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true, maximumAge: 0 })
    )
  })
})
