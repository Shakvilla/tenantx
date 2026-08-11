import { useState } from 'react'

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

import UnifiedAddressField from '@/components/address/UnifiedAddressField'
import type { DecodedAddress } from '@/lib/postcodeTable'

vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getPostcodeDistricts: vi.fn(async () => [
    { prefix: 'GD', regionValue: 'greater-accra', districtValue: 'adenta', sourceLabel: 'Adentan Municipal District' },
    { prefix: 'GL', regionValue: null, districtValue: null, sourceLabel: 'Ledzokuku-Krowor Municipal District' }
  ])
}))

vi.mock('@/lib/api/places', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/places')>()),
  searchPlaces: vi.fn(async () => ({ status: 'ok', suggestions: [] })),
  reverseResolve: vi.fn(async () => null)
}))

vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({ ref: { regions: [] } })
}))

const onDecoded = vi.fn()
const onPlaceSelected = vi.fn()
const onManual = vi.fn()
const onPositionCaptured = vi.fn()
const onLocationPicked = vi.fn()

function Harness() {
  const [gpsCode, setGpsCode] = useState('')

  return (
    <>
      <UnifiedAddressField
        gpsCode={gpsCode}
        onGpsCodeChange={setGpsCode}
        onDecoded={onDecoded}
        onPlaceSelected={onPlaceSelected}
        onManual={onManual}
        onPositionCaptured={onPositionCaptured}
        onLocationPicked={onLocationPicked}
      />
      <output data-testid='code'>{gpsCode}</output>
    </>
  )
}

const field = () => screen.getByRole('combobox', { name: /address/i })
const code = () => screen.getByTestId('code').textContent

const type = (text: string) => {
  const input = field()

  fireEvent.focus(input)
  fireEvent.change(input, { target: { value: text } })
}

/** The commit is debounced; nothing happens until the landlord stops typing. */
const settle = async () => {
  await act(async () => {
    vi.advanceTimersByTime(500)
  })
}

const grantPosition = () => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    writable: true,
    value: {
      getCurrentPosition: (ok: PositionCallback) =>
        ok({
          coords: { latitude: 5.71, longitude: -0.166, accuracy: 8 } as GeolocationCoordinates,
          timestamp: 0
        } as GeolocationPosition)
    }
  })
}

describe('recognising a digital address in the one field', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    onDecoded.mockClear()
    onPositionCaptured.mockClear()

    // The pin is only rendered where the browser has geolocation. Denied by
    // default here so every test starts from the same field, and granted
    // explicitly by the one test that taps it.
    Object.defineProperty(navigator, 'geolocation', { configurable: true, writable: true, value: undefined })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('turns a recognised code into a chip and clears the input', async () => {
    render(<Harness />)
    type('GD-184-7915')
    await settle()

    // The Harness echoes gpsCode into an <output> right next to the chip, so
    // an unscoped text match finds both — scope to the chip label itself.
    expect(await screen.findByText('GD-184-7915', { selector: '.MuiChip-label' })).toBeTruthy()
    expect(code()).toBe('GD-184-7915')
    expect((field() as HTMLInputElement).value).toBe('')
  })

  it('normalises however the landlord pasted it', async () => {
    // These arrive from utility bills, the GhanaPostGPS app and WhatsApp,
    // with and without separators and in either case.
    render(<Harness />)
    type('gd1847915')
    await settle()

    expect(code()).toBe('GD-184-7915')
  })

  it('fills region and district from a recognised prefix', async () => {
    render(<Harness />)
    type('GD-184-7915')
    await settle()

    await waitFor(() =>
      expect(onDecoded).toHaveBeenCalledWith<[DecodedAddress]>({
        regionValue: 'greater-accra',
        districtValue: 'adenta'
      })
    )
  })

  it('saves an unrecognised prefix but fills nothing, and says so', async () => {
    // GL is a real published prefix whose district has since been split.
    // Guessing would file the property in the wrong district carrying the
    // landlord's own code as the apparent source.
    render(<Harness />)
    type('GL-100-0001')
    await settle()

    expect(code()).toBe('GL-100-0001')
    await waitFor(() => expect(onDecoded).toHaveBeenCalledWith(null))
    expect(await screen.findByText(/don't recognise/i)).toBeTruthy()
  })

  it('commits immediately on Enter rather than waiting out the debounce', async () => {
    render(<Harness />)
    type('GD-184-7915')
    fireEvent.keyDown(field(), { key: 'Enter' })

    await waitFor(() => expect(code()).toBe('GD-184-7915'))
  })

  it('keeps exactly one chip when a second code is entered', async () => {
    // A property has one gpsCode. Two complete codes, one after the other:
    // the second replaces the first rather than accumulating beside it.
    render(<Harness />)
    type('GD-184-7915')
    await settle()
    type('GL-100-0001')
    await settle()

    expect(code()).toBe('GL-100-0001')
    expect(screen.queryByText('GD-184-7915')).toBeNull()
  })

  it('replaces an early commit when the landlord carries on typing the same code', async () => {
    // The path the test above cannot reach, because it types two COMPLETE
    // codes with a settle between them.
    //
    // The parser accepts 6-9 digits so that it agrees with the backend rule
    // for rule, which means a pause between the sixth digit and the seventh
    // commits a code the landlord has not finished. Committing empties the
    // box, so the next keystroke arrives on its own as "5" — which parses as
    // nothing. Unless the committed text goes back in front of it the
    // truncated chip is STICKY, and debouncing the commit instead of
    // committing per keystroke buys nothing at all.
    render(<Harness />)

    // Six digits: already a whole code as far as the parser is concerned.
    type('GD-184-791')
    await settle()
    expect(code()).toBe('GD-184-791')

    // The seventh digit, typed into the box the commit just emptied. A
    // browser reports the input's whole value, and its whole value is "5".
    type('5')
    await settle()

    expect(code()).toBe('GD-184-7915')
    expect(screen.queryByText('GD-184-791', { selector: '.MuiChip-label' })).toBeNull()

    // And nothing of the code is left behind in the box to be typed over or
    // sent to the geocoder as an address query.
    expect((field() as HTMLInputElement).value).toBe('')
  })

  it('does not put a deleted code back when the next thing typed is a digit', async () => {
    // The other side of the same seam: the committed text is remembered only
    // for the keystroke that continues it. Removing the chip is the landlord
    // throwing that code away, and a "5" typed afterwards is the start of
    // something new — not the seventh digit of the code they just deleted.
    render(<Harness />)
    type('GD-184-791')
    await settle()

    fireEvent.click(await screen.findByRole('button', { name: /remove address code/i }))
    await waitFor(() => expect(code()).toBe(''))

    type('5')
    await settle()

    expect(code()).toBe('')
    expect((field() as HTMLInputElement).value).toBe('5')
  })

  it('leaves the address fields alone when the chip is removed', async () => {
    // Removing the code clears the code. The landlord may have corrected the
    // district by hand, and emptying a filled form as a side effect of
    // removing something else is worse than a stale value they can see.
    render(<Harness />)
    type('GD-184-7915')
    await settle()
    onDecoded.mockClear()

    fireEvent.click(await screen.findByRole('button', { name: /remove/i }))

    await waitFor(() => expect(code()).toBe(''))
    expect(onDecoded).not.toHaveBeenCalled()
  })

  it('removes the chip on backspace from an empty input', async () => {
    render(<Harness />)
    type('GD-184-7915')
    await settle()

    fireEvent.keyDown(field(), { key: 'Backspace' })

    await waitFor(() => expect(code()).toBe(''))
  })

  // The two below bound the seed rather than the fold itself. A digit typed
  // straight after a commit is genuinely ambiguous — the seventh digit of the
  // code, or the first character of something new — and that ambiguity is
  // accepted. What is not accepted is the seed OUTLIVING the moment: neither a
  // blur nor a pin tap fires an input event, so before these the seed sat
  // there indefinitely and folded a digit typed minutes and several actions
  // later into a code the landlord had finished with.

  it('lets go of a committed code once the landlord leaves the field', async () => {
    render(<Harness />)
    type('GD-184-7915')
    await settle()

    fireEvent.blur(field())

    type('2')
    await settle()

    expect(code()).toBe('GD-184-7915')
    expect((field() as HTMLInputElement).value).toBe('2')
  })

  it('lets go of a committed code once the landlord taps the pin', async () => {
    grantPosition()

    render(<Harness />)
    type('GD-184-7915')
    await settle()

    fireEvent.click(screen.getByRole('button', { name: /use my current location/i }))
    await waitFor(() => expect(onPositionCaptured).toHaveBeenCalled())

    type('2')
    await settle()

    expect(code()).toBe('GD-184-7915')
    expect((field() as HTMLInputElement).value).toBe('2')
  })

  it('does not chip ordinary address text', async () => {
    render(<Harness />)
    type('East Legon')
    await settle()

    expect(code()).toBe('')
    expect((field() as HTMLInputElement).value).toBe('East Legon')
  })
})
