import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import PropertyStep from '@/views/onboarding/steps/PropertyStep'

vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getCities: vi.fn(async () => ['East Legon', 'Dzorwulu'])
}))

vi.mock('@/lib/api/properties', () => ({ createProperty: vi.fn(async () => ({ success: true, data: { id: 'p1' } })) }))

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
      {/* GhanaLocationMatcher's region-wide locality fallback: district
          null, city present. Only reachable via a separate control here
          because the fixed suggestion above always resolves a district. */}
      <button
        onClick={() =>
          onSelect({
            label: 'Community 25, Tema',
            street: '',
            region: 'greater-accra',
            district: null,
            city: 'Community 25',
            latitude: 5.63,
            longitude: -0.17,
            placeId: 'osm:N999'
          })
        }
      >
        pick fallback address
      </button>
    </>
  )
}))

// Ayawaso West is the district the mocked place resolves to; Accra Metro is a
// second option so tests can exercise a hand-edit away from the picked place.
vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({
    ref: {
      propertyTypes: [{ value: 'house', label: 'House', description: '' }],
      regions: [
        {
          value: 'greater-accra',
          label: 'Greater Accra',
          districts: [
            { value: 'ayawaso-west', label: 'Ayawaso West Municipal', region: 'greater-accra' },
            { value: 'accra-metro', label: 'Accra Metropolitan', region: 'greater-accra' },
            { value: 'tema-metro', label: 'Tema Metropolitan', region: 'greater-accra' }
          ]
        }
      ]
    },
    getDistricts: () => [
      { value: 'ayawaso-west', label: 'Ayawaso West Municipal', region: 'greater-accra' },
      { value: 'accra-metro', label: 'Accra Metropolitan', region: 'greater-accra' },
      { value: 'tema-metro', label: 'Tema Metropolitan', region: 'greater-accra' }
    ]
  })
}))

import { createProperty } from '@/lib/api/properties'
import { getCities } from '@/lib/api/reference'

describe('PropertyStep address autofill', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fills the location selects from the picked address', async () => {
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    fireEvent.click(screen.getByText('pick address'))

    await waitFor(() => expect(screen.getByLabelText(/region/i).textContent).toContain('Greater Accra'))
    expect(screen.getByLabelText(/district/i).textContent).toContain('Ayawaso West Municipal')
  })

  it('sends the coordinates when the property is created', async () => {
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    fireEvent.click(screen.getByText('pick address'))
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Villa' } })
    fireEvent.mouseDown(screen.getByLabelText(/property type/i))
    fireEvent.click(await screen.findByRole('option', { name: 'House' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /save|continue/i })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: /save|continue/i }))

    await waitFor(() =>
      expect(vi.mocked(createProperty).mock.calls[0][1]).toMatchObject({
        latitude: 5.6339009,
        longitude: -0.1727902,
        placeId: 'osm:N4951010023'
      })
    )
  })

  it("drops the picked place's coordinates once the user hand-edits the district", async () => {
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    fireEvent.click(screen.getByText('pick address'))

    await waitFor(() => expect(screen.getByLabelText(/district/i).textContent).toContain('Ayawaso West Municipal'))

    // The user disagrees with the geocoder's district and picks a different one
    // by hand. The coordinates/placeId describe the ORIGINAL place, not this edit.
    fireEvent.mouseDown(screen.getByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Accra Metropolitan' }))

    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Villa' } })
    fireEvent.mouseDown(screen.getByLabelText(/property type/i))
    fireEvent.click(await screen.findByRole('option', { name: 'House' }))

    // District change clears city too, so a fresh pick is needed to become valid.
    await waitFor(() => expect(screen.getByLabelText(/city/i).textContent).not.toContain('Loading'))
    fireEvent.mouseDown(screen.getByLabelText(/city/i))
    fireEvent.click(await screen.findByRole('option', { name: 'East Legon' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /save|continue/i })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: /save|continue/i }))

    await waitFor(() => expect(createProperty).toHaveBeenCalled())

    const payload = vi.mocked(createProperty).mock.calls[0][1] as any

    expect(payload.district).toBe('accra-metro')
    expect(payload.latitude).toBeUndefined()
    expect(payload.longitude).toBeUndefined()
    expect(payload.placeId).toBeUndefined()
  })

  it('preserves the autofilled city when the user picks the district afterwards', async () => {
    // describeAutofill tells the user "Please choose the district below" for
    // this shape — the district cascade must not then wipe the city it just
    // said was filled (IMPORTANT 2 of the whole-branch review).
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    fireEvent.click(screen.getByText('pick fallback address'))

    await screen.findByText(/please choose the district below/i)
    expect(screen.getByLabelText(/city/i).textContent).toContain('Community 25')

    fireEvent.mouseDown(screen.getByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Accra Metropolitan' }))

    expect(screen.getByLabelText(/city/i).textContent).toContain('Community 25')

    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Villa' } })
    fireEvent.mouseDown(screen.getByLabelText(/property type/i))
    fireEvent.click(await screen.findByRole('option', { name: 'House' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /save|continue/i })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: /save|continue/i }))

    await waitFor(() => expect(createProperty).toHaveBeenCalled())

    const payload = vi.mocked(createProperty).mock.calls[0][1] as any

    expect(payload.district).toBe('accra-metro')
    expect(payload.address.city).toBe('Community 25')
  })

  it('preserves the autofilled city when the property name is edited before the district is chosen', async () => {
    // The finding this guards against: cityFromAutofill was reset on EVERY
    // field edit, not just address-field edits. This form lays Property Name
    // directly below the address search, so the natural top-down flow is
    // suggestion -> name -> ... -> district, and the name edit was silently
    // clearing the flag before the district pick got a chance to consume it.
    //
    // Tema Metropolitan is the district Community 25 actually belongs to —
    // asserting the preserved city under an unrelated district would pass
    // even if the preservation logic paired it with the wrong one.
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    fireEvent.click(screen.getByText('pick fallback address'))

    await screen.findByText(/please choose the district below/i)
    expect(screen.getByLabelText(/city/i).textContent).toContain('Community 25')

    // Non-address field, edited AFTER the suggestion pick and BEFORE the
    // district pick — the natural top-down order given the form layout.
    fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Villa' } })

    fireEvent.mouseDown(screen.getByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Tema Metropolitan' }))

    expect(screen.getByLabelText(/city/i).textContent).toContain('Community 25')

    fireEvent.mouseDown(screen.getByLabelText(/property type/i))
    fireEvent.click(await screen.findByRole('option', { name: 'House' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /save|continue/i })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: /save|continue/i }))

    await waitFor(() => expect(createProperty).toHaveBeenCalled())

    const payload = vi.mocked(createProperty).mock.calls[0][1] as any

    expect(payload.district).toBe('tema-metro')
    expect(payload.address.city).toBe('Community 25')
  })

  it('keeps the autofilled city visible when the locality fetch for its district fails', async () => {
    vi.mocked(getCities).mockRejectedValueOnce(new Error('network error'))

    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    fireEvent.click(screen.getByText('pick address'))

    await waitFor(() => expect(getCities).toHaveBeenCalledWith('ayawaso-west'))
    await screen.findByText(/couldn.t load areas/i)

    // The fetch that would have offered "East Legon" as a City option failed,
    // but the value the place assigned is still there and must still render —
    // not fall back to a blank Select next to a note claiming it was filled.
    expect(screen.getByLabelText(/city/i).textContent).toContain('East Legon')
  })
})
