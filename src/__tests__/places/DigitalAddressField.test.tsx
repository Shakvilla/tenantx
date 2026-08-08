import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import PropertyAddressFields, { type AddressValue } from '@/components/address/PropertyAddressFields'

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

vi.mock('@/components/address/AddressSearchField', () => ({ default: () => <div /> }))

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
const codeField = () => screen.getByLabelText(/digital address/i)

describe('DigitalAddressField', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fills region and district from a recognised prefix', async () => {
    render(<Harness />)
    fireEvent.change(codeField(), { target: { value: 'GA-184-7915' } })

    await waitFor(() => expect(state().district).toBe('accra-metro'))
    expect(state().region).toBe('greater-accra')
    expect(await screen.findByText(/filled region and district/i)).toBeTruthy()
  })

  it('keeps an unmappable code but fills nothing', async () => {
    render(<Harness />)
    fireEvent.change(codeField(), { target: { value: 'GZ-100-0001' } })

    await waitFor(() => expect(screen.getByText(/don.t recognise that code/i)).toBeTruthy())
    expect(state().gpsCode).toBe('GZ-100-0001')
    expect(state().district).toBe('')
  })

  it('retracts a previous decode when the code is corrected to an unmappable one', async () => {
    // The live bug: typing GA-184-7915 then correcting it to GZ-100-0001 left
    // "Greater Accra › Accra Metropolitan District" on screen underneath a
    // warning saying we don't know the district — and would have saved
    // Accra Metropolitan for a Ledzokuku property. Exactly the confident
    // wrong district this feature exists to avoid.
    render(<Harness />)
    fireEvent.change(codeField(), { target: { value: 'GA-184-7915' } })
    await waitFor(() => expect(state().district).toBe('accra-metro'))

    fireEvent.change(codeField(), { target: { value: 'GZ-100-0001' } })

    await waitFor(() => expect(state().district).toBe(''))
    expect(state().region).toBe('')
    expect(screen.queryByText(/Accra Metropolitan District/)).toBeNull()
  })

  it('does not retract a district the landlord chose by hand', async () => {
    // Only what a decode filled may be retracted. A hand-picked district is
    // theirs, and typing a code we cannot read is no reason to discard it.
    render(<Harness />)
    fireEvent.change(codeField(), { target: { value: 'GA-184-7915' } })
    await waitFor(() => expect(state().district).toBe('accra-metro'))

    fireEvent.click(await screen.findByRole('button', { name: /change/i }))
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /district/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Ga East Municipal' }))
    await waitFor(() => expect(state().district).toBe('ga-east'))

    fireEvent.change(codeField(), { target: { value: 'GZ-100-0001' } })

    await waitFor(() => expect(screen.getByText(/don.t recognise that code/i)).toBeTruthy())
    expect(state().district).toBe('ga-east')
  })

  it('says nothing at all while the code is still incomplete', async () => {
    render(<Harness />)
    fireEvent.change(codeField(), { target: { value: 'GA-18' } })

    await waitFor(() => expect(screen.queryByText(/filled region/i)).toBeNull())
    expect(screen.queryByText(/don.t recognise/i)).toBeNull()
    expect(state().district).toBe('')
  })
})
