import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import PropertyAddressFields, { type AddressValue } from '@/components/address/PropertyAddressFields'

vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getPostcodeDistricts: vi.fn(async () => []),
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
  default: ({ onSelect, onUnavailable }: { onSelect: (p: any) => void; onUnavailable?: () => void }) => (
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
      <button
        onClick={() =>
          onSelect({
            label: 'East Legon, Accra',
            // The common Ghanaian case: the geocoder resolved the locality
            // but has no street name to give. GhanaLocationMatcher returns
            // null here rather than falling back to the place name, which
            // would just echo the city.
            street: null,
            region: 'greater-accra',
            district: 'ayawaso-west',
            city: 'East Legon',
            latitude: 5.63,
            longitude: -0.17,
            placeId: 'osm:N4'
          })
        }
      >
        pick address without street
      </button>
      <button
        onClick={() =>
          onSelect({
            label: 'East Legon, Ayawaso West Municipal',
            street: null,
            region: 'greater-accra',
            district: 'ayawaso-west',
            city: 'East Legon',
            // The locality centroid, and a null placeId — the signature of a
            // suggestion from our own catalogue rather than the geocoder.
            latitude: 5.6339,
            longitude: -0.1728,
            placeId: null,
            source: 'local'
          })
        }
      >
        pick local locality
      </button>
      <button onClick={() => onUnavailable?.()}>trigger unavailable</button>
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
  const [value, setValue] = useState<AddressValue>(initialValue ?? { gpsCode: '', street: '', region: '', district: '', city: '' })

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
      <Harness
        initialValue={{ gpsCode: '', street: '', region: 'greater-accra', district: 'ayawaso-west', city: 'East Legon' }}
      />
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

  // IMPORTANT 1 of the whole-branch review: `errors` was consumed only inside
  // `regionField` / `districtField` / `cityField`, which in `searching` mode
  // never mount. A user who ignores the address search and clicks Next got a
  // button that silently did nothing — validateStep set errors.region and
  // errors.district, but nothing on screen said so, and no field existed to
  // carry the highlight. The fix renders the same errored-field fallback
  // `searching` already renders for `resolved`.
  it('shows the required-field error on a field surfaced while still searching', () => {
    render(<Harness errors={{ region: true, district: true }} />)

    // The search box and manual link stay put — an error must not silently
    // force the user into manual entry.
    expect(screen.getByText('pick address')).toBeTruthy()
    expect(screen.getByRole('button', { name: /enter the address manually/i })).toBeTruthy()

    expect(screen.getByLabelText(/region/i)).toBeTruthy()
    expect(screen.getByLabelText(/district/i)).toBeTruthy()
    expect(screen.getAllByText(/this field is required\./i).length).toBe(2)
  })

  // IMPORTANT 2 of the whole-branch review: onUnavailable set mode to
  // 'manual' in the same batch AddressSearchField set its own `unavailable`
  // state, so `manual` unmounted the search before its "search is
  // unavailable" helper text ever painted. The block must carry its own note
  // forward into manual mode.
  it('shows a note that search is unavailable when the geocoder reports down', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('trigger unavailable'))

    expect(await screen.findByLabelText(/region/i)).toBeTruthy()
    expect(screen.getByText(/address search is unavailable/i)).toBeTruthy()
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

/**
 * Drives the component the way AddPropertyDialog and PropertyStep actually
 * do, not the way the plain Harness above does: `errors` is caller-owned
 * state that (a) clears a field's error the instant its patch carries a
 * non-empty value — see AddPropertyDialog's handleAddressChange — and (b) is
 * recomputed wholesale by a `validate()` a Next click runs, mirroring
 * AddPropertyDialog.validateStep's step-0 rules for the address fields.
 *
 * The plain Harness can't reproduce the fix-round-2 regression at all: its
 * `errors` prop is a static value fixed for the render, so a field surfaced
 * by an error never had anything to make it un-surface. The bug lived in the
 * interaction between PropertyAddressFields and a caller that clears errors
 * on input — this harness is that interaction, not just the passive form.
 */
function ValidatingHarness() {
  const [value, setValue] = useState<AddressValue>({ gpsCode: '', street: '', region: '', district: '', city: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof AddressValue, boolean>>>({})

  const onChange = (patch: Partial<AddressValue>) => {
    setValue(v => ({ ...v, ...patch }))

    // Same rule as AddPropertyDialog.handleAddressChange: only a key whose
    // new value is actually non-empty has its error cleared, so a Region
    // pick's patch (which cascade-clears district/city to '') does not also
    // clear District's still-unmet "required" highlight.
    setErrors(prev => ({
      ...prev,
      ...Object.fromEntries(Object.entries(patch).filter(([, v]) => Boolean(v)).map(([k]) => [k, false]))
    }))
  }

  const validate = () => {
    setErrors({
      region: !value.region,
      district: !value.district,
      // Same rule as AddPropertyDialog.validateStep: City is only required
      // once a District is chosen.
      city: Boolean(value.district) && !value.city
    })
  }

  return (
    <>
      <PropertyAddressFields value={value} onChange={onChange} onCoordinates={() => {}} errors={errors} />
      <button onClick={validate}>Next</button>
    </>
  )
}

describe('PropertyAddressFields sticky error surfacing (fix round 2)', () => {
  beforeEach(() => vi.clearAllMocks())

  // The regression: IMPORTANT 1 gated the searching-mode fallback on the
  // live `errors` value. A real caller clears a field's error the instant
  // its own patch fills it, so the field IMPORTANT 1 exists to surface
  // vanished the instant the user did what it asked — Region disappearing
  // the moment Region is picked reads as "my selection was rejected."
  it('keeps the Region select on screen after it is answered, still showing the pick', async () => {
    render(<ValidatingHarness />)

    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    const region = await screen.findByLabelText(/region/i)

    expect(region).toBeTruthy()

    fireEvent.mouseDown(region)
    fireEvent.click(await screen.findByRole('option', { name: 'Greater Accra' }))

    // The old behaviour: the Region FormControl unmounted the instant
    // errors.region cleared, and nothing else in `searching` mode took its
    // place — the screen would show no select and no "Greater Accra" text
    // anywhere, indistinguishable from never having picked at all.
    // getByRole('combobox'), not getByLabelText: MUI points the open menu's
    // listbox at the same label id as the select itself, so a label query run
    // while the menu is still mounted matches both. The passing tests above
    // only ever query after the menu has gone.
    const regionAfterPick = screen.getByRole('combobox', { name: /region/i })

    expect(regionAfterPick).toBeTruthy()
    expect(regionAfterPick.textContent).toContain('Greater Accra')
  })

  it('keeps Region and District on screen after both are answered, and surfaces City on the next validation', async () => {
    render(<ValidatingHarness />)

    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    await screen.findByLabelText(/region/i)

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /region/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Greater Accra' }))

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /district/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Ayawaso West Municipal' }))

    // Both selects remain, each showing what was picked — not the blank
    // untouched-looking screen the regression produced.
    expect(screen.getByRole('combobox', { name: /region/i }).textContent).toContain('Greater Accra')
    expect(screen.getByRole('combobox', { name: /district/i }).textContent).toContain('Ayawaso West Municipal')

    // City was never errored by the first Next (District was still empty
    // then, so AddPropertyDialog's own rule — City is required only once a
    // District is chosen — never fired), so it does not appear on its own.
    expect(screen.queryByLabelText(/^city/i)).toBeNull()

    // A second Next re-validates: District is now filled and City is not,
    // so City becomes newly errored and — per the fix — gets added to
    // surfacedFields for the first time. This is "real behaviour" here
    // rather than "the step advances" because ValidatingHarness has no
    // step to advance; it mirrors only the address-field slice of
    // AddPropertyDialog.validateStep, and by that rule Next legitimately
    // fails again (City is still required and still empty) — the same way
    // AddPropertyDialog itself would not advance past Step 1 in this state.
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    const city = await screen.findByLabelText(/^city/i)

    expect(city).toBeTruthy()
    expect(screen.getByText(/this field is required\./i)).toBeTruthy()

    // Region and District are still there too — a second validation must not
    // have un-surfaced them.
    expect(screen.getByRole('combobox', { name: /region/i }).textContent).toContain('Greater Accra')
    expect(screen.getByRole('combobox', { name: /district/i }).textContent).toContain('Ayawaso West Municipal')
  })
})

describe('PropertyAddressFields street line', () => {
  beforeEach(() => vi.clearAllMocks())

  const street = () => screen.getByLabelText(/street \/ house address/i)

  it('does not show the street input while the user is still searching', () => {
    render(<Harness />)

    // Searching mode is the search box alone. The street input appears once
    // there is an address for it to belong to.
    expect(screen.queryByLabelText(/street \/ house address/i)).toBeNull()
  })

  it('shows the street input alongside a resolved address', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('pick address'))

    expect(await screen.findByLabelText(/street \/ house address/i)).toBeTruthy()
  })

  it('shows the street input in manual mode', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /enter the address manually/i }))

    expect(street()).toBeTruthy()
  })

  it('fills the street from a place that has one', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('pick address'))

    await waitFor(() => expect((street() as HTMLInputElement).value).toBe('23 Lagos Avenue'))
  })

  it('leaves the street empty when the geocoder had none, rather than echoing the city', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('pick address without street'))

    // The whole point of the street field: the city must not end up in it.
    // This is the shape that produced address_line_1 === city for every
    // property before the field existed.
    await waitFor(() => expect((street() as HTMLInputElement).value).toBe(''))
    expect(screen.getByText(/East Legon/)).toBeTruthy()
  })

  it('keeps the coordinates when only the street is edited', async () => {
    const onCoords = vi.fn()

    render(<Harness onCoords={onCoords} />)
    fireEvent.click(screen.getByText('pick address without street'))
    await waitFor(() => expect(onCoords).toHaveBeenCalledWith(expect.objectContaining({ placeId: 'osm:N4' })))

    // The expected flow after picking a locality is to type the house number
    // the geocoder never knew. Treating that as "the address no longer
    // describes the picked place" would drop the coordinates from very
    // nearly every property saved — the geocoder rarely returns a Ghanaian
    // street.
    fireEvent.change(street(), { target: { value: 'House No. 12, Block C' } })

    await waitFor(() => expect((street() as HTMLInputElement).value).toBe('House No. 12, Block C'))
    expect(onCoords).not.toHaveBeenCalledWith(null)
  })

  it('still drops the coordinates when a locality field is edited', async () => {
    const onCoords = vi.fn()

    render(<Harness onCoords={onCoords} />)
    fireEvent.click(screen.getByText('pick address'))
    await waitFor(() => expect(onCoords).toHaveBeenCalledWith(expect.objectContaining({ placeId: 'osm:N4951010023' })))

    // The street exemption must not have widened into the other three:
    // changing the district genuinely contradicts the picked place.
    fireEvent.click(await screen.findByRole('button', { name: /change/i }))
    fireEvent.mouseDown(await screen.findByRole('combobox', { name: /district/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Tema Metropolitan' }))

    await waitFor(() => expect(onCoords).toHaveBeenLastCalledWith(null))
  })

  it('comes back in manual mode when only a street survived a remount', async () => {
    // A user who took the manual path, typed just the street, then moved to
    // the next wizard step and back. Seeding `searching` would hide the
    // street they already typed; seeding `resolved` would render an empty
    // locality line beside a lone Change button.
    render(<Harness initialValue={{ gpsCode: '', street: '9 Old Road', region: '', district: '', city: '' }} />)

    expect((street() as HTMLInputElement).value).toBe('9 Old Road')
    expect(await screen.findByRole('combobox', { name: /region/i })).toBeTruthy()
  })
})

describe('PropertyAddressFields local suggestions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not claim coordinates for a locality picked from our own catalogue', async () => {
    // Our catalogue's coordinates are the locality's centre — the middle of a
    // neighbourhood. Saving that where a building-level fix goes would be
    // indistinguishable from real precision, and every distance feature built
    // on it would inherit the lie.
    const onCoords = vi.fn()

    render(<Harness onCoords={onCoords} />)
    fireEvent.click(screen.getByText('pick local locality'))

    await waitFor(() => expect(screen.getByText(/Greater Accra/)).toBeTruthy())
    expect(onCoords).toHaveBeenCalledWith(null)
    expect(onCoords).not.toHaveBeenCalledWith(expect.objectContaining({ latitude: expect.anything() }))
  })

  it('still fills the address fields from that locality', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('pick local locality'))

    expect(await screen.findByText(/Ayawaso West Municipal/)).toBeTruthy()
  })
})
