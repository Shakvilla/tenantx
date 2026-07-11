import { describe, it, expect } from 'vitest'
import {
  formatGHS, bedroomLabel, daysSince, formatDate,
  buildWhatsApp, buildMaps, buildMapsEmbed, matchesSearch,
} from '@/views/listings/lib/format'
import { makeListing } from './fixtures'

describe('formatGHS', () => {
  it('formats a number with GH₵ prefix and en-GH grouping', () => {
    expect(formatGHS(1500)).toBe('GH₵ 1,500')
  })
  it('renders an em dash for null', () => {
    expect(formatGHS(null)).toBe('—')
  })
})

describe('bedroomLabel', () => {
  it('returns Studio for 0', () => expect(bedroomLabel(0)).toBe('Studio'))
  it('singular for 1', () => expect(bedroomLabel(1)).toBe('1 bed'))
  it('plural for 2', () => expect(bedroomLabel(2)).toBe('2 beds'))
  it('null passes through', () => expect(bedroomLabel(null)).toBeNull())
})

describe('daysSince', () => {
  it('returns 0 for now-ish', () => {
    expect(daysSince(new Date().toISOString())).toBe(0)
  })
  it('returns null for missing input', () => {
    expect(daysSince(null)).toBeNull()
    expect(daysSince(undefined)).toBeNull()
  })
})

describe('formatDate', () => {
  it('formats an ISO date long-form', () => {
    expect(formatDate('2026-08-01')).toMatch(/August/)
    expect(formatDate('2026-08-01')).toMatch(/2026/)
  })
  it('returns null for null', () => expect(formatDate(null)).toBeNull())
})

describe('buildWhatsApp', () => {
  it('rewrites a leading 0 to +233 and strips spaces', () => {
    const url = buildWhatsApp('024 412 3456', 'Nice flat')
    expect(url).toContain('wa.me/+233244123456')
  })
  it('embeds the listing title in the prefilled message', () => {
    expect(buildWhatsApp('0244123456', 'Nice flat')).toContain(encodeURIComponent('"Nice flat"'))
  })
})

describe('buildMaps / buildMapsEmbed', () => {
  it('buildMaps produces a Google Maps search URL with encoded query', () => {
    expect(buildMaps('East Legon, Accra')).toBe(
      'https://www.google.com/maps/search/?api=1&query=East%20Legon%2C%20Accra'
    )
  })
  it('buildMapsEmbed produces the keyless embed URL', () => {
    expect(buildMapsEmbed('East Legon, Accra')).toBe(
      'https://www.google.com/maps?q=East%20Legon%2C%20Accra&output=embed'
    )
  })
})

describe('matchesSearch', () => {
  const listing = makeListing()
  it('matches on address, case-insensitive', () => {
    expect(matchesSearch(listing, 'east legon')).toBe(true)
  })
  it('matches on property name', () => {
    expect(matchesSearch(listing, 'sunrise')).toBe(true)
  })
  it('matches on unit type', () => {
    expect(matchesSearch(listing, 'apartment')).toBe(true)
  })
  it('empty query matches everything', () => {
    expect(matchesSearch(listing, '   ')).toBe(true)
  })
  it('non-matching query rejects', () => {
    expect(matchesSearch(listing, 'kumasi')).toBe(false)
  })
})
