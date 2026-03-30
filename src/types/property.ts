/**
 * Property types for frontend use
 */

/**
 * Property address structure
 */
export interface PropertyAddress {
  street: string
  city: string
  state?: string
  zip?: string
  country: string
}

/**
 * Property entity
 */
export interface Property {
  id: string
  tenantId: string
  name: string
  description?: string | null
  address: PropertyAddress
  
  // Location (Ghana-specific)
  region?: string | null
  district?: string | null
  gpsCode?: string | null
  
  // Classification
  type: 'residential' | 'commercial' | 'mixed' | 'house' | 'apartment'
  ownership: 'own' | 'lease'
  condition?: 'new' | 'good' | 'fair' | 'poor' | null
  
  // Features
  bedrooms?: number | null
  bathrooms?: number | null
  rooms?: number | null
  amenities?: string[] | null
  
  // Unit counts
  totalUnits: number
  occupiedUnits: number
  
  // Status
  status: 'active' | 'inactive' | 'maintenance'
  
  // Media
  images?: string[] | null
  thumbnailIndex?: number | null
  
  // Financial
  purchasePrice?: number | null
  currentValue?: number | null
  currency?: string | null
  
  // Timestamps
  createdAt: string
  updatedAt: string | null
}

/**
 * Property statistics
 */
export interface PropertyStats {
  total: number
  active: number
  inactive: number
  maintenance: number
  totalUnits: number
  occupiedUnits: number
  occupancyRate: number
}

/**
 * Unit entity
 */
export interface Unit {
  id: string
  tenantId: string
  propertyId: string
  unitNo: string
  floor?: number | null
  
  // Type
  type: 'studio' | '1br' | '2br' | '3br' | '4br+' | 'commercial' | 'office' | 'retail'
  
  // Size & features
  sizeSqft?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  amenities?: string[] | null
  
  // Financial
  rent: number
  deposit?: number | null
  currency?: string | null
  
  // Status
  status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  
  // Tenant
  tenantRecordId?: string | null
  
  // Media
  images?: string[] | null
  
  // Timestamps
  createdAt: string
  updatedAt: string | null
  
  // Joined data
  property?: {
    id: string
    name: string
  }
}

/**
 * Create property payload (frontend)
 */
export interface CreatePropertyPayload {
  name: string
  description?: string
  address: PropertyAddress
  type: Property['type']
  ownership: Property['ownership']
  region: string
  district: string
  gpsCode?: string
  condition?: Property['condition']
  status?: Property['status']
  bedrooms?: number
  bathrooms?: number
  rooms?: number
  amenities?: string[]
  images?: string[]
  thumbnailIndex?: number
  purchasePrice?: number
  currentValue?: number
  currency?: string
}

/**
 * Create unit payload (frontend)
 */
export interface CreateUnitPayload {
  unitNo: string
  floor?: number
  type: Unit['type']
  sizeSqft?: number
  bedrooms?: number
  bathrooms?: number
  rent: number
  deposit?: number
  currency?: string
  status?: Unit['status']
  amenities?: string[]
  images?: string[]
  tenantRecordId?: string
}
