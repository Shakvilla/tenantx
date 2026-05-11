/**
 * Reference Data Types
 * Mirrors the backend ReferenceItemDto, AmenityDto, RegionDto, DistrictDto
 */

export interface ReferenceItem {
  value: string
  label: string
  description: string
}

export interface Amenity {
  id: string
  name: string
  description: string
  icon: string
}

export interface District {
  value: string
  label: string
  region: string
  cities: string[]
}

export interface Region {
  value: string
  label: string
  districts: District[]
}

export interface AllReferenceData {
  propertyTypes: ReferenceItem[]
  propertyConditions: ReferenceItem[]
  propertyStatuses: ReferenceItem[]
  amenities: Amenity[]
  unitTypes: ReferenceItem[]
  unitStatuses: ReferenceItem[]
  rentFrequencies: ReferenceItem[]
  maintenancePriorities: ReferenceItem[]
  maintenanceStatuses: ReferenceItem[]
  maintainerStatuses: ReferenceItem[]
  maintainerSpecializations: ReferenceItem[]
  invoiceStatuses: ReferenceItem[]
  agreementTypes: ReferenceItem[]
  agreementStatuses: ReferenceItem[]
  paymentMethods: ReferenceItem[]
  paymentFrequencies: ReferenceItem[]
  messageTypes: ReferenceItem[]
  messageStatuses: ReferenceItem[]
  noticePriorities: ReferenceItem[]
  salutations: ReferenceItem[]
  maritalStatuses: ReferenceItem[]
  incomeSources: ReferenceItem[]
  incomeFrequencies: ReferenceItem[]
  emergencyRelationships: ReferenceItem[]
  memberStatuses: ReferenceItem[]
  regions: Region[]
}
