import { describe, it, expect } from 'vitest'

import {
  buildFeaturePlanMap,
  planTierColor,
  tierRankOf,
  PLAN_TIER_RANK,
} from '@/lib/subscription/planTiers'
import { getFeaturePlanBadge } from '@/data/navigation/verticalMenuData'

import type { SubscriptionPlanPublicDto } from '@/lib/api/subscription-client'

/**
 * The sidebar badge and the FeatureGate lock message must reflect the CMS plan
 * matrix rather than hardcoded "Basic"/"Pro" names. `buildFeaturePlanMap`
 * derives, for each feature, the cheapest plan that enables it; the badge and
 * the lock message are then labelled with that plan's displayName.
 */

const plan = (name: string, displayName: string, enabled: string[]): SubscriptionPlanPublicDto =>
  ({
    id: name.toLowerCase(),
    name,
    displayName,
    status: 'ACTIVE',
    pricePerUnit: 0,
    entryPrice: name === 'STARTER' ? 10 : name === 'GROWTH' ? 20 : 30,
    freeUnitCap: null,
    transactionFeePct: null,
    active: true,
    popular: false,
    pricingMode: 'FLAT',
    annualDiscountPct: null,
    tiers: [],
    features: Object.fromEntries(enabled.map(k => [k, { label: k, enabled: true }])),
  }) as unknown as SubscriptionPlanPublicDto

const PLANS: SubscriptionPlanPublicDto[] = [
  plan('STARTER', 'Starter', ['COMMUNICATION', 'EXPENSES']),
  plan('GROWTH', 'Growth', ['COMMUNICATION', 'EXPENSES', 'RENT_REVIEWS']),
  plan('PRO', 'Pro', ['COMMUNICATION', 'RENT_REVIEWS', 'LANDLORD_WALLET', 'UTILITIES_MANAGEMENT']),
]

describe('tierRankOf', () => {
  it('ranks the known ladder STARTER < GROWTH < PRO', () => {
    expect(tierRankOf('STARTER')).toBe(PLAN_TIER_RANK.STARTER)
    expect(tierRankOf('GROWTH')).toBe(PLAN_TIER_RANK.GROWTH)
    expect(tierRankOf('PRO')).toBe(PLAN_TIER_RANK.PRO)
  })

  it('sorts unknown plans above every known tier so known ones win the minimum lookup', () => {
    expect(tierRankOf('MYSTERY')).toBeGreaterThan(tierRankOf('PRO'))
    expect(tierRankOf(undefined)).toBeGreaterThan(tierRankOf('PRO'))
  })
})

describe('planTierColor', () => {
  it('maps Starter → default, Growth → info, Pro → warning', () => {
    expect(planTierColor(PLAN_TIER_RANK.STARTER)).toBe('default')
    expect(planTierColor(PLAN_TIER_RANK.GROWTH)).toBe('info')
    expect(planTierColor(PLAN_TIER_RANK.PRO)).toBe('warning')
  })
})

describe('buildFeaturePlanMap', () => {
  it('labels each feature with the cheapest plan that enables it', () => {
    const map = buildFeaturePlanMap(PLANS)

    // Enabled on STARTER, GROWTH and PRO → minimum is STARTER.
    expect(map.COMMUNICATION).toEqual({ displayName: 'Starter', rank: PLAN_TIER_RANK.STARTER })

    // Enabled on STARTER + GROWTH → minimum is STARTER.
    expect(map.EXPENSES).toEqual({ displayName: 'Starter', rank: PLAN_TIER_RANK.STARTER })

    // Enabled on GROWTH + PRO → minimum is GROWTH.
    expect(map.RENT_REVIEWS).toEqual({ displayName: 'Growth', rank: PLAN_TIER_RANK.GROWTH })

    // Enabled on PRO only → minimum is PRO.
    expect(map.LANDLORD_WALLET).toEqual({ displayName: 'Pro', rank: PLAN_TIER_RANK.PRO })
    expect(map.UTILITIES_MANAGEMENT).toEqual({ displayName: 'Pro', rank: PLAN_TIER_RANK.PRO })
  })

  it('omits features no plan enables', () => {
    const map = buildFeaturePlanMap(PLANS)

    expect(map.MEMBERS).toBeUndefined()
  })

  it('handles an empty or null feature matrix', () => {
    expect(buildFeaturePlanMap([])).toEqual({})
    const bare = plan('PRO', 'Pro', [])

    expect(buildFeaturePlanMap([bare])).toEqual({})
  })
})

describe('getFeaturePlanBadge', () => {
  it('returns the required plan displayName and its tier colour', () => {
    const map = buildFeaturePlanMap(PLANS)

    expect(getFeaturePlanBadge('RENT_REVIEWS', map)).toEqual({ label: 'Growth', color: 'info' })
    expect(getFeaturePlanBadge('LANDLORD_WALLET', map)).toEqual({ label: 'Pro', color: 'warning' })
  })

  it('returns null when the feature has no resolved plan', () => {
    expect(getFeaturePlanBadge('MEMBERS', buildFeaturePlanMap(PLANS))).toBeNull()
    expect(getFeaturePlanBadge('MEMBERS', {})).toBeNull()
  })
})
