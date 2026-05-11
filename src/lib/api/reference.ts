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
  const res = await fetch(`${BASE}/all`, { cache: 'no-store' })

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
