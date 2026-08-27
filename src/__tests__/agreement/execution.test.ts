import { describe, it, expect } from 'vitest'

import { assessExecution, listMissing } from '@/lib/agreement/execution'

describe('assessExecution', () => {
  it('treats an agreement with all three signals as executed', () => {
    const result = assessExecution({
      signedDate: '2026-08-01',
      witnessName: 'Yaw Boateng',
      documentUrl: 'https://ik.imagekit.io/x/agreement.pdf'
    })

    expect(result.fullyExecuted).toBe(true)
    expect(result.missing).toEqual([])
  })

  it('names what is outstanding on the record onboarding actually creates', () => {
    // AGR-2026-001 as onboarding wrote it: no signature date, no witness, no document.
    const result = assessExecution({ signedDate: null, witnessName: '', documentUrl: null })

    expect(result.fullyExecuted).toBe(false)
    expect(result.missing).toEqual([
      'the date it was signed',
      'a witness',
      'a copy of the signed agreement'
    ])
  })

  it('does not count whitespace as a signature or a witness', () => {
    const result = assessExecution({ signedDate: '  ', witnessName: '   ', documentUrl: '' })

    expect(result.signed).toBe(false)
    expect(result.witnessed).toBe(false)
    expect(result.documentAttached).toBe(false)
  })

  it('handles a missing agreement without throwing', () => {
    expect(assessExecution(null).fullyExecuted).toBe(false)
    expect(assessExecution(undefined).missing).toHaveLength(3)
  })
})

describe('listMissing', () => {
  it('reads as a sentence', () => {
    expect(listMissing(['a witness'])).toBe('a witness')
    expect(listMissing(['a witness', 'a copy of the signed agreement']))
      .toBe('a witness and a copy of the signed agreement')
    expect(listMissing(['the date it was signed', 'a witness', 'a copy of the signed agreement']))
      .toBe('the date it was signed, a witness and a copy of the signed agreement')
  })
})
