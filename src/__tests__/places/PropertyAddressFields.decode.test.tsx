import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

import PropertyAddressFields, { type AddressValue } from '@/components/address/PropertyAddressFields'

/**
 * What PropertyAddressFields does with a decoded digital address — filling,
 * and above all RETRACTING. Migrated from the standalone digital-address
 * suite when the three controls became one: the field that emits the decode
 * changed, but this is the block's own logic and it did not.
 */
vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getCities: vi.fn(async () => ['Accra Central']),
  getPostcodeDistricts: vi.fn(async () => [
    // Mapped: the ordinary case.
    { prefix: 'GA', regionValue: 'greater-accra', districtValue: 'accra-metro', sourceLabel: 'Accra Metropolitan District' },
    // Known to the table but unmappable — Ledzokuku-Krowor became two
    // districts, so the code genuinely does not identify one of ours.
    { prefix: 'GZ', regionValue: null, districtValue: null, sourceLabel: 'Ledzokuku-Krowor Municipal District' }
  ])
}))

vi.mock('@/lib/api/places', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/places')>()),
  searchPlaces: vi.fn(async () => ({ status: 'ok', suggestions: [] })),
  reverseResolve: vi.fn(async () => null)
}))

vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({
    ref: {
      regions: [
        {
          value: 'greater-accra',
          label: 'Greater Accra',
          districts: [
            { value: 'accra-metro', label: 'Accra Metropolitan District', region: 'greater-accra' },
            { value: 'ga-east', label: 'Ga East Municipal', region: 'greater-accra' }
          ]
        }
      ]
    }
  })
}))

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
 * programmatic value change unless the field is already focused. A real user
 * always focuses before typing; `fireEvent.change` alone does not.
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

describe('PropertyAddressFields digital-address decoding', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fills region and district from a recognised prefix', async () => {
    render(<Harness />)
    await typeCode('GA-184-7915')

    await waitFor(() => expect(state().district).toBe('accra-metro'))
    expect(state().region).toBe('greater-accra')
    expect(state().gpsCode).toBe('GA-184-7915')

    // The decode lands in resolved mode, showing what it filled.
    expect(await screen.findByText(/Accra Metropolitan District/)).toBeTruthy()
  })

  it('keeps an unmappable code but fills nothing', async () => {
    render(<Harness />)
    await typeCode('GZ-100-0001')

    await waitFor(() => expect(screen.getByText(/don.t recognise/i)).toBeTruthy())
    expect(state().gpsCode).toBe('GZ-100-0001')
    expect(state().district).toBe('')
  })

  it('shows the region and district selects when a FIRST code decodes to nothing', async () => {
    // The warning says "please choose the region and district below". On a
    // fresh form there was no below: the block only left `searching` mode when
    // a previous decode had something to retract, and `searching` renders
    // nothing but the fields a failed validation has already surfaced — none,
    // here. So the landlord was asked a question with nowhere to answer it,
    // the manual-entry affordance having moved inside a dropdown they have no
    // reason to reopen.
    //
    // An unrecognised prefix chips, saves, fills nothing, and ASKS. Asking is
    // only asking if the selects are there.
    render(<Harness />)
    await typeCode('GZ-100-0001')

    await waitFor(() => expect(screen.getByText(/don.t recognise/i)).toBeTruthy())

    expect(screen.getByRole('combobox', { name: /^region$/i })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: /^district$/i })).toBeTruthy()
  })

  it('retracts a previous decode when the code is corrected to an unmappable one', async () => {
    // The live bug: typing GA-184-7915 then correcting it to GZ-100-0001 left
    // "Greater Accra › Accra Metropolitan District" on screen underneath a
    // warning saying we don't know the district — and would have saved
    // Accra Metropolitan for a Ledzokuku property. Exactly the confident
    // wrong district this feature exists to avoid.
    render(<Harness />)
    await typeCode('GA-184-7915')
    await waitFor(() => expect(state().district).toBe('accra-metro'))

    await typeCode('GZ-100-0001')

    await waitFor(() => expect(state().district).toBe(''))
    expect(state().region).toBe('')
    expect(screen.queryByText(/Accra Metropolitan District/)).toBeNull()
  })

  it('does not retract a district the landlord chose by hand', async () => {
    // Only what a decode filled may be retracted. A hand-picked district is
    // theirs, and typing a code we cannot read is no reason to discard it.
    render(<Harness />)
    await typeCode('GA-184-7915')
    await waitFor(() => expect(state().district).toBe('accra-metro'))

    fireEvent.click(await screen.findByRole('button', { name: /change/i }))
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /district/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Ga East Municipal' }))
    await waitFor(() => expect(state().district).toBe('ga-east'))

    await typeCode('GZ-100-0001')

    await waitFor(() => expect(screen.getByText(/don.t recognise/i)).toBeTruthy())
    expect(state().district).toBe('ga-east')
  })

  it('says nothing at all while the code is still incomplete', async () => {
    render(<Harness />)
    await typeCode('GA-18')

    await waitFor(() => expect(screen.queryByText(/don.t recognise/i)).toBeNull())
    expect(state().gpsCode).toBe('')
    expect(state().district).toBe('')
  })
})
