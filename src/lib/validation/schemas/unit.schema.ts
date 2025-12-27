import { z } from 'zod'

/**
 * Unit type enum.
 */
export const UnitTypeEnum = z.enum([
  'studio',
  '1br',
  '2br',
  '3br',
  '4br+',
  'commercial',
  'office',
  'retail',
])

/**
 * Unit status enum.
 * Note: Frontend uses 'vacant' but we map it to 'available' in the API.
 */
export const UnitStatusEnum = z.enum([
  'available',
  'occupied',
  'maintenance',
  'reserved',
])

/**
 * Create unit schema.
 */
export const CreateUnitSchema = z.object({
  // Required fields
  unitNo: z.string().min(1, 'Unit number is required').max(50),
  type: UnitTypeEnum,
  rent: z.number().min(0, 'Rent must be positive'),
  
  // Optional fields
  floor: z.number().int().optional(),
  sizeSqft: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  deposit: z.number().min(0).optional(),
  currency: z.string().default('GHS'),
  status: UnitStatusEnum.default('available'),
  
  // Features
  amenities: z.array(z.string()).optional(),
  features: z.record(z.string(), z.unknown()).optional(),
  
  // Media
  images: z.array(z.string().url()).optional(),
  
  // Tenant assignment
  tenantRecordId: z.string().uuid().optional(),
})

/**
 * Update unit schema (partial).
 */
export const UpdateUnitSchema = CreateUnitSchema.partial()

/**
 * Unit query schema for list endpoints.
 */
export const UnitQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: UnitStatusEnum.optional(),
  type: UnitTypeEnum.optional(),
  minRent: z.coerce.number().optional(),
  maxRent: z.coerce.number().optional(),
  sort: z.string().default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

// Export types
export type CreateUnitPayload = z.infer<typeof CreateUnitSchema>
export type UpdateUnitPayload = z.infer<typeof UpdateUnitSchema>
export type UnitQuery = z.infer<typeof UnitQuerySchema>
