import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import PropertyAddressFields, { type AddressValue } from '@/components/address/PropertyAddressFields'

vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getPostcodeDistricts: vi.fn(async () => []),
  getCities: vi.fn(async () => ['Adenta', 'Frafraha'])
}))

vi.mock('@/lib/api/places', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/places')>()),
  reverseResolve: vi.fn()
}))

vi.mock('@/components/address/AddressSearchField', () => ({ default: () => <div /> }))

vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({
    ref: {
      regions: [
        {
          value: 'greater-accra',
          label: 'Greater Accra',
          districts: [
            { value: 'adenta', label: 'Adenta Municipal', region: 'greater-accra' },
            { value: 'ga-east', label: 'Ga East Municipal', region: 'greater-accra' }
          ]
        }
      ]
    }
  })
}))

import { reverseResolve } from '@/lib/api/places'

const grantPosition = (accuracy = 8) => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    writable: true,
    value: {
      getCurrentPosition: (ok: PositionCallback) =>
        ok({
          coords: { latitude: 5.7100123, longitude: -0.1660456, accuracy } as GeolocationCoordinates,
          timestamp: Date.now()
        } as GeolocationPosition)
    }
  })
}

function Harness({ onCoords }: { onCoords?: (c: any) => void }) {
  const [value, setValue] = useState<AddressValue>({
    gpsCode: '',
    street: '',
    region: '',
    district: '',
    city: ''
  })

  return (
    <>
      <PropertyAddressFields
        value={value}
        onChange={patch => setValue(v => ({ ...v, ...patch }))}
        onCoordinates={c => onCoords?.(c)}
      />
      <output data-testid='state'>{JSON.stringify(value)}</output>
    </>
  )
}

const state = () => JSON.parse(screen.getByTestId('state').textContent!)
const capture = () => fireEvent.click(screen.getByRole('button', { name: /use my current location/i }))

const confident = {
  region: 'greater-accra',
  regionLabel: 'Greater Accra',
  district: 'adenta',
  districtLabel: 'Adenta Municipal',
  city: 'Adenta',
  distanceMetres: 120,
  confident: true
}

describe('reverse resolving a captured position', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    grantPosition()
  })

  it('offers the resolved address rather than applying it', async () => {
    // An OSM place node is a point, not a boundary. A property near a district
    // edge can sit closer to a neighbour's node than its own, so this is a
    // proposal the landlord accepts — silently filling the form would file
    // them in the wrong district with nothing on screen to reveal it.
    vi.mocked(reverseResolve).mockResolvedValue(confident)

    render(<Harness />)
    capture()

    expect(await screen.findByText(/Adenta Municipal/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /use this address/i })).toBeTruthy()

    // Nothing filled until accepted.
    expect(state().district).toBe('')
  })

  it('fills the address only once the landlord accepts it', async () => {
    vi.mocked(reverseResolve).mockResolvedValue(confident)

    render(<Harness />)
    capture()

    fireEvent.click(await screen.findByRole('button', { name: /use this address/i }))

    await waitFor(() => expect(state().district).toBe('adenta'))
    expect(state().region).toBe('greater-accra')
    expect(state().city).toBe('Adenta')
  })

  it('says how far away the guess is when it is not confident', async () => {
    // "Nearest we know" is a different claim from "where you are", and the
    // distance is what lets the landlord tell them apart.
    vi.mocked(reverseResolve).mockResolvedValue({ ...confident, distanceMetres: 42000, confident: false })

    render(<Harness />)
    capture()

    expect(await screen.findByText(/42 km|nearest/i)).toBeTruthy()
  })

  it('still offers an unconfident guess rather than discarding it', async () => {
    // A coarse starting point beats an empty form; the landlord can correct
    // one field instead of filling three.
    vi.mocked(reverseResolve).mockResolvedValue({ ...confident, distanceMetres: 42000, confident: false })

    render(<Harness />)
    capture()

    expect(await screen.findByRole('button', { name: /use this address/i })).toBeTruthy()
  })

  it('keeps the coordinates when no locality is near enough to name', async () => {
    // The capture succeeded. Failing to name the place does not un-capture
    // the position, and the coordinates are the part that matters.
    const onCoords = vi.fn()

    vi.mocked(reverseResolve).mockResolvedValue(null)

    render(<Harness onCoords={onCoords} />)
    capture()

    await waitFor(() =>
      expect(onCoords).toHaveBeenCalledWith(expect.objectContaining({ accuracyMetres: 8 }))
    )
    expect(screen.queryByRole('button', { name: /use this address/i })).toBeNull()
  })

  it('does not overwrite an address the landlord already chose', async () => {
    // Accepting is what applies it, so a form already filled stays filled
    // until they say otherwise.
    vi.mocked(reverseResolve).mockResolvedValue(confident)

    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /enter the address manually/i }))
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /region/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Greater Accra' }))
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /district/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Ga East Municipal' }))

    capture()
    await screen.findByRole('button', { name: /use this address/i })

    expect(state().district).toBe('ga-east')
  })
})
