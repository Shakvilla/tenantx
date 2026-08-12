import { describe, it, expect } from 'vitest'

import { UNIT_AMENITIES, amenityLabel, amenityIcon, humaniseAmenity } from '@/lib/amenities'

/**
 * Amenities are stored as ids (`kitchen_cabinets`), chosen from the Add Unit
 * form's checkbox list. The public listing page was rendering those ids raw —
 * "kitchen_cabinets, laundry & more" — because it never had the id→label map
 * the dashboard already carried in three separate copies.
 */
describe('amenityLabel', () => {
  it('gives every id the Add Unit form offers a human label', () => {
    // If the form gains an amenity and this module does not, the listing page
    // silently starts printing a raw id again.
    for (const { id, label } of UNIT_AMENITIES) {
      expect(amenityLabel(id)).toBe(label)
      expect(label).not.toMatch(/_/)
    }
  })

  it('labels the id that shipped broken', () => {
    expect(amenityLabel('kitchen_cabinets')).toBe('Kitchen Cabinets')
  })

  it('matches regardless of case, spacing or separator', () => {
    // Older rows and other tenants' data carry display-ish values rather than
    // ids; they should resolve to the same canonical label, not fall through.
    expect(amenityLabel('Wifi')).toBe('WiFi / Internet')
    expect(amenityLabel('Kitchen Cabinets')).toBe('Kitchen Cabinets')
    expect(amenityLabel('kitchen-cabinets')).toBe('Kitchen Cabinets')
    expect(amenityLabel('  AC  ')).toBe('Air Conditioning')
  })

  it('humanises an id it does not know instead of printing it raw', () => {
    // The vocabulary is not closed — a raw id must never reach the page.
    expect(amenityLabel('roof_terrace')).toBe('Roof Terrace')
    expect(amenityLabel('borehole')).toBe('Borehole')
  })

  it('leaves an unknown value that is already prose alone', () => {
    expect(amenityLabel('Solar Panels')).toBe('Solar Panels')
  })
})

describe('amenityIcon', () => {
  it('gives every known amenity its own icon', () => {
    for (const { id, icon } of UNIT_AMENITIES) {
      expect(amenityIcon(id)).toBe(icon)
      expect(icon).toMatch(/^ri-/)
    }
  })

  it('falls back to a generic tick for anything unknown', () => {
    expect(amenityIcon('roof_terrace')).toBe('ri-checkbox-circle-line')
  })

  it('does not confuse one amenity for another by substring', () => {
    // The listing page previously matched by `key.includes(k)`, so
    // "kitchen_cabinets" picked up the plain "kitchen" icon. Exact lookup only.
    expect(amenityIcon('kitchen_cabinets')).not.toBe(amenityIcon('kitchen'))
  })
})

describe('humaniseAmenity', () => {
  it('splits on underscores, hyphens and spaces', () => {
    expect(humaniseAmenity('roof_terrace')).toBe('Roof Terrace')
    expect(humaniseAmenity('roof-terrace')).toBe('Roof Terrace')
  })

  it('preserves capitals already present rather than lowercasing them', () => {
    expect(humaniseAmenity('DSTV_ready')).toBe('DSTV Ready')
  })

  it('survives empty and whitespace-only input', () => {
    expect(humaniseAmenity('')).toBe('')
    expect(humaniseAmenity('   ')).toBe('')
  })
})
