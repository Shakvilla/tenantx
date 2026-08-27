/**
 * Reference Data API Client
 *
 * Fetches static lookup data (enums, amenities, Ghana regions) from the backend.
 * These endpoints are public — no auth token required.
 * Call getAllReferenceData() once at app load and cache via ReferenceDataContext.
 */

import { API_BASE } from './client'
import type { AllReferenceData, ReferenceItem, Amenity, Region, District } from '@/types/reference'

const BASE = `${API_BASE}/reference`

// ---------------------------------------------------------------------------
// Bulk fetch — recommended approach: call once, store in context
// ---------------------------------------------------------------------------

export async function getAllReferenceData(): Promise<AllReferenceData> {
  // DASHBOARD-P3-07: this is a near-static ~216-row reference table that changes approximately
  // never — 'no-store' refetched it on every load. Let the browser cache it.
  const res = await fetch(`${BASE}/all`, { cache: 'force-cache' })

  if (!res.ok) throw new Error(`Failed to fetch reference data: ${res.status}`)

  return res.json()
}

// ---------------------------------------------------------------------------
// Individual fetches — use only when you need a single category on demand
// ---------------------------------------------------------------------------

async function fetchList<T>(path: string): Promise<T[]> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' })

  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)

  return res.json()
}

/**
 * The Ghana Post postcode prefix table, ~216 rows. Fetched once and held in
 * context: decoding a code as the landlord types it has to feel instant, and a
 * round-trip per keystroke for a table this small would be silly.
 *
 * `regionValue` and `districtValue` are null where the published district has
 * since been split, so the prefix is known but does not identify one of ours.
 */
export type PostcodeDistrict = {
  prefix: string
  regionValue: string | null
  districtValue: string | null
  sourceLabel: string
}

export const getPostcodeDistricts      = () => fetchList<PostcodeDistrict>('/postcode-districts')

export const getPropertyTypes          = () => fetchList<ReferenceItem>('/property-types')
export const getPropertyConditions     = () => fetchList<ReferenceItem>('/property-conditions')
export const getPropertyStatuses       = () => fetchList<ReferenceItem>('/property-statuses')
export const getAmenities              = () => fetchList<Amenity>('/amenities')
export const getUnitTypes              = () => fetchList<ReferenceItem>('/unit-types')
export const getUnitStatuses           = () => fetchList<ReferenceItem>('/unit-statuses')
export const getRentFrequencies        = () => fetchList<ReferenceItem>('/rent-frequencies')
export const getMaintenancePriorities  = () => fetchList<ReferenceItem>('/maintenance-priorities')
export const getMaintenanceStatuses    = () => fetchList<ReferenceItem>('/maintenance-statuses')
export const getMaintainerStatuses     = () => fetchList<ReferenceItem>('/maintainer-statuses')
export const getMaintainerSpecializations = () => fetchList<ReferenceItem>('/maintainer-specializations')
export const getInvoiceStatuses        = () => fetchList<ReferenceItem>('/invoice-statuses')
export const getAgreementTypes         = () => fetchList<ReferenceItem>('/agreement-types')
export const getAgreementStatuses      = () => fetchList<ReferenceItem>('/agreement-statuses')
export const getPaymentMethods         = () => fetchList<ReferenceItem>('/payment-methods')
export const getPaymentFrequencies     = () => fetchList<ReferenceItem>('/payment-frequencies')
export const getMessageTypes           = () => fetchList<ReferenceItem>('/message-types')
export const getMessageStatuses        = () => fetchList<ReferenceItem>('/message-statuses')
export const getNoticePriorities       = () => fetchList<ReferenceItem>('/notice-priorities')
export const getSalutations            = () => fetchList<ReferenceItem>('/salutations')
export const getMaritalStatuses        = () => fetchList<ReferenceItem>('/marital-statuses')
export const getIncomeSources          = () => fetchList<ReferenceItem>('/income-sources')
export const getIncomeFrequencies      = () => fetchList<ReferenceItem>('/income-frequencies')
export const getEmergencyRelationships = () => fetchList<ReferenceItem>('/emergency-relationships')
export const getMemberStatuses         = () => fetchList<ReferenceItem>('/member-statuses')
export const getRegions                = () => fetchList<Region>('/regions')

export const getDistricts = (region?: string) =>
  fetchList<District>(`/districts${region ? `?region=${encodeURIComponent(region)}` : ''}`)

export const getCities = (district?: string) =>
  fetchList<string>(`/cities${district ? `?district=${encodeURIComponent(district)}` : ''}`)


/**
 * What the platform ALLOWS, as opposed to what it defines.
 *
 * Separate call from getAllReferenceData() on purpose: that one is static enums and is cached
 * hard, this one reads a setting an administrator can change.
 */
export interface PlatformPolicy {
  multiCurrencyEnabled: boolean
  baseCurrency: string
}

export async function getPlatformPolicy(): Promise<PlatformPolicy> {
  // NOT force-cache, unlike /all: an administrator can change this and the change has to be
  // visible on the next load rather than whenever the browser feels like revalidating.
  const res = await fetch(`${BASE}/platform-policy`, { cache: 'no-store' })

  if (!res.ok) throw new Error(`Failed to fetch platform policy: ${res.status}`)

  return res.json()
}
