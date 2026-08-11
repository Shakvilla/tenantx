import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

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
  searchPlaces: vi.fn(async () => ({ status: 'ok', suggestions: [] })),
  reverseResolve: vi.fn()
}))

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

const field = () => screen.getByRole('combobox', { name: /address/i })

/**
 * MUI's Autocomplete resets the input back to '' on the render right after a
 * programmatic value change unless the field is already focused (it guards
 * that reset with `if (focused && !valueChange) return`). A real user always
 * focuses before typing; `fireEvent.change` alone does not.
 */
const typeCode = async (code: string) => {
  const input = field()

  fireEvent.focus(input)
  fireEvent.change(input, { target: { value: code } })

  // The commit is debounced by 400ms. Advanced on the clock rather than
  // waited out, so a loaded parallel suite cannot race it.
  await act(async () => {
    vi.advanceTimersByTime(500)
  })
}

const capture = () => fireEvent.click(screen.getByRole('button', { name: /use my current location/i }))

/** The capture arrives as a dropdown row; choosing it is what applies it. */
const pickTheLocation = async () => fireEvent.click(await screen.findByText('Adenta'))

/**
 * A landlord's digital address and their captured position are two
 * independent claims about the same property. When they disagree, something
 * real is wrong — usually a mistyped code, or a capture taken at home rather
 * than at the property. Both are worth catching, and neither claim is
 * automatically the right one.
 */
describe('digital address versus captured position', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
    grantPosition()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not ask which is right until the location is actually picked', async () => {
    // Nothing is contested until something conflicting is being applied.
    // Raising it on capture cried wolf at a landlord who was only checking.
    resolvedTo('adenta', 'Adentan Municipal')

    render(<Harness />)
    await typeCode('GE-100-0001')
    await waitFor(() => expect(state().district).toBe('ga-east'))

    capture()
    await screen.findByText('Adenta')

    expect(screen.queryByText(/which is right/i)).toBeNull()

    await pickTheLocation()

    expect(await screen.findByText(/which is right/i)).toBeTruthy()
  })

  it('asks which is right when the code and the position disagree', async () => {
    resolvedTo('adenta', 'Adentan Municipal')

    render(<Harness />)
    await typeCode('GE-100-0001')
    await waitFor(() => expect(state().district).toBe('ga-east'))

    capture()
    await pickTheLocation()

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
    await typeCode('GE-100-0001')
    await waitFor(() => expect(state().district).toBe('ga-east'))

    capture()
    await pickTheLocation()
    await screen.findByText(/which is right/i)

    expect(screen.getByRole('button', { name: /keep the code/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /use my location/i })).toBeTruthy()

    // Untouched until they choose.
    expect(state().district).toBe('ga-east')
  })

  it('switches to the resolved district when the landlord trusts their location', async () => {
    resolvedTo('adenta', 'Adentan Municipal')

    render(<Harness />)
    await typeCode('GE-100-0001')
    await waitFor(() => expect(state().district).toBe('ga-east'))

    capture()
    await pickTheLocation()
    fireEvent.click(await screen.findByRole('button', { name: /use my location/i }))

    await waitFor(() => expect(state().district).toBe('adenta'))
  })

  it('leaves the code’s district in place when the landlord trusts the code', async () => {
    resolvedTo('adenta', 'Adentan Municipal')

    render(<Harness />)
    await typeCode('GE-100-0001')
    await waitFor(() => expect(state().district).toBe('ga-east'))

    capture()
    await pickTheLocation()
    fireEvent.click(await screen.findByRole('button', { name: /keep the code/i }))

    await waitFor(() => expect(screen.queryByText(/which is right/i)).toBeNull())
    expect(state().district).toBe('ga-east')
  })

  it('says nothing when the two agree', async () => {
    resolvedTo('adenta', 'Adentan Municipal')

    render(<Harness />)
    await typeCode('GD-184-7915')
    await waitFor(() => expect(state().district).toBe('adenta'))

    capture()
    await pickTheLocation()

    // Applied without a question, because there is nothing to contest.
    await waitFor(() => expect(state().city).toBe('Adenta'))
    expect(screen.queryByText(/which is right/i)).toBeNull()
  })

  it('does not raise a conflict on an unconfident position', async () => {
    // A guess 60 km from the nearest node disagreeing with the code proves
    // nothing. Treating that as a conflict would cry wolf on every rural
    // property.
    resolvedTo('adenta', 'Adentan Municipal', false)

    render(<Harness />)
    await typeCode('GE-100-0001')
    await waitFor(() => expect(state().district).toBe('ga-east'))

    capture()

    // Still offered — a coarse starting point beats an empty form.
    expect(await screen.findByText(/nearest we know/i)).toBeTruthy()

    await pickTheLocation()

    await waitFor(() => expect(state().district).toBe('adenta'))
    expect(screen.queryByText(/which is right/i)).toBeNull()
  })

  it('stops disagreeing with a code the landlord has removed', async () => {
    // Removing the chip deliberately leaves region and district alone — they
    // may since have been confirmed by hand. But the code itself is gone, so
    // there is nothing left to contest: asking "your digital address is in Ga
    // East" about an address that is no longer on the form names a claim the
    // landlord cannot see, and chip removal makes that one click away.
    resolvedTo('adenta', 'Adentan Municipal')

    render(<Harness />)
    await typeCode('GE-100-0001')
    await waitFor(() => expect(state().district).toBe('ga-east'))

    fireEvent.click(await screen.findByRole('button', { name: /remove address code/i }))
    await waitFor(() => expect(state().gpsCode).toBe(''))

    capture()
    await pickTheLocation()

    // Applied, not questioned.
    await waitFor(() => expect(state().district).toBe('adenta'))
    expect(screen.queryByText(/which is right/i)).toBeNull()
  })

  it('offers the plain proposal when there is no code to disagree with', async () => {
    resolvedTo('adenta', 'Adentan Municipal')

    render(<Harness />)
    capture()

    expect(await screen.findByText('Adenta')).toBeTruthy()

    await pickTheLocation()

    await waitFor(() => expect(state().district).toBe('adenta'))
    expect(screen.queryByText(/which is right/i)).toBeNull()
  })
})
