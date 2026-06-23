import { useSubscription } from '@/contexts/SubscriptionContext'

/**
 * Returns true if the current tenant's subscription includes the given feature key.
 *
 * @example
 * const canCollectRent = useFeature('RENT_COLLECTION')
 */
export function useFeature(featureKey: string): boolean {
  const { hasFeature } = useSubscription()
  return hasFeature(featureKey)
}
