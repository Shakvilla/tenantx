import { describe, it, expect } from 'vitest'

import {
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  ROOM_OPTIONS,
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
