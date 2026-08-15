export type OnboardingEvent =
  | 'onboarding_step_completed'
  | 'onboarding_wizard_dismissed'
  | 'onboarding_wizard_completed'

// Analytics sink stub (OQ-5): no analytics library chosen yet. Log for now.
export function trackOnboardingEvent(event: OnboardingEvent, payload: Record<string, unknown> = {}): void {
  // eslint-disable-next-line no-console
  console.log('[onboarding]', event, payload)
}
