import { describe, it, expect } from 'vitest'

import { unitTypeLabel } from '@/lib/units/unitTypeLabel'

/**
 * The units list printed the stored value with a `capitalize` class, so a self-contained room
 * read "Self_contained" — the underscore included. The landlord who asked for these Ghanaian
 * types then found them shown in the database's handwriting rather than his own.
 */
const REFERENCE = [
  { value: 'single_room', label: 'Single Room' },
  { value: 'chamber_and_hall', label: 'Chamber and Hall' },
  { value: 'self_contained', label: 'Self-contained' }
]

describe('unitTypeLabel', () => {
  it('uses the reference label, hyphens and all', () => {
    expect(unitTypeLabel('self_contained', REFERENCE)).toBe('Self-contained')
    expect(unitTypeLabel('chamber_and_hall', REFERENCE)).toBe('Chamber and Hall')
  })

  it('never shows an underscore, even for a type the reference list has not got', () => {
    // A type added to the backend before the frontend hears about it must still read as words.
    expect(unitTypeLabel('boys_quarters', REFERENCE)).toBe('Boys quarters')
    expect(unitTypeLabel('self_contained', [])).toBe('Self contained')
    expect(unitTypeLabel('self_contained')).not.toContain('_')
  })

  it('renders nothing for a unit with no type', () => {
    expect(unitTypeLabel(null)).toBe('')
    expect(unitTypeLabel(undefined)).toBe('')
    expect(unitTypeLabel('')).toBe('')
  })
})
