import { z } from 'zod'

/**
 * Schema for creating a tenant record.
 */
export const CreateTenantRecordSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  avatar: z.string().url().optional().nullable(),
  status: z.enum(['active', 'inactive', 'pending']).default('pending'),
  propertyId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  unitNo: z.string().max(50).optional().nullable(),
  moveInDate: z.string().datetime().optional().nullable(),
  moveOutDate: z.string().datetime().optional().nullable(),
  emergencyContact: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    relationship: z.string().min(1),
  }).optional().nullable(),
  metadata: z.object({
    occupation: z.string().optional(),
    dob: z.string().optional(),
    familyMembersCount: z.coerce.number().int().min(0).optional(),
    permanentAddress: z.object({
      country: z.string().optional(),
      state: z.string().optional(),
      city: z.string().optional(),
      zipCode: z.string().optional(),
      address: z.string().optional(),
    }).optional(),
    previousAddress: z.object({
      country: z.string().optional(),
      state: z.string().optional(),
      city: z.string().optional(),
      zipCode: z.string().optional(),
      address: z.string().optional(),
    }).optional(),
  }).optional().nullable(),
})

/**
 * Schema for updating a tenant record (all fields optional).
 */
export const UpdateTenantRecordSchema = CreateTenantRecordSchema.partial()

/**
 * Schema for tenant record query parameters.
 */
export const TenantRecordQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  propertyId: z.string().uuid().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})


/**
 * Types inferred from schemas.
 */

export type CreateTenantRecordPayload = z.infer<typeof CreateTenantRecordSchema>
export type UpdateTenantRecordPayload = z.infer<typeof UpdateTenantRecordSchema>
export type TenantRecordQuery = z.infer<typeof TenantRecordQuerySchema>
