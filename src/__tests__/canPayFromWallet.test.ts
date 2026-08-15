import { describe, it, expect } from 'vitest'
import { canPayFromWallet } from '@/utils/canPayFromWallet'

describe('canPayFromWallet', () => {
  it('is true when balance exceeds amount', () => {
    expect(canPayFromWallet(100, 50)).toBe(true)
  })
  it('is true when balance exactly equals amount (>= rule)', () => {
    expect(canPayFromWallet(50, 50)).toBe(true)
  })
  it('is false when balance is below amount', () => {
    expect(canPayFromWallet(49.99, 50)).toBe(false)
  })
  it('is false for a zero or non-positive amount (nothing to pay)', () => {
    expect(canPayFromWallet(100, 0)).toBe(false)
  })
})
