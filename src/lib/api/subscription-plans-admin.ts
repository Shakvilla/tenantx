/**
 * The plan CMS's API surface.
 *
 * Kept apart from `admin-auth-client.ts` because that file is already large and serves the whole
 * admin console; these calls belong to one screen. It reuses that file's axios instance, so the
 * admin token, the device header and the 401 handling all still apply.
 */

import { adminClient } from './admin-auth-client'

// ---------------------------------------------------------------------------
// Wire types — these mirror the backend records exactly
// ---------------------------------------------------------------------------

export type BillingMetric = 'UNITS' | 'OCCUPANTS' | 'PROPERTIES'
export type PricingMode = 'FLAT' | 'GRADUATED' | 'VOLUME'
export type BillingCycleName = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

/**
 * One band of a plan's tier table. `toQty: null` means open-ended.
 *
 * Prices are STRINGS, and stay strings. They are `NUMERIC(12,4)` server-side; parsing them into a
 * JS number to do arithmetic loses precision on exactly the values that matter.
 */
export interface PlanTier {
  fromQty: number
  toQty: number | null
  flatPrice: string
  perUnitPrice: string
}

export interface PlanCycle {
  cycle: BillingCycleName
  discountPct: string
  enabled: boolean
}

export interface PlanAcknowledgement {
  impactHash: string
  affectedSubscribers: number
}

/** Everything the write body accepts. Mirrors `PlanWriteRequestDto`. */
export interface PlanWriteBody {
  code: string
  name: string
  displayName: string
  description: string | null
  status: PlanStatus
  billingMetric: BillingMetric
  pricingMode: PricingMode
  currency: string
  maxQty: number | null
  selfServeMaxQty: number | null
  isPublic: boolean
  sortOrder: number
  tiers: PlanTier[]
  /**
   * Never omit this. The server replaces cycle rows wholesale, so an empty or missing list
   * deletes every one — after which annual subscribers renew at full price.
   */
  cycles: PlanCycle[]
  featureKeys: string[]
  popular: boolean
  marketingFeatures: string[]
  acknowledgement?: PlanAcknowledgement
}

/** What `GET /{planId}` returns: the write body, plus identity and a live count. */
export interface PlanDetail extends Omit<PlanWriteBody, 'acknowledgement'> {
  id: string
  subscriberCount: number
}

/** A row in the admin plans list. */
export interface PlanSummary {
  id: string
  code: string
  name: string
  displayName: string
  status: PlanStatus
  entryPrice: string
  pricePerUnit: string
  subscriberCount: number
  popular: boolean
}

/** The 409 body: what would change, whom it touches, and a token over both. */
/** A capability a plan may grant, as the registry defines it. */
export interface GrantableFeature {
  key: string
  label: string
  note: string | null
}

export interface PlanImpact {
  warnings: string[]
  affectedSubscribers: number
  impactHash: string
}

export interface PriceCurvePoint {
  quantity: number
  amount: string
  effectiveUnitPrice: string
  salesLed: boolean
}

export interface PriceCurve {
  points: PriceCurvePoint[]
  monotonic: boolean
  risingAt: number[]
}

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

/**
 * A 409 is not an error the admin caused — it is the server asking for consent to a change it
 * has described. Raising it as a distinct type lets the caller branch on meaning rather than on
 * a status code, and keeps a 422 (a hard block, which no acknowledgement can clear) from being
 * mistaken for something confirmable.
 */
export class PlanImpactRequired extends Error {
  constructor(public readonly impact: PlanImpact) {
    super('Plan change requires acknowledgement')
    this.name = 'PlanImpactRequired'
  }
}

export async function getAdminPlans(): Promise<PlanSummary[]> {
  const res = await adminClient.get('/subscription-plans')

  return res.data
}

/**
 * The keys a plan may grant, from the server's own registry.
 *
 * Never hardcode this list. The editor previously carried a copied array of ten: six real
 * capabilities were missing and two entries were not FeatureKeys at all, so ticking either
 * produced a 422 on save. A copied list drifts the moment the enum changes; this one cannot.
 */
export async function getGrantableFeatures(): Promise<GrantableFeature[]> {
  const res = await adminClient.get('/subscription-plans/grantable-features')

  return res.data
}

export async function getPlanDetail(planId: string): Promise<PlanDetail> {
  const res = await adminClient.get(`/subscription-plans/${planId}`)

  return res.data
}

export async function savePlan(planId: string | null, body: PlanWriteBody): Promise<PlanDetail> {
  try {
    const res = planId
      ? await adminClient.put(`/subscription-plans/${planId}`, body)
      : await adminClient.post('/subscription-plans', body)

    return res.data
  } catch (err: any) {
    // 409 ONLY. A 422 is a hard block — a gapped tier table, an unknown feature key, a ceiling
    // below a live subscriber — and turning one into a confirmable dialog would offer the admin
    // a button that cannot work.
    if (err?.response?.status === 409) {
      throw new PlanImpactRequired(err.response.data as PlanImpact)
    }

    throw err
  }
}

export async function deletePlan(planId: string): Promise<void> {
  await adminClient.delete(`/subscription-plans/${planId}`)
}

export async function getPriceCurve(planId: string, quantities?: number[]): Promise<PriceCurve> {
  const res = await adminClient.get(`/subscription-plans/${planId}/price-curve`, {
    params: quantities?.length ? { quantities: quantities.join(',') } : undefined
  })

  return res.data
}
