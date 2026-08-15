import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { PostcodeDistrict } from '@/lib/api/reference'

const rows: PostcodeDistrict[] = [
  { prefix: 'GD', regionValue: 'greater-accra', districtValue: 'adenta', sourceLabel: 'Adentan Municipal District' },
  // A real case: 13 of the 216 published prefixes name a district that has
  // since been split, so they are carried unmapped rather than guessed at.
  { prefix: 'GL', regionValue: null, districtValue: null, sourceLabel: 'Ledzokuku-Krowor Municipal District' }
]

const getPostcodeDistricts = vi.fn()

vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getPostcodeDistricts: (...args: unknown[]) => getPostcodeDistricts(...args)
}))

/** Fresh module per test: the memo is module scope and would leak. */
const freshModule = () => {
  vi.resetModules()

  return import('@/lib/postcodeTable')
}

describe('the postcode table', () => {
  beforeEach(() => {
    getPostcodeDistricts.mockReset()
    getPostcodeDistricts.mockResolvedValue(rows)
  })

  it('fetches once however many callers ask', async () => {
    // AddPropertyDialog renders its steps through a switch, so the field
    // unmounts and remounts on every Previous/Next. Without the memo, walking
    // a four-step wizard re-requests the whole prefix table each time.
    const { loadPostcodeTable } = await freshModule()

    await Promise.all([loadPostcodeTable(), loadPostcodeTable(), loadPostcodeTable()])

    expect(getPostcodeDistricts).toHaveBeenCalledTimes(1)
  })

  it('does not memoise a failure', async () => {
    // A network blip on first mount must not leave the page without a table
    // for the rest of its life.
    const { loadPostcodeTable } = await freshModule()

    getPostcodeDistricts.mockRejectedValueOnce(new Error('offline'))
    await expect(loadPostcodeTable()).rejects.toThrow('offline')

    await expect(loadPostcodeTable()).resolves.toEqual(rows)
    expect(getPostcodeDistricts).toHaveBeenCalledTimes(2)
  })

  it('decodes a recognised prefix', async () => {
    const { decodePrefix } = await freshModule()

    expect(decodePrefix(rows, 'GD')).toEqual({ regionValue: 'greater-accra', districtValue: 'adenta' })
  })

  it('refuses a prefix whose district was never mapped', async () => {
    // Guessing here would file the property in the wrong district carrying
    // the landlord's own code as the apparent source.
    const { decodePrefix } = await freshModule()

    expect(decodePrefix(rows, 'GL')).toBeNull()
  })

  it('refuses an unknown prefix, and refuses before the table has arrived', async () => {
    const { decodePrefix } = await freshModule()

    expect(decodePrefix(rows, 'ZZ')).toBeNull()
    expect(decodePrefix(null, 'GD')).toBeNull()
  })
})
