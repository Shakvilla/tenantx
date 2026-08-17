import { describe, it, expect } from 'vitest'

import { MOMO_NUMBER } from '@/types/wallet'

/**
 * The pattern that guards both money-out paths: linking a MoMo number and
 * requesting a withdrawal.
 *
 * It shipped as `/^0[2-9]\d{7}$/` — nine digits — beside an error message that
 * read "Enter a valid 10-digit Ghanaian number". Every real number a landlord
 * could type was rejected, so no number could be linked and no withdrawal could
 * be requested. The backend stores the value without validating it, so this
 * regex was the only gate, and it was closed.
 *
 * The nine-digit case below is the one that matters: it is what the broken
 * pattern accepted, and a test that only checked valid numbers would have
 * passed against the bug as long as it used a nine-digit fixture.
 */
describe('MOMO_NUMBER', () => {
  it.each([
    ['0244778899', 'MTN'],
    ['0201122334', 'MTN'],
    ['0501234567', 'MTN'],
    ['0271234567', 'AirtelTigo'],
    ['0561234567', 'AirtelTigo'],
    ['0201234567', 'Telecel'],
  ])('accepts %s, a real ten-digit Ghanaian number (%s)', number => {
    expect(MOMO_NUMBER.test(number)).toBe(true)
  })

  it('rejects a nine-digit number — what the broken pattern used to accept', () => {
    expect('024477889').toHaveLength(9)
    expect(MOMO_NUMBER.test('024477889')).toBe(false)
  })

  it.each([
    ['02447788990', 'eleven digits'],
    ['1244778899', 'does not start with 0'],
    ['0144778899', 'network digit below 2'],
    ['0044778899', 'network digit is 0'],
    ['024477889a', 'contains a letter'],
    ['024 477 8899', 'contains spaces'],
    ['+233244778899', 'international format'],
    ['', 'empty'],
  ])('rejects %s (%s)', number => {
    expect(MOMO_NUMBER.test(number)).toBe(false)
  })
})
