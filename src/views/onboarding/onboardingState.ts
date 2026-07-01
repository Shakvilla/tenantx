import type { OnboardingState } from './onboardingTypes'

const stateKey = (tenantId: string) => `onboarding_state_${tenantId}`
const dismissKey = (tenantId: string) => `onboarding_dismissed_${tenantId}`

export function getOnboardingState(tenantId: string): OnboardingState | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(stateKey(tenantId))

  if (!raw) return null

  try {
    return JSON.parse(raw) as OnboardingState
  } catch {
    return null
  }
}

export function saveOnboardingState(tenantId: string, state: OnboardingState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(stateKey(tenantId), JSON.stringify(state))
}

export function clearOnboardingState(tenantId: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(stateKey(tenantId))
}

export function isOnboardingDismissed(tenantId: string): boolean {
  if (typeof window === 'undefined') return false
  
return localStorage.getItem(dismissKey(tenantId)) === 'true'
}

export function setOnboardingDismissed(tenantId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(dismissKey(tenantId), 'true')
}
