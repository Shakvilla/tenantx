import { useState } from 'react'

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

import UnifiedAddressField from '@/components/address/UnifiedAddressField'
import { reverseResolve, searchPlaces } from '@/lib/api/places'

/**
 * What edit mode leaves working.
 *
 * `UpdatePropertyRequest` cannot save a hand-picked region/district, which is
 * why the search is suppressed there — but it does carry `gpsCode` and the
 * coordinates. Suppressing the whole field instead of just the search left a
 * landlord able to delete a digital address with the chip's × and unable to
 * type one back: a control that can only destroy. These four are the contract
 * that keeps that from coming back.
 */
vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getPostcodeDistricts: vi.fn(async () => [
    { prefix: 'GD', regionValue: 'greater-accra', districtValue: 'adenta', sourceLabel: 'Adentan Municipal District' }
  ])
}))

vi.mock('@/lib/api/places', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/places')>()),
  searchPlaces: vi.fn(async () => ({ status: 'ok', suggestions: [] })),
  reverseResolve: vi.fn(async () => null)
}))

vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({ ref: { regions: [] } })
}))

const onPositionCaptured = vi.fn()

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

function Harness({ searchDisabled = true, disabled = false }: { searchDisabled?: boolean; disabled?: boolean }) {
  const [gpsCode, setGpsCode] = useState('')

  return (
    <>
      <UnifiedAddressField
        gpsCode={gpsCode}
        onGpsCodeChange={setGpsCode}
        onDecoded={() => {}}
        onPlaceSelected={() => {}}
        onManual={() => {}}
        onPositionCaptured={onPositionCaptured}
        onLocationPicked={() => {}}
        searchDisabled={searchDisabled}
        disabled={disabled}
      />
      <output data-testid='code'>{gpsCode}</output>
    </>
  )
}

const field = () => screen.getByRole('combobox', { name: /address/i })
const code = () => screen.getByTestId('code').textContent

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

describe('the one field with only its search suppressed', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(searchPlaces).mockClear()
    vi.mocked(reverseResolve).mockResolvedValue(null)
    onPositionCaptured.mockClear()
    grantPosition()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('never asks the geocoder', async () => {
    // The edit endpoint cannot save what a suggestion fills, so requesting
    // them spends a free community service on rows that cannot be honoured.
    render(<Harness />)
    type('East Legon')
    await settle()

    expect(searchPlaces).not.toHaveBeenCalled()
    expect(screen.queryByText('East Legon', { selector: 'p' })).toBeNull()
  })

  it('still turns a typed code into a chip', async () => {
    // gpsCode IS carried by the edit payload.
    render(<Harness />)
    type('GD-184-7915')
    await settle()

    expect(await screen.findByText('GD-184-7915', { selector: '.MuiChip-label' })).toBeTruthy()
    expect(code()).toBe('GD-184-7915')
  })

  it('still lets the chip be removed', async () => {
    render(<Harness />)
    type('GD-184-7915')
    await settle()

    fireEvent.click(await screen.findByRole('button', { name: /remove address code/i }))

    await waitFor(() => expect(code()).toBe(''))
  })

  it('still captures a position', async () => {
    // The coordinates are carried by the edit payload too, and a device fix is
    // the only source that works for a building no geocoder knows.
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /use my current location/i }))

    await waitFor(() =>
      expect(onPositionCaptured).toHaveBeenCalledWith({ latitude: 5.71, longitude: -0.166, accuracyMetres: 8 })
    )
  })

  it('offers no delete control at all when the WHOLE field is disabled', async () => {
    // The other half of the same rule: `disabled` means dead, and a live × on
    // a dead field is the destructive-only control this split exists to
    // remove. Seeded through the search-enabled path, then disabled.
    const { rerender } = render(<Harness searchDisabled disabled={false} />)

    type('GD-184-7915')
    await settle()
    await screen.findByText('GD-184-7915', { selector: '.MuiChip-label' })

    rerender(<Harness searchDisabled disabled />)

    expect(screen.queryByRole('button', { name: /remove address code/i })).toBeNull()
  })
})
