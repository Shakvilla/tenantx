import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import PropertyAddressFields, {
  type AddressValue,
  type AddressCoordinates
} from '@/components/address/PropertyAddressFields'

vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getPostcodeDistricts: vi.fn(async () => []),
  getCities: vi.fn(async () => ['Adenta', 'Frafraha'])
}))

vi.mock('@/lib/api/places', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/places')>()),
  searchPlaces: vi.fn(async () => ({ status: 'ok', suggestions: [] })),
  reverseResolve: vi.fn()
}))

vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({
    // The context now also carries what the platform allows; single-currency by
    // default, which is what these tests assume.
    policy: { multiCurrencyEnabled: false, baseCurrency: 'GHS' },
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

/**
 * AddPropertyDialog's step switch, reduced to what matters here: the address
 * block really unmounts and remounts, while the coordinates it reported stay
 * with the parent across the gap — exactly as `coordinates` state does there.
 */
function SteppedHarness() {
  const [value, setValue] = useState<AddressValue>({
    gpsCode: '',
    street: '',
    region: '',
    district: '',
    city: ''
  })

  const [coordinates, setCoordinates] = useState<AddressCoordinates | null>(null)
  const [onStepZero, setOnStepZero] = useState(true)

  return (
    <>
      {onStepZero ? (
        <PropertyAddressFields
          value={value}
          onChange={patch => setValue(v => ({ ...v, ...patch }))}
          onCoordinates={setCoordinates}
          capturedAccuracyMetres={coordinates?.accuracyMetres}
        />
      ) : (
        <p>step two</p>
      )}
      <button onClick={() => setOnStepZero(false)}>Next step</button>
      <button onClick={() => setOnStepZero(true)}>Previous step</button>
    </>
  )
}

const state = () => JSON.parse(screen.getByTestId('state').textContent!)
const field = () => screen.getByRole('combobox', { name: /address/i })
const capture = () => fireEvent.click(screen.getByRole('button', { name: /use my current location/i }))

/** The resolved place arrives as a dropdown row; choosing it is what applies it. */
const pickTheLocation = async () => fireEvent.click(await screen.findByText('Adenta'))

/** Manual entry is a row in the same dropdown, not a button beside it. */
const enterManually = async () => {
  fireEvent.mouseDown(field())
  fireEvent.click(await screen.findByText(/enter the address manually/i))
}

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

    // The row names the district, and states the fix's own accuracy beside it.
    expect(await screen.findByText(/Adenta Municipal · ±8 m/)).toBeTruthy()
    expect(screen.getByText('Adenta')).toBeTruthy()

    // Nothing filled until picked.
    expect(state().district).toBe('')
  })

  it('fills the address only once the landlord accepts it', async () => {
    vi.mocked(reverseResolve).mockResolvedValue(confident)

    render(<Harness />)
    capture()

    await pickTheLocation()

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

    expect(await screen.findByText(/42.0 km|nearest/i)).toBeTruthy()
  })

  it('still offers an unconfident guess rather than discarding it', async () => {
    // A coarse starting point beats an empty form; the landlord can correct
    // one field instead of filling three.
    vi.mocked(reverseResolve).mockResolvedValue({ ...confident, distanceMetres: 42000, confident: false })

    render(<Harness />)
    capture()

    expect(await screen.findByText('Adenta')).toBeTruthy()

    await pickTheLocation()

    await waitFor(() => expect(state().district).toBe('adenta'))
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

    // The row is still offered — the capture is real — but it carries no
    // address, so picking it applies nothing.
    fireEvent.click(await screen.findByText(/location captured · ±8 m/i))

    await waitFor(() => expect(screen.queryByText(/location captured/i)).toBeNull())
    expect(state().district).toBe('')
    expect(state().region).toBe('')
  })

  it('keeps saying how accurate the held position is, long after the row is gone', async () => {
    // The row states the accuracy once and then vanishes with the pick, and
    // nothing else in the app renders accuracyMetres. Without a line that
    // stays, a landlord ends up with a saved position and no way to tell a
    // good fix from a guess.
    vi.mocked(reverseResolve).mockResolvedValue(confident)

    render(<Harness />)
    capture()

    expect(await screen.findByText(/located to within 8 m/i)).toBeTruthy()

    await pickTheLocation()

    await waitFor(() => expect(state().district).toBe('adenta'))

    // The row is gone; the accuracy is not.
    expect(screen.queryByText(/Adenta Municipal · ±8 m/)).toBeNull()
    expect(screen.getByText(/located to within 8 m/i)).toBeTruthy()

    // A good fix is stated, not editorialised.
    expect(screen.queryByText(/approximate/i)).toBeNull()
  })

  it('calls a poor fix approximate and says what would read better', async () => {
    // A 3 km fix and a 8 m fix arrive through the identical API and land in
    // the identical columns. Presenting them the same way is how a guess ends
    // up indistinguishable from a survey.
    grantPosition(3000)
    vi.mocked(reverseResolve).mockResolvedValue(confident)

    render(<Harness />)
    capture()

    const note = await screen.findByText(/approximate only/i)

    expect(note.textContent).toContain('3.0 km')
    expect(note.textContent).toContain('Standing outside at the property gives a much better reading.')
  })

  it('drops the accuracy when the coordinates it described are dropped', async () => {
    // Hand-editing a locality field clears the coordinates. Leaving "Located
    // to within 8 m" underneath would describe a position the form no longer
    // holds.
    vi.mocked(reverseResolve).mockResolvedValue(confident)

    render(<Harness />)
    capture()

    await screen.findByText(/located to within 8 m/i)
    await pickTheLocation()
    await waitFor(() => expect(state().district).toBe('adenta'))

    fireEvent.click(await screen.findByRole('button', { name: /change/i }))
    fireEvent.mouseDown(await screen.findByRole('combobox', { name: /district/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Ga East Municipal' }))

    await waitFor(() => expect(screen.queryByText(/located to within/i)).toBeNull())
  })

  it('restates the accuracy after the block is unmounted and brought back', async () => {
    // AddPropertyDialog renders this block inside a step switch, so Next
    // genuinely unmounts it and Previous mounts a fresh one — the same remount
    // that forced the postcode table's module-scope memo. The parent goes on
    // holding the coordinates across that, so a caption seeded only to null
    // leaves a position that is still going to be saved with nothing on screen
    // saying how far to trust it.
    //
    // This has to be a real unmount: a re-render passes without the seed.
    vi.mocked(reverseResolve).mockResolvedValue(confident)

    render(<SteppedHarness />)
    capture()

    expect(await screen.findByText(/located to within 8 m/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /next step/i }))

    // Really gone, not merely hidden.
    expect(screen.queryByRole('combobox', { name: /address/i })).toBeNull()
    expect(screen.queryByText(/located to within/i)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /previous step/i }))

    expect(await screen.findByText(/located to within 8 m/i)).toBeTruthy()
  })

  it('states nothing on a remount when the caller holds no position', async () => {
    // The seed must not invent an accuracy for coordinates that are not held.
    // A landlord who never captured, or who hand-edited a locality field and
    // dropped the fix, must come back to a clean field.
    render(<SteppedHarness />)

    fireEvent.click(screen.getByRole('button', { name: /next step/i }))
    fireEvent.click(screen.getByRole('button', { name: /previous step/i }))

    await screen.findByRole('combobox', { name: /address/i })

    expect(screen.queryByText(/located to within|approximate only/i)).toBeNull()
  })

  it('does not overwrite an address the landlord already chose', async () => {
    // Picking is what applies it, so a form already filled stays filled
    // until they say otherwise.
    vi.mocked(reverseResolve).mockResolvedValue(confident)

    render(<Harness />)
    await enterManually()
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /region/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Greater Accra' }))
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /district/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Ga East Municipal' }))

    capture()
    await screen.findByText('Adenta')

    expect(state().district).toBe('ga-east')
  })
})
