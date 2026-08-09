import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import PropertyAddressFields, { type AddressValue } from '@/components/address/PropertyAddressFields'

vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getCities: vi.fn(async () => ['Adenta', 'Haatso']),
  getPostcodeDistricts: vi.fn(async () => [
    { prefix: 'GD', regionValue: 'greater-accra', districtValue: 'adenta', sourceLabel: 'Adentan Municipal District' },
    { prefix: 'GE', regionValue: 'greater-accra', districtValue: 'ga-east', sourceLabel: 'Ga East Municipal District' }
  ])
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
            { value: 'adenta', label: 'Adentan Municipal', region: 'greater-accra' },
            { value: 'ga-east', label: 'Ga East Municipal', region: 'greater-accra' }
          ]
        }
      ]
    }
  })
}))

import { reverseResolve } from '@/lib/api/places'

const grantPosition = () => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    writable: true,
    value: {
      getCurrentPosition: (ok: PositionCallback) =>
        ok({
          coords: { latitude: 5.71, longitude: -0.166, accuracy: 8 } as GeolocationCoordinates,
          timestamp: Date.now()
        } as GeolocationPosition)
    }
  })
}

const resolvedTo = (district: string, districtLabel: string, confident = true) =>
  vi.mocked(reverseResolve).mockResolvedValue({
    region: 'greater-accra',
    regionLabel: 'Greater Accra',
    district,
    districtLabel,
    city: 'Adenta',
    distanceMetres: confident ? 150 : 60000,
    confident
  })

function Harness() {
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
        onCoordinates={() => {}}
      />
      <output data-testid='state'>{JSON.stringify(value)}</output>
    </>
  )
}

const state = () => JSON.parse(screen.getByTestId('state').textContent!)
const typeCode = (code: string) =>
  fireEvent.change(screen.getByLabelText(/digital address/i), { target: { value: code } })
const capture = () => fireEvent.click(screen.getByRole('button', { name: /use my current location/i }))

/**
 * A landlord's digital address and their captured position are two
 * independent claims about the same property. When they disagree, something
 * real is wrong — usually a mistyped code, or a capture taken at home rather
 * than at the property. Both are worth catching, and neither claim is
 * automatically the right one.
 */
describe('digital address versus captured position', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    grantPosition()
  })

  it('asks which is right when the code and the position disagree', async () => {
    resolvedTo('adenta', 'Adentan Municipal')

    render(<Harness />)
    typeCode('GE-100-0001')
    await waitFor(() => expect(state().district).toBe('ga-east'))

    capture()

    // Scoped to the question itself: both district names also appear in the
    // selects, so a bare getByText matches more than one node.
    const question = await screen.findByText(/which is right/i)

    expect(question.textContent).toContain('Ga East')
    expect(question.textContent).toContain('Adentan')
  })

  it('offers both, and picks neither on the landlord’s behalf', async () => {
    // Either side can legitimately be the wrong one, so the form must not
    // quietly resolve it. A mistyped code and a capture-at-home look
    // identical from here.
    resolvedTo('adenta', 'Adentan Municipal')

    render(<Harness />)
    typeCode('GE-100-0001')
    await waitFor(() => expect(state().district).toBe('ga-east'))

    capture()
    await screen.findByText(/which is right/i)

    expect(screen.getByRole('button', { name: /keep the code/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /use my location/i })).toBeTruthy()

    // Untouched until they choose.
    expect(state().district).toBe('ga-east')
  })

  it('switches to the resolved district when the landlord trusts their location', async () => {
    resolvedTo('adenta', 'Adentan Municipal')

    render(<Harness />)
    typeCode('GE-100-0001')
    await waitFor(() => expect(state().district).toBe('ga-east'))

    capture()
    fireEvent.click(await screen.findByRole('button', { name: /use my location/i }))

    await waitFor(() => expect(state().district).toBe('adenta'))
  })

  it('leaves the code’s district in place when the landlord trusts the code', async () => {
    resolvedTo('adenta', 'Adentan Municipal')

    render(<Harness />)
    typeCode('GE-100-0001')
    await waitFor(() => expect(state().district).toBe('ga-east'))

    capture()
    fireEvent.click(await screen.findByRole('button', { name: /keep the code/i }))

    await waitFor(() => expect(screen.queryByText(/which is right/i)).toBeNull())
    expect(state().district).toBe('ga-east')
  })

  it('says nothing when the two agree', async () => {
    resolvedTo('adenta', 'Adentan Municipal')

    render(<Harness />)
    typeCode('GD-184-7915')
    await waitFor(() => expect(state().district).toBe('adenta'))

    capture()

    await waitFor(() => expect(screen.queryByRole('button', { name: /use this address/i })).toBeNull())
    expect(screen.queryByText(/which is right/i)).toBeNull()
  })

  it('does not raise a conflict on an unconfident position', async () => {
    // A guess 60 km from the nearest node disagreeing with the code proves
    // nothing. Treating that as a conflict would cry wolf on every rural
    // property.
    resolvedTo('adenta', 'Adentan Municipal', false)

    render(<Harness />)
    typeCode('GE-100-0001')
    await waitFor(() => expect(state().district).toBe('ga-east'))

    capture()

    expect(await screen.findByRole('button', { name: /use this address/i })).toBeTruthy()
    expect(screen.queryByText(/which is right/i)).toBeNull()
  })

  it('offers the plain proposal when there is no code to disagree with', async () => {
    resolvedTo('adenta', 'Adentan Municipal')

    render(<Harness />)
    capture()

    expect(await screen.findByRole('button', { name: /use this address/i })).toBeTruthy()
    expect(screen.queryByText(/which is right/i)).toBeNull()
  })
})
