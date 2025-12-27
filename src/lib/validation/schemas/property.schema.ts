import { z } from 'zod'

/**
 * Address schema for properties.
 */
export const AddressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().default('Ghana'),
})

/**
 * Property type enum.
 */
export const PropertyTypeEnum = z.enum([
  'residential',
  'commercial',
  'mixed',
  'house',
  'apartment',
])

/**
 * Property ownership enum.
 */
export const PropertyOwnershipEnum = z.enum(['own', 'lease'])

/**
 * Property status enum.
 */
export const PropertyStatusEnum = z.enum(['active', 'inactive', 'maintenance', 'draft'])

/**
 * Property condition enum.
 */
export const PropertyConditionEnum = z.enum(['new', 'good', 'fair', 'poor'])

/**
 * Address schema for drafts (all optional).
 */
export const DraftAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().default('Ghana'),
}).optional()

/**
 * Draft property schema - for saving incomplete forms.
 * Only requires name, everything else is optional.
 */
export const DraftPropertySchema = z.object({
  // Only name is required for drafts
  name: z.string().min(1, 'Property name is required').max(255),
  
  // Everything else is optional for drafts
  address: DraftAddressSchema,
  type: PropertyTypeEnum.optional(),
  ownership: PropertyOwnershipEnum.optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  gpsCode: z.string().optional(),
  description: z.string().max(2000).optional(),
  condition: PropertyConditionEnum.optional(),
  status: z.literal('draft').default('draft'),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  rooms: z.number().int().min(0).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(), // URLs or storage paths
  thumbnailIndex: z.number().int().min(0).optional(),
  purchasePrice: z.number().positive().optional(),
  currentValue: z.number().positive().optional(),
  currency: z.string().default('GHS'),
})

/**
 * Create property schema.
 */
export const CreatePropertySchema = z.object({
  // Required fields
  name: z.string().min(1, 'Property name is required').max(255),
  address: AddressSchema,
  type: PropertyTypeEnum,
  ownership: PropertyOwnershipEnum,
  
  // Location (Ghana-specific)
  region: z.string().min(1, 'Region is required'),
  district: z.string().min(1, 'District is required'),
  gpsCode: z.string().optional(),
  
  // Optional fields
  description: z.string().max(2000).optional(),
  condition: PropertyConditionEnum.optional(),
  status: PropertyStatusEnum.default('active'),
  
  // Property features (for single-unit properties)
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  rooms: z.number().int().min(0).optional(),
  
  // Amenities
  amenities: z.array(z.string()).optional(),
  
  // Media
  images: z.array(z.string()).optional(), // URLs or storage paths
  thumbnailIndex: z.number().int().min(0).optional(),
  
  // Financial
  purchasePrice: z.number().positive().optional(),
  currentValue: z.number().positive().optional(),
  currency: z.string().default('GHS'),
})

/**
 * Update property schema (partial).
 */
export const UpdatePropertySchema = CreatePropertySchema.partial()

/**
 * Property query schema for list endpoints.
 */
export const PropertyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: PropertyStatusEnum.optional(),
  type: PropertyTypeEnum.optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  sort: z.string().default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

// Export types
export type CreatePropertyPayload = z.infer<typeof CreatePropertySchema>
export type UpdatePropertyPayload = z.infer<typeof UpdatePropertySchema>
export type DraftPropertyPayload = z.infer<typeof DraftPropertySchema>
export type PropertyQuery = z.infer<typeof PropertyQuerySchema>
export type PropertyAddress = z.infer<typeof AddressSchema>

