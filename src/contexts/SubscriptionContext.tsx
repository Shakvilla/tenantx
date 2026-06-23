'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'

import { getMySubscription, getMyFeatures, type TenantSubscriptionDto } from '@/lib/api/subscription-client'
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
  const { isAuthenticated } = useAuth()

  const [subscription, setSubscription] = useState<TenantSubscriptionDto | null>(null)
  const [features, setFeatures] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const [sub, feats] = await Promise.all([getMySubscription(), getMyFeatures()])
      setSubscription(sub)
      setFeatures(feats)
    } catch {
      // Non-fatal: subscription data unavailable (e.g. no active session yet)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) load()
    else {
      setSubscription(null)
      setFeatures({})
    }
  }, [isAuthenticated, load])

  const hasFeature = useCallback((key: string) => !!features[key], [features])

  const isAtUnitCap = Boolean(
    subscription &&
    subscription.unitCap !== null &&
    subscription.unitCount >= subscription.unitCap
  )

  return (
    <SubscriptionContext.Provider
      value={{ subscription, features, isLoading, refresh: load, hasFeature, isAtUnitCap }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}
