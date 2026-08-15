import { afterEach, describe, expect, it } from 'vitest'

import {
  getOnboardingState,
  saveOnboardingState,
  clearOnboardingState,
  isOnboardingDismissed,
  setOnboardingDismissed
} from '@/views/onboarding/onboardingState'

afterEach(() => localStorage.clear())

describe('onboardingState', () => {
  it('returns null when no state stored', () => {
    expect(getOnboardingState('t1')).toBeNull()
  })

  it('round-trips saved state per tenant', () => {
    const state = { currentStep: 2, entityIds: { propertyId: 'p1', unitId: 'u1' } }
    saveOnboardingState('t1', state)
    expect(getOnboardingState('t1')).toEqual(state)
    // isolated per tenant
    expect(getOnboardingState('t2')).toBeNull()
  })

  it('returns null for corrupt JSON instead of throwing', () => {
    localStorage.setItem('onboarding_state_t1', '{not json')
    expect(getOnboardingState('t1')).toBeNull()
  })

  it('clears state for a tenant', () => {
    saveOnboardingState('t1', { currentStep: 1, entityIds: {} })
    clearOnboardingState('t1')
    expect(getOnboardingState('t1')).toBeNull()
  })

  it('tracks dismiss flag per tenant', () => {
    expect(isOnboardingDismissed('t1')).toBe(false)
    setOnboardingDismissed('t1')
    expect(isOnboardingDismissed('t1')).toBe(true)
    expect(isOnboardingDismissed('t2')).toBe(false)
  })
})
