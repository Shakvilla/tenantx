/**
 * A listing is only shown publicly when it is ACTIVE *and* its unit is still
 * available — the second half is enforced in the query, not stored. So
 * `status` alone never tells you whether the public can see it; `unitStatus`
 * is the other half.
 */
export type UnitAvailability = 'available' | 'occupied' | 'reserved' | 'maintenance'

export interface VacancyListing {
  id: string
  unitId: string
  unitNo: string
  unitStatus: UnitAvailability
  unitType: string
  bedrooms: number | null
  bathrooms: number | null
  sizeSqft: number | null
  rent: number
  currency: string
  amenities: string[]
  images: string[]
  propertyId: string
  propertyName: string
  propertyAddress: string
  title: string
  description: string | null
  contactPhone: string | null
  contactEmail: string | null
  availableFrom: string | null   // ISO date
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string | null
}

export interface CreateVacancyListingPayload {
  unitId: string
  title: string
  description?: string
  contactPhone?: string
  contactEmail?: string
  availableFrom?: string
  status?: 'ACTIVE' | 'INACTIVE'
}

export interface UpdateVacancyListingPayload {
  title?: string
  description?: string
  contactPhone?: string
  contactEmail?: string
  availableFrom?: string
  status?: 'ACTIVE' | 'INACTIVE'
}
