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
    <>
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
      <button
        onClick={() =>
          onSelect({
            label: 'MTN Service Centre, Aflao Road, Tema',
            street: 'Aflao Road',
            region: 'greater-accra',
            district: 'tema-metro',
            city: null,
            latitude: 5.68,
            longitude: 0.02,
            placeId: 'osm:N2'
          })
        }
      >
        pick address without city
      </button>
      <button
        onClick={() =>
          onSelect({
            label: 'Dzorwulu Junction, Accra',
            street: 'Dzorwulu Junction',
            region: 'greater-accra',
            district: null,
            city: 'Dzorwulu',
            latitude: 5.6,
            longitude: -0.19,
            placeId: 'osm:N3'
          })
        }
      >
        pick address without district
      </button>
    </>
  )
}))

import { getCities } from '@/lib/api/reference'

/** Drives the component the way a form does: owns the value, applies patches. */
function Harness({
  onCoords,
  onStatus,
  initialValue,
  errors
}: {
  onCoords?: (c: any) => void
  onStatus?: (s: any) => void
  initialValue?: AddressValue
  errors?: Partial<Record<keyof AddressValue, boolean>>
}) {
  const [value, setValue] = useState<AddressValue>(initialValue ?? { region: '', district: '', city: '' })

  return (
    <PropertyAddressFields
      value={value}
      onChange={patch => setValue(v => ({ ...v, ...patch }))}
      onCoordinates={c => onCoords?.(c)}
      onStatusChange={onStatus}
      errors={errors}
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

    // A pick lands in 'resolved' mode, which shows the address as text, not
    // selects. Reaching District now goes through Change — the same click a
    // real user makes to correct one field of a resolved address.
    fireEvent.click(await screen.findByRole('button', { name: /change/i }))
    fireEvent.mouseDown(await screen.findByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Tema Metropolitan' }))

    // Coordinates describe one specific picked place. Once the address is
    // hand-edited they no longer describe what the form holds.
    await waitFor(() => expect(onCoords).toHaveBeenLastCalledWith(null))
  })

  it('keeps showing an autofilled city when its locality fetch fails', async () => {
    vi.mocked(getCities).mockRejectedValueOnce(new Error('boom'))
    render(<Harness />)
    fireEvent.click(screen.getByText('pick address'))

    // The resolved view shows the city as plain text regardless of the
    // locality fetch outcome. Change is what a real user clicks to open the
    // selects and check the underlying City field.
    fireEvent.click(await screen.findByRole('button', { name: /change/i }))
    await screen.findByText(/couldn.t load areas/i)

    // The value is correct underneath; without a fallback option MUI renders a
    // blank Select, which reads as if the pick was lost.
    expect(screen.getByLabelText(/city/i).textContent).toContain('East Legon')
  })

  it('disables District until a Region is chosen, then enables it', async () => {
    render(<Harness />)

    // Nothing has been picked or typed yet, so the selects are not on screen
    // at all — a real user gets to them via the manual-entry link.
    fireEvent.click(screen.getByRole('button', { name: /enter the address manually/i }))

    // No region yet — District has nothing to offer, so it must not open.
    expect(screen.getByLabelText(/district/i)).toHaveAttribute('aria-disabled', 'true')

    fireEvent.mouseDown(screen.getByLabelText(/region/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Greater Accra' }))

    await waitFor(() => expect(screen.getByLabelText(/district/i)).not.toHaveAttribute('aria-disabled'))
  })

  it('disables City until a District is chosen', async () => {
    render(<Harness />)

    // Same as above: the selects only exist once the user has asked to enter
    // the address by hand.
    fireEvent.click(screen.getByRole('button', { name: /enter the address manually/i }))

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

    // The required asterisk lives on the selects, which only render once the
    // user has chosen to enter the address by hand.
    fireEvent.click(screen.getByRole('button', { name: /enter the address manually/i }))

    expect(document.getElementById('address-region-label')?.textContent).toContain('*')
    expect(document.getElementById('address-district-label')?.textContent).toContain('*')
    expect(document.getElementById('address-city-label')?.textContent).toContain('*')
  })
})

describe('PropertyAddressFields display modes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows only the search and a manual link before anything is picked', () => {
    render(<Harness />)

    expect(screen.getByText('pick address')).toBeTruthy()
    expect(screen.getByRole('button', { name: /enter the address manually/i })).toBeTruthy()
    expect(screen.queryByLabelText(/region/i)).toBeNull()
    expect(screen.queryByLabelText(/district/i)).toBeNull()
  })

  it('opens straight into resolved mode when mounted with an already-filled value', async () => {
    // AddPropertyDialog renders its steps through a switch, so this component
    // unmounts on every step change, not only on dialog open/close. A remount
    // with a value the user already filled in (Previous, or the stepper)
    // must not come back showing an empty search box — that hides an address
    // that is still there in `formData`, un-editable until the user notices
    // and clicks the manual link.
    render(
      <Harness initialValue={{ region: 'greater-accra', district: 'ayawaso-west', city: 'East Legon' }} />
    )

    expect(await screen.findByText(/Greater Accra/)).toBeTruthy()
    expect(screen.getByText(/Ayawaso West Municipal/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /change/i })).toBeTruthy()
    expect(screen.queryByLabelText(/region/i)).toBeNull()

    // Flush the locality fetch this value's district also triggers, so it
    // doesn't resolve after the test has already moved on.
    await waitFor(() => expect(getCities).toHaveBeenCalledWith('ayawaso-west'))
  })

  it('shows the resolved address as labels, not slugs, with no selects', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('pick address'))

    // Slugs are storage, not something to show a landlord.
    expect(await screen.findByText(/Greater Accra/)).toBeTruthy()
    expect(screen.getByText(/Ayawaso West Municipal/)).toBeTruthy()
    expect(screen.queryByText('greater-accra')).toBeNull()
    expect(screen.queryByLabelText(/region/i)).toBeNull()
  })

  it('reveals the selects prefilled when Change is clicked', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('pick address'))
    fireEvent.click(await screen.findByRole('button', { name: /change/i }))

    // Prefilled, not cleared — the user is correcting one field, not redoing all three.
    expect(await screen.findByLabelText(/region/i)).toBeTruthy()
    expect(screen.getByLabelText(/district/i).textContent).toContain('Ayawaso West Municipal')
  })

  it('reveals the selects when the manual link is used', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /enter the address manually/i }))

    expect(await screen.findByLabelText(/region/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /enter the address manually/i })).toBeNull()
  })

  it('does not return to searching once the user is entering by hand', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /enter the address manually/i }))
    await screen.findByLabelText(/region/i)

    // No path back: the search silently reclaiming hand-entered fields would
    // be worse than the clutter.
    expect(screen.queryByText('pick address')).toBeNull()
  })

  it('tells its caller when the city requirement can be waived', async () => {
    vi.mocked(getCities).mockResolvedValueOnce([])
    const onStatus = vi.fn()

    render(<Harness onStatus={onStatus} />)
    fireEvent.click(screen.getByText('pick address'))

    // A district whose locality list comes back genuinely empty must not
    // block submission on a field with nothing to choose from.
    await waitFor(() => expect(onStatus).toHaveBeenLastCalledWith({ canWaiveCity: true }))
  })
})

describe('PropertyAddressFields partial matches', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reveals only the unresolved field, keeping the rest as resolved text', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('pick address without city'))

    // Region and district resolved — asking the user to re-confirm them would
    // make a near-miss feel like a total failure.
    expect(await screen.findByText(/Greater Accra/)).toBeTruthy()
    expect(screen.getByText(/Tema Metropolitan/)).toBeTruthy()
    expect(screen.queryByLabelText(/region/i)).toBeNull()
    expect(screen.queryByLabelText(/district/i)).toBeNull()
    expect(screen.getByLabelText(/city/i)).toBeTruthy()
  })

  it('still opens all three on Change after a partial match', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('pick address without city'))
    fireEvent.click(await screen.findByRole('button', { name: /change/i }))

    expect(await screen.findByLabelText(/region/i)).toBeTruthy()
    expect(screen.getByLabelText(/district/i)).toBeTruthy()
  })

  // Task 3 left the validation-error UI (the error FormControl state and the
  // "This field is required." caption) living only inside the `manual`
  // branch. In `resolved` mode that branch never mounts, so a geocoder pick
  // that leaves district unresolved plus a click on Next (which sets
  // errors.district = true) produced a button that silently did nothing —
  // nowhere on screen named the missing field. Rendering the unresolved
  // field inline removes the cause: an error can only be set on a field
  // that is empty, and an empty field is now always on screen to carry it.
  it('shows the required-field error on an unresolved field surfaced in resolved mode', async () => {
    render(<Harness errors={{ district: true }} />)
    fireEvent.click(screen.getByText('pick address without district'))

    const districtField = await screen.findByLabelText(/district/i)

    expect(districtField).toBeTruthy()
    expect(screen.getByText(/this field is required\./i)).toBeTruthy()
  })
})
