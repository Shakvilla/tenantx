import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, Json } from '@/types/database/database.types'
import type { QueryOptions, PaginatedResult } from '@/types/api/response.types'
import { 
  unitRepository, 
  Unit, 
  UnitInsert, 
  UnitUpdate,
  UnitWithProperty 
} from '@/repositories/unit-repository'
import { propertyRepository } from '@/repositories/property-repository'
import { 
  CreateUnitPayload, 
  UpdateUnitPayload 
} from '@/lib/validation/schemas'
import { ValidationError, ConflictError, NotFoundError } from '@/lib/errors'
import { CreateUnitSchema, UpdateUnitSchema } from '@/lib/validation/schemas'

/**
 * Get units for a property with pagination.
 */
export async function getUnitsByProperty(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  propertyId: string,
  options: QueryOptions = {}
): Promise<PaginatedResult<Unit>> {
  // Verify property exists
  await propertyRepository.findByIdOrThrow(supabase, tenantId, propertyId)
  
  return unitRepository.findByProperty(supabase, tenantId, propertyId, options)
}

/**
 * Get a unit by ID.
 */
export async function getUnitById(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  id: string
): Promise<Unit> {
  return unitRepository.findByIdOrThrow(supabase, tenantId, id)
}

/**
 * Get available units across all properties.
 */
export async function getAvailableUnits(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  options: QueryOptions & { propertyId?: string; minRent?: number; maxRent?: number } = {}
): Promise<PaginatedResult<UnitWithProperty>> {
  return unitRepository.findAvailable(supabase, tenantId, options)
}

/**
 * Create a new unit for a property.
 */
export async function createUnit(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  propertyId: string,
  payload: CreateUnitPayload
): Promise<Unit> {
  // Validate input
  const validation = CreateUnitSchema.safeParse(payload)
  
  if (!validation.success) {
    throw ValidationError.fromZodError(validation.error)
  }

  const data = validation.data

  // Verify property exists
  await propertyRepository.findByIdOrThrow(supabase, tenantId, propertyId)

  // Check for duplicate unit number in property
  const exists = await unitRepository.existsByUnitNo(
    supabase, 
    tenantId, 
    propertyId, 
    data.unitNo
  )
  
  if (exists) {
    throw ConflictError.duplicate('Unit', 'unit_no')
  }

  // Map payload to database format
  const insertData: Omit<UnitInsert, 'tenant_id' | 'property_id'> = {
    unit_no: data.unitNo,
    floor: data.floor,
    type: data.type,
    size_sqft: data.sizeSqft,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    rent: data.rent,
    deposit: data.deposit,
    currency: data.currency || 'GHS',
    status: data.status || 'available',
    amenities: data.amenities,
    features: data.features as Json | undefined,
    images: data.images,
    tenant_record_id: data.tenantRecordId,
  }

  return unitRepository.createForProperty(supabase, tenantId, propertyId, insertData)
}

/**
 * Update a unit (full update).
 */
export async function updateUnit(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  id: string,
  payload: CreateUnitPayload
): Promise<Unit> {
  // Validate input
  const validation = CreateUnitSchema.safeParse(payload)
  
  if (!validation.success) {
    throw ValidationError.fromZodError(validation.error)
  }

  const data = validation.data

  // Get existing unit to get property_id
  const existingUnit = await unitRepository.findByIdOrThrow(supabase, tenantId, id)

  // Check for duplicate unit number in property (excluding self)
  const exists = await unitRepository.existsByUnitNo(
    supabase, 
    tenantId, 
    existingUnit.property_id, 
    data.unitNo,
    id
  )
  
  if (exists) {
    throw ConflictError.duplicate('Unit', 'unit_no')
  }

  // Map payload to database format
  const updateData: UnitUpdate = {
    unit_no: data.unitNo,
    floor: data.floor,
    type: data.type,
    size_sqft: data.sizeSqft,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    rent: data.rent,
    deposit: data.deposit,
    currency: data.currency,
    status: data.status,
    amenities: data.amenities,
    features: data.features as Json | undefined,
    images: data.images,
    tenant_record_id: data.tenantRecordId,
  }

  return unitRepository.update(supabase, tenantId, id, updateData)
}

/**
 * Partially update a unit.
 */
export async function patchUnit(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  id: string,
  payload: UpdateUnitPayload
): Promise<Unit> {
  // Validate input
  const validation = UpdateUnitSchema.safeParse(payload)
  
  if (!validation.success) {
    throw ValidationError.fromZodError(validation.error)
  }

  const data = validation.data

  // Check for duplicate unit number if updating (excluding self)
  if (data.unitNo) {
    const existingUnit = await unitRepository.findByIdOrThrow(supabase, tenantId, id)
    const exists = await unitRepository.existsByUnitNo(
      supabase, 
      tenantId, 
      existingUnit.property_id, 
      data.unitNo,
      id
    )
    
    if (exists) {
      throw ConflictError.duplicate('Unit', 'unit_no')
    }
  }

  // Map only provided fields
  const updateData: UnitUpdate = {}

  if (data.unitNo !== undefined) updateData.unit_no = data.unitNo
  if (data.floor !== undefined) updateData.floor = data.floor
  if (data.type !== undefined) updateData.type = data.type
  if (data.sizeSqft !== undefined) updateData.size_sqft = data.sizeSqft
  if (data.bedrooms !== undefined) updateData.bedrooms = data.bedrooms
  if (data.bathrooms !== undefined) updateData.bathrooms = data.bathrooms
  if (data.rent !== undefined) updateData.rent = data.rent
  if (data.deposit !== undefined) updateData.deposit = data.deposit
  if (data.currency !== undefined) updateData.currency = data.currency
  if (data.status !== undefined) updateData.status = data.status
  if (data.amenities !== undefined) updateData.amenities = data.amenities
  if (data.features !== undefined) updateData.features = data.features as Json
  if (data.images !== undefined) updateData.images = data.images
  if (data.tenantRecordId !== undefined) updateData.tenant_record_id = data.tenantRecordId

  return unitRepository.update(supabase, tenantId, id, updateData)
}

/**
 * Delete a unit.
 */
export async function deleteUnit(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  id: string
): Promise<void> {
  return unitRepository.delete(supabase, tenantId, id)
}

/**
 * Assign a tenant to a unit.
 */
export async function assignTenantToUnit(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  unitId: string,
  tenantRecordId: string
): Promise<Unit> {
  return unitRepository.assignTenant(supabase, tenantId, unitId, tenantRecordId)
}

/**
 * Remove tenant from a unit.
 */
export async function removeTenantFromUnit(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  unitId: string
): Promise<Unit> {
  return unitRepository.removeTenant(supabase, tenantId, unitId)
}
