import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database/database.types'
import type { QueryOptions, PaginatedResult } from '@/types/api/response.types'
import { 
  propertyRepository, 
  Property, 
  PropertyStats 
} from '@/repositories/property-repository'
import { 
  CreatePropertyPayload, 
  UpdatePropertyPayload,
  DraftPropertyPayload 
} from '@/lib/validation/schemas'
import { ValidationError, ConflictError } from '@/lib/errors'
import { CreatePropertySchema, UpdatePropertySchema, DraftPropertySchema } from '@/lib/validation/schemas'

/**
 * Extended property insert type that includes new fields from migration 009.
 * These fields will be in the generated types after running the migration.
 */
interface ExtendedPropertyInsert {
  name: string
  description?: string | null
  address: Record<string, unknown>
  type: string
  ownership: string
  region?: string | null
  district?: string | null
  gps_code?: string | null
  condition?: string | null
  status?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  rooms?: number | null
  amenities?: string[] | null
  images?: string[] | null
  thumbnail_index?: number | null
  purchase_price?: number | null
  current_value?: number | null
  currency?: string | null
}

/**
 * Get all properties with pagination and filters.
 */
export async function getProperties(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  options: QueryOptions & {
    status?: string
    type?: string
    region?: string
    district?: string
  } = {}
): Promise<PaginatedResult<Property>> {
  return propertyRepository.findAllWithFilters(supabase, tenantId, options)
}

/**
 * Get a property by ID.
 */
export async function getPropertyById(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  id: string
): Promise<Property> {
  return propertyRepository.findByIdOrThrow(supabase, tenantId, id)
}

/**
 * Create a new property.
 */
export async function createProperty(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  payload: CreatePropertyPayload
): Promise<Property> {
  // Validate input
  const validation = CreatePropertySchema.safeParse(payload)
  
  if (!validation.success) {
    throw ValidationError.fromZodError(validation.error)
  }

  const data = validation.data

  // Check for duplicate name
  const exists = await propertyRepository.existsByName(supabase, tenantId, data.name)
  
  if (exists) {
    throw ConflictError.duplicate('Property', 'name')
  }

  // Map payload to database format
  // Note: Fields from migration 009 (region, district, etc.) require type assertion
  const insertData: ExtendedPropertyInsert = {
    name: data.name,
    description: data.description,
    address: data.address as Record<string, unknown>,
    type: data.type,
    ownership: data.ownership,
    region: data.region,
    district: data.district,
    gps_code: data.gpsCode,
    condition: data.condition,
    status: data.status || 'active',
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    rooms: data.rooms,
    amenities: data.amenities,
    images: data.images,
    thumbnail_index: data.thumbnailIndex,
    purchase_price: data.purchasePrice,
    current_value: data.currentValue,
    currency: data.currency || 'GHS',
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return propertyRepository.create(supabase, tenantId, insertData as any)
}

/**
 * Save a property as draft (for incomplete forms).
 */
export async function saveDraft(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  payload: DraftPropertyPayload
): Promise<Property> {
  // Validate input with draft schema (less strict)
  const validation = DraftPropertySchema.safeParse(payload)
  
  if (!validation.success) {
    throw ValidationError.fromZodError(validation.error)
  }

  const data = validation.data

  // Check for duplicate name
  const exists = await propertyRepository.existsByName(supabase, tenantId, data.name)
  
  if (exists) {
    throw ConflictError.duplicate('Property', 'name')
  }

  // Map payload to database format (partial data)
  const insertData: Partial<ExtendedPropertyInsert> = {
    name: data.name,
    description: data.description,
    address: data.address as Record<string, unknown> || {},
    type: data.type || 'residential',
    ownership: data.ownership || 'own',
    region: data.region,
    district: data.district,
    gps_code: data.gpsCode,
    condition: data.condition,
    status: 'draft', // Always draft
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    rooms: data.rooms,
    amenities: data.amenities,
    images: data.images,
    thumbnail_index: data.thumbnailIndex,
    purchase_price: data.purchasePrice,
    current_value: data.currentValue,
    currency: data.currency || 'GHS',
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return propertyRepository.create(supabase, tenantId, insertData as any)
}

/**
 * Update a property draft.
 */
export async function updateDraft(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  id: string,
  payload: DraftPropertyPayload
): Promise<Property> {
  // Validate input with draft schema
  const validation = DraftPropertySchema.safeParse(payload)
  
  if (!validation.success) {
    throw ValidationError.fromZodError(validation.error)
  }

  const data = validation.data

  // Check for duplicate name (excluding self)
  const exists = await propertyRepository.existsByName(supabase, tenantId, data.name, id)
  
  if (exists) {
    throw ConflictError.duplicate('Property', 'name')
  }

  // Map payload to database format
  const updateData: Partial<ExtendedPropertyInsert> = {
    name: data.name,
    description: data.description,
    address: data.address as Record<string, unknown>,
    type: data.type,
    ownership: data.ownership,
    region: data.region,
    district: data.district,
    gps_code: data.gpsCode,
    condition: data.condition,
    status: 'draft', // Keep as draft
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    rooms: data.rooms,
    amenities: data.amenities,
    images: data.images,
    thumbnail_index: data.thumbnailIndex,
    purchase_price: data.purchasePrice,
    current_value: data.currentValue,
    currency: data.currency,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return propertyRepository.update(supabase, tenantId, id, updateData as any)
}

/**
 * Update a property (full update).
 */
export async function updateProperty(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  id: string,
  payload: CreatePropertyPayload
): Promise<Property> {
  // Validate input
  const validation = CreatePropertySchema.safeParse(payload)
  
  if (!validation.success) {
    throw ValidationError.fromZodError(validation.error)
  }

  const data = validation.data

  // Check for duplicate name (excluding self)
  const exists = await propertyRepository.existsByName(supabase, tenantId, data.name, id)
  
  if (exists) {
    throw ConflictError.duplicate('Property', 'name')
  }

  // Map payload to database format
  const updateData: Partial<ExtendedPropertyInsert> = {
    name: data.name,
    description: data.description,
    address: data.address as Record<string, unknown>,
    type: data.type,
    ownership: data.ownership,
    region: data.region,
    district: data.district,
    gps_code: data.gpsCode,
    condition: data.condition,
    status: data.status,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    rooms: data.rooms,
    amenities: data.amenities,
    images: data.images,
    thumbnail_index: data.thumbnailIndex,
    purchase_price: data.purchasePrice,
    current_value: data.currentValue,
    currency: data.currency,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return propertyRepository.update(supabase, tenantId, id, updateData as any)
}

/**
 * Partially update a property.
 */
export async function patchProperty(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  id: string,
  payload: UpdatePropertyPayload
): Promise<Property> {
  // Validate input
  const validation = UpdatePropertySchema.safeParse(payload)
  
  if (!validation.success) {
    throw ValidationError.fromZodError(validation.error)
  }

  const data = validation.data

  // Check for duplicate name if updating name (excluding self)
  if (data.name) {
    const exists = await propertyRepository.existsByName(supabase, tenantId, data.name, id)
    
    if (exists) {
      throw ConflictError.duplicate('Property', 'name')
    }
  }

  // Map only provided fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.address !== undefined) updateData.address = data.address
  if (data.type !== undefined) updateData.type = data.type
  if (data.ownership !== undefined) updateData.ownership = data.ownership
  if (data.region !== undefined) updateData.region = data.region
  if (data.district !== undefined) updateData.district = data.district
  if (data.gpsCode !== undefined) updateData.gps_code = data.gpsCode
  if (data.condition !== undefined) updateData.condition = data.condition
  if (data.status !== undefined) updateData.status = data.status
  if (data.bedrooms !== undefined) updateData.bedrooms = data.bedrooms
  if (data.bathrooms !== undefined) updateData.bathrooms = data.bathrooms
  if (data.rooms !== undefined) updateData.rooms = data.rooms
  if (data.amenities !== undefined) updateData.amenities = data.amenities
  if (data.images !== undefined) updateData.images = data.images
  if (data.thumbnailIndex !== undefined) updateData.thumbnail_index = data.thumbnailIndex
  if (data.purchasePrice !== undefined) updateData.purchase_price = data.purchasePrice
  if (data.currentValue !== undefined) updateData.current_value = data.currentValue
  if (data.currency !== undefined) updateData.currency = data.currency

  return propertyRepository.update(supabase, tenantId, id, updateData)
}

/**
 * Delete a property.
 */
export async function deleteProperty(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  id: string
): Promise<void> {
  return propertyRepository.delete(supabase, tenantId, id)
}

/**
 * Get property statistics.
 */
export async function getPropertyStats(
  supabase: SupabaseClient<Database>,
  tenantId: string
): Promise<PropertyStats> {
  return propertyRepository.getStats(supabase, tenantId)
}
