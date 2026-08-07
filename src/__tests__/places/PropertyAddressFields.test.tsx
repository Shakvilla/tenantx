import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import PropertyAddressFields, { type AddressValue } from '@/components/address/PropertyAddressFields'

vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getCities: vi.fn(async () => ['East Legon', 'Dzorwulu'])
}))

vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({
    ref: {
      regions: [
        {
          value: 'greater-accra',
          label: 'Greater Accra',
          districts: [
            { value: 'ayawaso-west', label: 'Ayawaso West Municipal', region: 'greater-accra' },
            { value: 'tema-metro', label: 'Tema Metropolitan', region: 'greater-accra' }
          ]
        }
      ]
    }
  })
}))

vi.mock('@/components/address/AddressSearchField', () => ({
  default: ({ onSelect }: { onSelect: (p: any) => void }) => (
    <button
      onClick={() =>
        onSelect({
          label: '23 Lagos Avenue, East Legon',
          street: '23 Lagos Avenue',
          region: 'greater-accra',
          district: 'ayawaso-west',
          city: 'East Legon',
          latitude: 5.6339009,
          longitude: -0.1727902,
          placeId: 'osm:N4951010023'
        })
      }
    >
      pick address
    </button>
  )
}))

import { getCities } from '@/lib/api/reference'

/** Drives the component the way a form does: owns the value, applies patches. */
function Harness({ onCoords }: { onCoords?: (c: any) => void }) {
  const [value, setValue] = useState<AddressValue>({ region: '', district: '', city: '' })

  return (
    <PropertyAddressFields
      value={value}
      onChange={patch => setValue(v => ({ ...v, ...patch }))}
      onCoordinates={c => onCoords?.(c)}
    />
  )
}

describe('PropertyAddressFields', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reports the picked place to its caller', async () => {
    const onCoords = vi.fn()

    render(<Harness onCoords={onCoords} />)
    fireEvent.click(screen.getByText('pick address'))

    await waitFor(() =>
      expect(onCoords).toHaveBeenCalledWith({
        latitude: 5.6339009,
        longitude: -0.1727902,
        placeId: 'osm:N4951010023'
      })
    )
  })

  it('fetches localities for the district it was given, not before', async () => {
    render(<Harness />)
    expect(getCities).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('pick address'))
    await waitFor(() => expect(getCities).toHaveBeenCalledWith('ayawaso-west'))
  })

  it('drops the coordinates when the caller hand-edits an address field', async () => {
    const onCoords = vi.fn()

    render(<Harness onCoords={onCoords} />)
    fireEvent.click(screen.getByText('pick address'))
    await waitFor(() => expect(onCoords).toHaveBeenCalledWith(expect.objectContaining({ placeId: 'osm:N4951010023' })))

    fireEvent.mouseDown(screen.getByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Tema Metropolitan' }))

    // Coordinates describe one specific picked place. Once the address is
    // hand-edited they no longer describe what the form holds.
    await waitFor(() => expect(onCoords).toHaveBeenLastCalledWith(null))
  })

  it('keeps showing an autofilled city when its locality fetch fails', async () => {
    vi.mocked(getCities).mockRejectedValueOnce(new Error('boom'))
    render(<Harness />)
    fireEvent.click(screen.getByText('pick address'))

    // The value is correct underneath; without a fallback option MUI renders a
    // blank Select, which reads as if the pick was lost.
    expect(await screen.findByText('East Legon')).toBeTruthy()
  })

  it('disables District until a Region is chosen, then enables it', async () => {
    render(<Harness />)

    // No region yet — District has nothing to offer, so it must not open.
    expect(screen.getByLabelText(/district/i)).toHaveAttribute('aria-disabled', 'true')

    fireEvent.mouseDown(screen.getByLabelText(/region/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Greater Accra' }))

    await waitFor(() => expect(screen.getByLabelText(/district/i)).not.toHaveAttribute('aria-disabled'))
  })

  it('disables City until a District is chosen', async () => {
    render(<Harness />)

    // Neither region nor district set — City has nothing to offer.
    expect(screen.getByLabelText(/city/i)).toHaveAttribute('aria-disabled', 'true')

    fireEvent.mouseDown(screen.getByLabelText(/region/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Greater Accra' }))

    // Region alone still isn't enough — no district chosen yet.
    expect(screen.getByLabelText(/city/i)).toHaveAttribute('aria-disabled', 'true')

    fireEvent.mouseDown(screen.getByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Ayawaso West Municipal' }))

    await waitFor(() => expect(screen.getByLabelText(/city/i)).not.toHaveAttribute('aria-disabled'))
  })

  it('marks Region, District and City as required', () => {
    render(<Harness />)

    expect(document.getElementById('address-region-label')?.textContent).toContain('*')
    expect(document.getElementById('address-district-label')?.textContent).toContain('*')
    expect(document.getElementById('address-city-label')?.textContent).toContain('*')
  })
})
