import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database/database.types'
import type { QueryOptions, PaginatedResult } from '@/types/api/response.types'
import { 
  tenantRecordRepository, 
  type TenantRecord,
  type TenantRecordInsert 
} from '@/repositories/tenant-repository'
import { 
  CreateTenantRecordSchema, 
  UpdateTenantRecordSchema,
  type CreateTenantRecordPayload,
  type UpdateTenantRecordPayload 
} from '@/lib/validation/schemas/tenant.schema'
import { ConflictError, ValidationError } from '@/lib/errors'

/**
 * Tenant Service
 * 
 * Business logic for tenant record management.
 * Services are caller-agnostic (work with both Server Actions and Route Handlers).
 */

/**
 * Get all tenant records with pagination.
 */
export async function getTenantRecords(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  options?: QueryOptions
): Promise<PaginatedResult<TenantRecord>> {
  return tenantRecordRepository.findAll(supabase, tenantId, options)
}

/**
 * Get a single tenant record by ID.
 */
export async function getTenantRecordById(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  id: string
): Promise<TenantRecord> {
  return tenantRecordRepository.findByIdOrThrow(supabase, tenantId, id)
}

/**
 * Create a new tenant record.
 */
export async function createTenantRecord(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  payload: CreateTenantRecordPayload
): Promise<TenantRecord> {
  // Validate input
  const validated = CreateTenantRecordSchema.parse(payload)
  
  // Check for duplicate email
  const existing = await tenantRecordRepository.findByEmail(
    supabase, 
    tenantId, 
    validated.email
  )
  
  if (existing) {
    throw ConflictError.duplicate('Tenant', 'email')
  }
  
  // Transform to database format
  const insertData: TenantRecordInsert = {
    tenant_id: tenantId,
    first_name: validated.firstName,
    last_name: validated.lastName,
    email: validated.email,
    phone: validated.phone,
    avatar: validated.avatar,
    status: validated.status,
    property_id: validated.propertyId,
    unit_id: validated.unitId,
    unit_no: validated.unitNo,
    move_in_date: validated.moveInDate,
    move_out_date: validated.moveOutDate,
    emergency_contact: validated.emergencyContact 
      ? JSON.parse(JSON.stringify(validated.emergencyContact))
      : null,
  }
  
  return tenantRecordRepository.create(supabase, tenantId, insertData)
}

/**
 * Update an existing tenant record.
 */
export async function updateTenantRecord(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  id: string,
  payload: UpdateTenantRecordPayload
): Promise<TenantRecord> {
  // Validate input
  const validated = UpdateTenantRecordSchema.parse(payload)
  
  // Check for duplicate email if email is being changed
  if (validated.email) {
    const existing = await tenantRecordRepository.findByEmail(
      supabase, 
      tenantId, 
      validated.email
    )
    
    if (existing && existing.id !== id) {
      throw ConflictError.duplicate('Tenant', 'email')
    }
  }
  
  // Transform to database format (only include defined fields)
  const updateData: Record<string, unknown> = {}
  
  if (validated.firstName !== undefined) updateData.first_name = validated.firstName
  if (validated.lastName !== undefined) updateData.last_name = validated.lastName
  if (validated.email !== undefined) updateData.email = validated.email
  if (validated.phone !== undefined) updateData.phone = validated.phone
  if (validated.avatar !== undefined) updateData.avatar = validated.avatar
  if (validated.status !== undefined) updateData.status = validated.status
  if (validated.propertyId !== undefined) updateData.property_id = validated.propertyId
  if (validated.unitId !== undefined) updateData.unit_id = validated.unitId
  if (validated.unitNo !== undefined) updateData.unit_no = validated.unitNo
  if (validated.moveInDate !== undefined) updateData.move_in_date = validated.moveInDate
  if (validated.moveOutDate !== undefined) updateData.move_out_date = validated.moveOutDate

  if (validated.emergencyContact !== undefined) {
    updateData.emergency_contact = validated.emergencyContact 
      ? JSON.parse(JSON.stringify(validated.emergencyContact))
      : null
  }
  
  if (Object.keys(updateData).length === 0) {
    throw new ValidationError('No fields to update')
  }
  
  return tenantRecordRepository.update(supabase, tenantId, id, updateData)
}

/**
 * Delete a tenant record.
 */
export async function deleteTenantRecord(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  id: string
): Promise<void> {
  await tenantRecordRepository.delete(supabase, tenantId, id)
}

/**
 * Get tenant record statistics.
 */
export async function getTenantRecordStats(
  supabase: SupabaseClient<Database>,
  tenantId: string
): Promise<{
  total: number
  active: number
  inactive: number
  pending: number
}> {
  return tenantRecordRepository.getStats(supabase, tenantId)
}

/**
 * Get tenant records by property.
 */
export async function getTenantRecordsByProperty(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  propertyId: string
): Promise<TenantRecord[]> {
  return tenantRecordRepository.findByProperty(supabase, tenantId, propertyId)
}
