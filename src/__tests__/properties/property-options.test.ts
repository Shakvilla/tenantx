import { describe, it, expect } from 'vitest'

import {
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  ROOM_OPTIONS,
  countLabel,
  fromCountOption,
  toCountOption
} from '@/lib/property-options'

describe('toCountOption', () => {
  it('maps an exactly-representable count to its own option', () => {
    expect(toCountOption(3, BEDROOM_OPTIONS)).toBe('3')
    expect(toCountOption(4, BATHROOM_OPTIONS)).toBe('4')
  })

  it('collapses a count at the open-ended bucket onto that option', () => {
    // The bug this guards: a property saved via "6+" stores 6, which matched no
    // option and left the Select blank in edit mode.
    expect(toCountOption(6, BEDROOM_OPTIONS)).toBe('6+')
    expect(toCountOption(5, BATHROOM_OPTIONS)).toBe('5+')
    expect(toCountOption(6, ROOM_OPTIONS)).toBe('6+')
  })

  it('collapses a count above the open-ended bucket onto that option', () => {
    expect(toCountOption(12, BEDROOM_OPTIONS)).toBe('6+')
    expect(toCountOption(9, BATHROOM_OPTIONS)).toBe('5+')
  })

  it('accepts the value as a string, with or without the plus', () => {
    expect(toCountOption('3', BEDROOM_OPTIONS)).toBe('3')
    expect(toCountOption('6+', BEDROOM_OPTIONS)).toBe('6+')
  })

  it('returns empty for counts that cannot be represented', () => {
    expect(toCountOption(0, BEDROOM_OPTIONS)).toBe('')
    expect(toCountOption(-2, BEDROOM_OPTIONS)).toBe('')
    expect(toCountOption(null, BEDROOM_OPTIONS)).toBe('')
    expect(toCountOption(undefined, BEDROOM_OPTIONS)).toBe('')
    expect(toCountOption('', BEDROOM_OPTIONS)).toBe('')
    expect(toCountOption('not a number', BEDROOM_OPTIONS)).toBe('')
  })

  it('has a bathroom list that stops one short of the bedroom list', () => {
    // Guards the asymmetry that made bathrooms=5 blank while bedrooms=5 worked.
    expect(BEDROOM_OPTIONS).toContain('5')
    expect(BATHROOM_OPTIONS).not.toContain('5')
    expect(BATHROOM_OPTIONS).toContain('5+')
  })
})

describe('countLabel', () => {
  it('shows the exact count, including one inside the open-ended bucket', () => {
    // The defect: the detail page ran counts through toCountOption, so a
    // property with exactly 6 bedrooms displayed "6+" — an approximation of a
    // number the system holds precisely.
    expect(countLabel(6)).toBe('6')
    expect(countLabel(11)).toBe('11')
    expect(countLabel(3)).toBe('3')
  })

  it('accepts a stored value written as an option', () => {
    expect(countLabel('6+')).toBe('6')
  })

  it('returns empty when there is no count to show', () => {
    expect(countLabel(null)).toBe('')
    expect(countLabel(undefined)).toBe('')
    expect(countLabel(0)).toBe('')
    expect(countLabel(-1)).toBe('')
    expect(countLabel('')).toBe('')
    expect(countLabel('not a number')).toBe('')
  })
})

describe('fromCountOption', () => {
  it('stores the number an exact option names', () => {
    expect(fromCountOption('3')).toBe(3)
    expect(fromCountOption('3', 9)).toBe(3)
  })

  it('keeps a stored count that the open-ended option cannot express', () => {
    // The data loss this guards: an 11-bedroom property prefills the Select as
    // "6+", and saving an unrelated edit wrote 6 back — silently deleting five
    // bedrooms the landlord never touched.
    expect(fromCountOption('6+', 11)).toBe(11)
    expect(fromCountOption('5+', 8)).toBe(8)
  })

  it('takes the bucket number when nothing better is on record', () => {
    expect(fromCountOption('6+')).toBe(6)
    expect(fromCountOption('6+', null)).toBe(6)
    expect(fromCountOption('6+', 4)).toBe(6)
  })

  it('accepts the stored count written as an option', () => {
    expect(fromCountOption('6+', '11')).toBe(11)
    expect(fromCountOption('6+', '6+')).toBe(6)
  })

  it('returns undefined when nothing was selected', () => {
    expect(fromCountOption('')).toBeUndefined()
    expect(fromCountOption(null)).toBeUndefined()
    expect(fromCountOption(undefined)).toBeUndefined()
  })

  it('round-trips a count through the form without changing it', () => {
    // toCountOption prefills the Select, fromCountOption reads it back. An
    // untouched form must return the property exactly as it was found.
    for (const stored of [1, 3, 5, 6, 7, 20]) {
      expect(fromCountOption(toCountOption(stored, BEDROOM_OPTIONS), stored)).toBe(stored)
    }
  })
})
