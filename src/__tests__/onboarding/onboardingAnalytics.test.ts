import { afterEach, describe, expect, it, vi } from 'vitest'

import { trackOnboardingEvent } from '@/views/onboarding/onboardingAnalytics'

afterEach(() => vi.restoreAllMocks())

describe('trackOnboardingEvent', () => {
  it('logs the event name and payload', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    trackOnboardingEvent('onboarding_step_completed', { step: 1 })
    expect(spy).toHaveBeenCalledWith('[onboarding]', 'onboarding_step_completed', { step: 1 })
  })

  it('works with no payload', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    trackOnboardingEvent('onboarding_wizard_completed')
    expect(spy).toHaveBeenCalledWith('[onboarding]', 'onboarding_wizard_completed', {})
  })
})
