/**
 * Plan-tier helpers.
 *
 * The sidebar badge and the FeatureGate lock message both need to tell a
 * landlord which plan a locked feature requires. That "required plan" is a
 * property of the CMS plan matrix, not of the tenant's own feature list —
 * `getMyFeatures()` only says what the tenant HAS, so it can never answer
 * "what would unlock this?".
 *
 * The answer lives in `getAvailablePlans()`, which returns every plan with its
 * feature flags. `buildFeaturePlanMap` folds that into a single lookup:
 * featureKey → the CHEAPEST plan that enables it (its displayName + tier rank).
 * Both the sidebar and FeatureGate read from that map, so the badge and the
 * lock message always reflect the CMS and need no hardcoded plan names.
 */

import type { SubscriptionPlanPublicDto } from '@/lib/api/subscription-client'

/**
 * A plan's position on the tier ladder. The tenant-facing codes are
 * STARTER < GROWTH < PRO (mirrors the order used on the plans page); FREE sits
 * below every paid tier. Anything unrecognised is treated as the most
 * expensive tier so a known cheaper plan always wins the "minimum plan" lookup.
 */
export const PLAN_TIER_RANK: Record<string, number> = {
  FREE: -1,
  STARTER: 0,
  GROWTH: 1,
  PRO: 2,
}

/** Rank used for plans whose code is not in {@link PLAN_TIER_RANK}. */
const UNKNOWN_TIER_RANK = 999

export function tierRankOf(planCode: string | undefined): number {
  if (!planCode) return UNKNOWN_TIER_RANK
  
return PLAN_TIER_RANK[planCode] ?? UNKNOWN_TIER_RANK
}

/** Map a plan's tier rank to the MUI color used for its sidebar badge. */
export function planTierColor(rank: number): 'default' | 'info' | 'warning' | 'success' {
  if (rank >= PLAN_TIER_RANK.PRO) return 'warning'
  if (rank === PLAN_TIER_RANK.GROWTH) return 'info'
  
return 'default'
}

/** The badge/lock data resolved for a single feature key. */
export interface RequiredPlan {

  /** CMS display name of the minimum plan that enables the feature (e.g. "Growth"). */
  displayName: string

  /** Tier rank of that plan — drives badge color. */
  rank: number
}

/**
 * Builds featureKey → required plan from the full CMS plan list.
 *
 * Plans are walked cheapest → priciest, so the first plan that enables a
 * feature is by construction the minimum plan required to unlock it.
 */
export function buildFeaturePlanMap(
  plans: SubscriptionPlanPublicDto[]
): Record<string, RequiredPlan> {
  const result: Record<string, RequiredPlan> = {}

  const ordered = [...plans].sort((a, b) => tierRankOf(a.name) - tierRankOf(b.name))

  for (const plan of ordered) {
    const rank = tierRankOf(plan.name)

    for (const [featureKey, info] of Object.entries(plan.features ?? {})) {
      if (!info?.enabled) continue
      if (result[featureKey]) continue // already satisfied by a cheaper plan

      result[featureKey] = { displayName: plan.displayName, rank }
    }
  }

  return result
}
