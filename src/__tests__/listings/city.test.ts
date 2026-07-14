import { describe, it, expect } from 'vitest'
import { cityLabel, citySlug, groupByCity, topCities, labelForSlug } from '@/views/listings/lib/city'
import { makeListing } from './fixtures'

describe('cityLabel', () => {
  it('returns "district, city" from a 3-part address', () => {
    expect(cityLabel('Adenta, Accra, Greater Accra')).toBe('Adenta, Accra')
  })

  it('collapses to just the city when district equals city (case-insensitive)', () => {
    expect(cityLabel('Accra, Accra, Greater Accra')).toBe('Accra')
    expect(cityLabel('tamale, Tamale, Northern')).toBe('Tamale')
  })

  it('returns a single-part address as-is', () => {
    expect(cityLabel('Kumasi')).toBe('Kumasi')
  })

  it('falls back to "Other areas" for empty, blank, or null input', () => {
    expect(cityLabel('')).toBe('Other areas')
    expect(cityLabel('   ')).toBe('Other areas')
    expect(cityLabel(null)).toBe('Other areas')
    expect(cityLabel(undefined)).toBe('Other areas')
  })
})

describe('citySlug', () => {
  it('slugifies a compound label', () => {
    expect(citySlug('Adenta, Accra')).toBe('adenta-accra')
  })

  it('slugifies a single-word label', () => {
    expect(citySlug('Accra')).toBe('accra')
  })

  it('maps the fallback label to other-areas', () => {
    expect(citySlug('Other areas')).toBe('other-areas')
  })

  it('drops punctuation and collapses whitespace', () => {
    expect(citySlug("Teshie-Nungua  Estates, Accra")).toBe('teshie-nungua-estates-accra')
  })
})

describe('groupByCity', () => {
  const listings = [
    makeListing({ id: 'a1', propertyAddress: 'Adenta, Accra, Greater Accra' }),
    makeListing({ id: 'a2', propertyAddress: 'adenta, accra, Greater Accra' }), // casing merges
    makeListing({ id: 'b1', propertyAddress: 'Tamale, Tamale, Northern' }),
    makeListing({ id: 'x1', propertyAddress: '' }),                              // Other areas
    makeListing({ id: 'dead', propertyAddress: 'Adenta, Accra, Greater Accra', status: 'INACTIVE' }),
  ]

  it('groups ACTIVE listings by city label, merging case variants', () => {
    const groups = groupByCity(listings)
    const adenta = groups.find(g => g.slug === 'adenta-accra')
    expect(adenta?.listings.map(l => l.id)).toEqual(['a1', 'a2'])
    expect(adenta?.label).toBe('Adenta, Accra') // first-seen casing wins
  })

  it('excludes INACTIVE listings entirely', () => {
    const groups = groupByCity(listings)
    expect(groups.flatMap(g => g.listings).some(l => l.id === 'dead')).toBe(false)
  })

  it('keeps unparseable addresses in an Other areas bucket', () => {
    const other = groupByCity(listings).find(g => g.slug === 'other-areas')
    expect(other?.listings.map(l => l.id)).toEqual(['x1'])
  })

  it('sorts by count desc, then label asc', () => {
    const groups = groupByCity([
      makeListing({ id: '1', propertyAddress: 'Ahodwo, Kumasi, Ashanti' }),
      makeListing({ id: '2', propertyAddress: 'Adenta, Accra, Greater Accra' }),
      makeListing({ id: '3', propertyAddress: 'Adenta, Accra, Greater Accra' }),
      makeListing({ id: '4', propertyAddress: 'Tamale, Tamale, Northern' }),
    ])
    expect(groups.map(g => g.label)).toEqual(['Adenta, Accra', 'Ahodwo, Kumasi', 'Tamale'])
  })

  it('merges labels that differ only in punctuation into one slug bucket', () => {
    const groups = groupByCity([
      makeListing({ id: 'p1', propertyAddress: 'St. Paul, Accra, Greater Accra' }),
      makeListing({ id: 'p2', propertyAddress: 'St Paul, Accra, Greater Accra' }),
    ])
    const stPaul = groups.filter(g => g.slug === 'st-paul-accra')
    expect(stPaul).toHaveLength(1)
    expect(stPaul[0].listings.map(l => l.id)).toEqual(['p1', 'p2'])
  })
})

describe('topCities', () => {
  it('caps at n and never includes other-areas', () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      makeListing({ id: `l${i}`, propertyAddress: `Area${i}, City${i}, Region` })
    )
    many.push(makeListing({ id: 'x', propertyAddress: '' }))
    const top = topCities(groupByCity(many))
    expect(top).toHaveLength(10)
    expect(top.some(g => g.slug === 'other-areas')).toBe(false)
  })
})

describe('labelForSlug', () => {
  const listings = [
    makeListing({ id: 'a', propertyAddress: 'Adenta, Accra, Greater Accra', status: 'INACTIVE' }),
  ]

  it('resolves a label even when all its listings are INACTIVE', () => {
    expect(labelForSlug(listings, 'adenta-accra')).toBe('Adenta, Accra')
  })

  it('returns undefined for a slug that never matched anything', () => {
    expect(labelForSlug(listings, 'kumasi')).toBeUndefined()
  })
})
