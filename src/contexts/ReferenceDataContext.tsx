'use client'

/**
 * ReferenceDataContext
 *
 * Fetches all static lookup data once from GET /api/v1/reference/all
 * and makes it available to the entire app via context.
 *
 * Usage:
 *   const { ref, isLoading } = useReferenceData()
 *   ref.propertyTypes  // ReferenceItem[]
 *   ref.amenities      // Amenity[]
 *   ref.regions        // Region[]
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { getAllReferenceData } from '@/lib/api/reference'
import type { AllReferenceData, ReferenceItem, Amenity, Region } from '@/types/reference'

// ---------------------------------------------------------------------------
// Empty defaults — used before data loads so consumers never get undefined
// ---------------------------------------------------------------------------

const EMPTY: AllReferenceData = {
  propertyTypes: [],
  propertyConditions: [],
  propertyStatuses: [],
  amenities: [],
  unitTypes: [],
  unitStatuses: [],
  rentFrequencies: [],
  maintenancePriorities: [],
  maintenanceStatuses: [],
  maintainerStatuses: [],
  maintainerSpecializations: [],
  invoiceStatuses: [],
  agreementTypes: [],
  agreementStatuses: [],
  paymentMethods: [],
  paymentFrequencies: [],
  messageTypes: [],
  messageStatuses: [],
  noticePriorities: [],
  salutations: [],
  maritalStatuses: [],
  incomeSources: [],
  incomeFrequencies: [],
  emergencyRelationships: [],
  memberStatuses: [],
  regions: []
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface ReferenceDataContextValue {
  /** All reference data. Empty arrays until loaded. */
  ref: AllReferenceData
  isLoading: boolean
  error: string | null
  /** Manually re-fetch if needed */
  refresh: () => void
  /** Convenience: find region districts */
  getDistricts: (regionValue: string) => AllReferenceData['regions'][0]['districts']
  /** Convenience: find district cities */
  getCities: (regionValue: string, districtValue: string) => string[]
  /** Convenience: get label for a value from any list */
  getLabel: (list: ReferenceItem[], value: string) => string
  /** Convenience: get amenity by id */
  getAmenity: (id: string) => Amenity | undefined
}

// ---------------------------------------------------------------------------
// Context + hook
// ---------------------------------------------------------------------------

const ReferenceDataContext = createContext<ReferenceDataContextValue | null>(null)

export function useReferenceData(): ReferenceDataContextValue {
  const ctx = useContext(ReferenceDataContext)

  if (!ctx) {
    throw new Error('useReferenceData must be used inside <ReferenceDataProvider>')
  }

  return ctx
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ReferenceDataProvider({ children }: { children: ReactNode }) {
  const [ref, setRef] = useState<AllReferenceData>(EMPTY)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setError(null)

    getAllReferenceData()
      .then(data => {
        if (!cancelled) {
          setRef(data)
          setIsLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          // Use warn (not error) — 503/maintenance failures are expected during
          // downtime and should not flood the console as red errors.
          console.warn('[ReferenceData] Failed to load:', err.message)
          setError(err.message)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [tick])

  const refresh = () => setTick(t => t + 1)

  const getDistricts = (regionValue: string) => {
    return ref.regions.find(r => r.value === regionValue)?.districts ?? []
  }

  const getCities = (regionValue: string, districtValue: string) => {
    const region = ref.regions.find(r => r.value === regionValue)
    const district = region?.districts.find(d => d.value === districtValue)

    return district?.cities ?? []
  }

  const getLabel = (list: ReferenceItem[], value: string): string => {
    return list.find(item => item.value === value)?.label ?? value
  }

  const getAmenity = (id: string): Amenity | undefined => {
    return ref.amenities.find(a => a.id === id)
  }

  return (
    <ReferenceDataContext.Provider
      value={{ ref, isLoading, error, refresh, getDistricts, getCities, getLabel, getAmenity }}
    >
      {children}
    </ReferenceDataContext.Provider>
  )
}
