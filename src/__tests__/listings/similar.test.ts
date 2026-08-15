import { describe, it, expect } from 'vitest'
import { findSimilarListings } from '@/views/listings/lib/similar'
import { makeListing } from './fixtures'

const current = makeListing({ id: 'current', propertyAddress: 'East Legon, Accra', bedrooms: 2 })

describe('findSimilarListings', () => {
  it('excludes the current listing itself', () => {
    const out = findSimilarListings([current, makeListing({ id: 'other' })], current)
    expect(out.map(l => l.id)).not.toContain('current')
  })

  it('excludes inactive listings', () => {
    const inactive = makeListing({ id: 'inactive', status: 'INACTIVE' })
    expect(findSimilarListings([current, inactive], current)).toHaveLength(0)
  })

  it('ranks same-area listings above same-bedroom listings', () => {
    const sameArea = makeListing({ id: 'area', propertyAddress: 'Adjiringanor, Accra', bedrooms: 5 })
    const sameBeds = makeListing({ id: 'beds', propertyAddress: 'Ahodwo, Kumasi', bedrooms: 2 })
    const out = findSimilarListings([sameBeds, sameArea, current], current)
    expect(out[0].id).toBe('area')
    expect(out[1].id).toBe('beds')
  })

  it('caps at 4 by default', () => {
    const many = Array.from({ length: 8 }, (_, i) => makeListing({ id: `l${i}` }))
    expect(findSimilarListings([...many, current], current)).toHaveLength(4)
  })

  it('fills remaining slots with most-recent zero-score listings', () => {
    const older = makeListing({ id: 'older', propertyAddress: 'Takoradi', bedrooms: 9, createdAt: '2026-01-01T00:00:00Z' })
    const newer = makeListing({ id: 'newer', propertyAddress: 'Tamale', bedrooms: 9, createdAt: '2026-07-01T00:00:00Z' })
    const out = findSimilarListings([older, newer, current], current)
    expect(out.map(l => l.id)).toEqual(['newer', 'older'])
  })
})
