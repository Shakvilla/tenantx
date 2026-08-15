import { describe, it, expect } from 'vitest'

import { ikUrl, IK_THUMB, IK_CARD, IK_FULL } from '@/lib/imagekit'

const STORED = 'https://ik.imagekit.io/ixtkw2ixq/yiliora/atkaada-company-ltd/properties/2bedroom_r3hTiIeuL.jpeg'

/**
 * Why this exists at all.
 *
 * This ImageKit account does not serve ORIGINAL files: the stored URL returns
 * 404 with `ik-error: ENOENT`, while the same file with a transformation
 * returns 200. Every rendered image therefore has to carry one.
 *
 * Measured against the live account before this was written:
 *
 *   .../properties/2bedroom_r3hTiIeuL.jpeg           404
 *   .../properties/2bedroom_r3hTiIeuL.jpeg?tr=w-400  404   <- query form
 *   .../tr:w-400/properties/2bedroom_r3hTiIeuL.jpeg  200   <- path form
 *
 * The query form is the one most people reach for and it is the one that does
 * not work here, which is what the first test pins.
 */
describe('ikUrl', () => {
  it('puts the transformation in the PATH, never the query string', () => {
    // The query form (?tr=…) 404s on this account. If someone "simplifies"
    // this to a query parameter, every image on the site goes blank again.
    const out = ikUrl(STORED, 'w-400')

    expect(out).toBe(
      'https://ik.imagekit.io/ixtkw2ixq/tr:w-400/yiliora/atkaada-company-ltd/properties/2bedroom_r3hTiIeuL.jpeg'
    )
    expect(out).not.toContain('?tr=')
    expect(out).not.toContain('&tr=')
  })

  it('inserts after the endpoint id, not at the start of the path', () => {
    // ik.imagekit.io/<endpointId>/<path>: putting tr: before the endpoint id
    // addresses a different account entirely.
    expect(ikUrl(STORED, 'w-400')).toContain('/ixtkw2ixq/tr:w-400/yiliora/')
  })

  it('keeps an existing query string', () => {
    // ImageKit's own API hands back URLs carrying ?updatedAt=…, and a stored
    // URL may well have one.
    expect(ikUrl(`${STORED}?updatedAt=1786196795690`, 'w-400')).toBe(
      'https://ik.imagekit.io/ixtkw2ixq/tr:w-400/yiliora/atkaada-company-ltd/properties/2bedroom_r3hTiIeuL.jpeg?updatedAt=1786196795690'
    )
  })

  it('does not transform a URL that already carries one', () => {
    const once = ikUrl(STORED, 'w-400')

    expect(ikUrl(once, 'w-800')).toBe(once)
  })

  it('leaves a URL that is not ours alone', () => {
    // Listings carry stock photography from elsewhere; rewriting those paths
    // would break images that currently work.
    const foreign = 'https://images.unsplash.com/photo-123?w=400'

    expect(ikUrl(foreign, 'w-400')).toBe(foreign)
  })

  it('returns an empty string for nothing, rather than the string "undefined"', () => {
    // These feed straight into src=; "undefined" would be requested as a path.
    expect(ikUrl(null, 'w-400')).toBe('')
    expect(ikUrl(undefined, 'w-400')).toBe('')
    expect(ikUrl('', 'w-400')).toBe('')
  })

  it('survives a value that is not a URL', () => {
    expect(ikUrl('not a url', 'w-400')).toBe('not a url')
  })

  it('offers presets that all carry a width and modern format negotiation', () => {
    // f-auto is what turns the 845 KB PNGs into something a phone should be
    // asked to download.
    for (const preset of [IK_THUMB, IK_CARD, IK_FULL]) {
      expect(preset).toMatch(/(^|,)w-\d+(,|$)/)
      expect(preset).toContain('f-auto')
    }
  })
})
