'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'

import {
  getMySubscription,
  getMyFeatures,
  getAvailablePlans,
  type TenantSubscriptionDto,
} from '@/lib/api/subscription-client'
import { buildFeaturePlanMap, type RequiredPlan } from '@/lib/subscription/planTiers'
import { useAuth } from '@/contexts/AuthContext'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubscriptionContextValue {
  subscription: TenantSubscriptionDto | null
  features: Record<string, boolean>
  isLoading: boolean

  /** Call after upgrade/downgrade to force a refresh */
  refresh: () => Promise<void>

  /** Convenience: check if a feature key is enabled */
  hasFeature: (key: string) => boolean

  /** True when unit count is at or above the cap */
  isAtUnitCap: boolean

  /** True when the tenant is trialing on a plan they were auto-defaulted to (skipped plan selection at signup). */
  planSelectionRequired: boolean

  /**
   * featureKey → the minimum plan (CMS displayName + tier rank) that enables
   * it. Derived from `getAvailablePlans()`; used to label locked features with
   * the plan required to unlock them (sidebar badge, FeatureGate message).
   */
  featurePlans: Record<string, RequiredPlan>
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext)

  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider')

  return ctx
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const isAgentSession = user?.userType === 'AGENT'

  const [subscription, setSubscription] = useState<TenantSubscriptionDto | null>(null)
  const [features, setFeatures] = useState<Record<string, boolean>>({})
  const [featurePlans, setFeaturePlans] = useState<Record<string, RequiredPlan>>({})
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isAuthenticated || isAgentSession) {
      setSubscription(null)
      setFeatures({})
      setFeaturePlans({})
      setIsLoading(false)

      return
    }
    setIsLoading(true)

    try {
      const [sub, feats] = await Promise.all([getMySubscription(), getMyFeatures()])

      setSubscription(sub)
      setFeatures(feats)
    } catch {
      // Non-fatal: subscription data unavailable (e.g. no active session yet)
    }

    // Plan data is only used to LABEL locked features (sidebar badge / FeatureGate
    // message). A failure here must not block the feature flags themselves, which
    // is why it is fetched separately and best-effort.
    try {
      setFeaturePlans(buildFeaturePlanMap(await getAvailablePlans()))
    } catch {
      setFeaturePlans({})
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, isAgentSession])

  useEffect(() => {
    if (isAuthenticated && !isAgentSession) load()
    else {
      setSubscription(null)
      setFeatures({})
      setFeaturePlans({})
    }
  }, [isAuthenticated, isAgentSession, load])

  // Re-fetch whenever the tab becomes visible and every 5 minutes.
  // Ensures admin feature-flag overrides reach live sessions without a re-login.
  useEffect(() => {
    if (!isAuthenticated || isAgentSession) return

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') load()
    }

    document.addEventListener('visibilitychange', handleVisibility)

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, 5 * 60 * 1000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(interval)
    }
  }, [isAuthenticated, isAgentSession, load])

  useEffect(() => {
    if (!isAuthenticated || isAgentSession) return

    const handleLocked = () => void load()

    window.addEventListener('SUBSCRIPTION_LOCKED', handleLocked)

    return () => window.removeEventListener('SUBSCRIPTION_LOCKED', handleLocked)
  }, [isAuthenticated, isAgentSession, load])

  const hasFeature = useCallback((key: string) => !!features[key], [features])

  const isAtUnitCap = Boolean(
    subscription &&
    subscription.unitCap !== null &&
    subscription.unitCount >= subscription.unitCap
  )

  const planSelectionRequired = subscription?.status === 'TRIALING' && !subscription?.planSelectionCompleted

  return (
    <SubscriptionContext.Provider
      value={{ subscription, features, isLoading, refresh: load, hasFeature, isAtUnitCap, planSelectionRequired, featurePlans }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}
