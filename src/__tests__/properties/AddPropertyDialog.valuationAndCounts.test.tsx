import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import AddPropertyDialog from '@/views/properties/AddPropertyDialog'

/**
 * What the form sends for the two figures the property detail page reports.
 *
 * The helpers are unit-tested in property-options.test.ts; what this file pins
 * is that the dialog actually uses them. Both defects here were wiring, not
 * logic:
 *
 *   - `currentValue` was only ever echoed back from `editData`, and no input
 *     set it, so every property in the product stored null and the detail page
 *     read "N/A" permanently.
 *
 *   - the room counts were submitted as `parseInt(option)`, so an 11-bedroom
 *     property — which prefills the Select as "6+", the only option that can
 *     hold it — was rewritten to 6 by any edit at all.
 */

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))

vi.mock('@/lib/api/places', () => ({ searchPlaces: vi.fn(), reverseResolve: vi.fn(async () => null) }))

vi.mock('@/lib/api/reference', () => ({ getCities: vi.fn(async () => []), getPostcodeDistricts: vi.fn(async () => []) }))

vi.mock('@/lib/api/storage', () => ({ getStoredTenantId: () => 'tenant-1' }))

vi.mock('@/lib/api/properties', () => ({
  saveDraft: vi.fn(async () => ({ success: true, data: { id: 'draft-1' } })),
  updateDraft: vi.fn(async () => ({ success: true, data: { id: 'draft-1' } })),
  createProperty: vi.fn(async () => ({ success: true, data: { id: 'prop-1' } })),
  updateProperty: vi.fn(async () => ({ success: true, data: { id: 'prop-1' } })),
  uploadPropertyImages: vi.fn()
}))

vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({
    ref: {
      propertyTypes: [{ value: 'house', label: 'House', description: '' }],
      propertyConditions: [{ value: 'good', label: 'Good', description: '' }],
      amenities: [],
      regions: [
        {
          value: 'greater-accra',
          label: 'Greater Accra',
          districts: [{ value: 'accra-metro', label: 'Accra Metropolitan', region: 'greater-accra' }]
        }
      ]
    }
  })
}))

import { createProperty, updateProperty } from '@/lib/api/properties'

/** The property as the detail page hands it over: eleven bedrooms, no valuation. */
const ELEVEN_BEDROOM = {
  id: 'prop-1',
  name: 'Xorla House',
  status: 'active',
  type: 'House',
  rawType: 'house',
  condition: 'Good',
  rawCondition: 'good',
  region: 'greater-accra',
  rawRegion: 'greater-accra',
  district: 'accra-metro',
  rawDistrict: 'accra-metro',
  city: 'Accra',
  street: '12 Nii Boi Street',
  bedrooms: 11,
  bathrooms: 3,
  rooms: 4,
  ownership: 'own',
  currency: 'GHS'
}

/** Walks Step 1 → Step 2 with the minimum the validator demands. */
async function fillStepOne() {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: /^address$/i }))
  fireEvent.click(await screen.findByText(/enter the address manually/i))

  fireEvent.change(screen.getByLabelText(/property name/i), { target: { value: 'Test Property' } })

  fireEvent.mouseDown(screen.getByLabelText(/property type/i))
  fireEvent.click(await screen.findByRole('option', { name: 'House' }))

  fireEvent.mouseDown(screen.getByLabelText(/condition/i))
  fireEvent.click(await screen.findByRole('option', { name: 'Good' }))

  fireEvent.mouseDown(screen.getByLabelText(/region/i))
  fireEvent.click(await screen.findByRole('option', { name: 'Greater Accra' }))

  fireEvent.mouseDown(screen.getByLabelText(/district/i))
  fireEvent.click(await screen.findByRole('option', { name: 'Accra Metropolitan' }))

  await waitFor(() => expect(screen.getByLabelText(/^city/i)).not.toHaveAttribute('aria-disabled', 'true'))

  fireEvent.click(screen.getByRole('button', { name: /next/i }))
  await waitFor(() => expect(screen.getByLabelText(/bedrooms/i)).toBeTruthy())
}

async function pickCount(label: RegExp, option: string) {
  fireEvent.mouseDown(screen.getByLabelText(label))
  fireEvent.click(await screen.findByRole('option', { name: option }))
}

/** Clicks through Images and Submit, then returns the payload that was sent. */
async function submitAndCapture(api: typeof createProperty | typeof updateProperty) {
  fireEvent.click(screen.getByRole('button', { name: /next/i }))
  await waitFor(() => expect(screen.getByRole('button', { name: /next/i })).toBeTruthy())
  fireEvent.click(screen.getByRole('button', { name: /next/i }))

  const submit = await screen.findByRole('button', { name: /submit/i })

  fireEvent.click(submit)

  await waitFor(() => expect(vi.mocked(api)).toHaveBeenCalled())

  const call = vi.mocked(api).mock.calls[0]

  // createProperty(tenantId, payload); updateProperty(tenantId, id, payload).
  return call[call.length - 1] as Record<string, any>
}

describe('AddPropertyDialog — valuation and room counts', () => {
  // Each of these renders the full four-step dialog and walks it end to end.
  // That takes ~2s on an idle machine and over 10s when the Docker stack is
  // running alongside — right on Vitest's default, so the suite failed a
  // different subset on every run with "Test timed out" and no assertion
  // error. A timeout that trips on load reports the machine, not the code.
  vi.setConfig({ testTimeout: 30_000 })

  afterEach(() => vi.clearAllMocks())

  it('sends the valuation the landlord typed', async () => {
    render(<AddPropertyDialog open handleClose={vi.fn()} setData={vi.fn()} />)

    await fillStepOne()

    await pickCount(/bedrooms/i, '3')
    await pickCount(/bathrooms/i, '2')
    await pickCount(/^rooms$/i, '4')

    fireEvent.change(screen.getByLabelText(/estimated value/i), { target: { value: '850000' } })

    const payload = await submitAndCapture(createProperty)

    expect(payload.currentValue).toBe(850000)
  })

  it('leaves the valuation out when the field is blank, rather than sending zero', async () => {
    render(<AddPropertyDialog open handleClose={vi.fn()} setData={vi.fn()} />)

    await fillStepOne()

    await pickCount(/bedrooms/i, '3')
    await pickCount(/bathrooms/i, '2')
    await pickCount(/^rooms$/i, '4')

    const payload = await submitAndCapture(createProperty)

    // A zero valuation is a claim; an absent one is the truth here.
    expect(payload.currentValue).toBeUndefined()
  })

  it('refuses to advance on a valuation that is not a positive amount', async () => {
    render(<AddPropertyDialog open handleClose={vi.fn()} setData={vi.fn()} />)

    await fillStepOne()

    await pickCount(/bedrooms/i, '3')
    await pickCount(/bathrooms/i, '2')
    await pickCount(/^rooms$/i, '4')

    fireEvent.change(screen.getByLabelText(/estimated value/i), { target: { value: '-5' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Still on Step 2: the counts are only rendered there.
    await waitFor(() => expect(screen.getByText(/enter a positive amount/i)).toBeTruthy())
    expect(screen.getByLabelText(/bedrooms/i)).toBeTruthy()
  })

  it('keeps an eleven-bedroom count through an edit that never touched it', async () => {
    // The Select can only show "6+" for 11, and the form previously wrote back
    // whatever the option said. Editing the description would have deleted five
    // bedrooms.
    render(
      <AddPropertyDialog open handleClose={vi.fn()} setData={vi.fn()} mode='edit' editData={ELEVEN_BEDROOM} />
    )

    await waitFor(() => expect(screen.getByLabelText(/property name/i)).toHaveValue('Xorla House'))

    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => expect(screen.getByLabelText(/bedrooms/i)).toBeTruthy())

    // Proof the Select really is sitting on the open-ended option — otherwise
    // this test would pass without exercising the collapse at all.
    expect(screen.getByLabelText(/bedrooms/i)).toHaveTextContent('6+')

    const payload = await submitAndCapture(updateProperty)

    expect(payload.bedrooms).toBe(11)

    // The counts that fit an exact option are unaffected either way.
    expect(payload.bathrooms).toBe(3)
    expect(payload.rooms).toBe(4)
  })

  it('takes the new count when the landlord changes it', async () => {
    render(
      <AddPropertyDialog open handleClose={vi.fn()} setData={vi.fn()} mode='edit' editData={ELEVEN_BEDROOM} />
    )

    await waitFor(() => expect(screen.getByLabelText(/property name/i)).toHaveValue('Xorla House'))

    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => expect(screen.getByLabelText(/bedrooms/i)).toBeTruthy())

    await pickCount(/bedrooms/i, '4')

    const payload = await submitAndCapture(updateProperty)

    // Preserving the stored count must not become "ignoring the user".
    expect(payload.bedrooms).toBe(4)
  })
})
