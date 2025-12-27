/**
 * Storage Service
 * Handles file uploads to Supabase Storage
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database/database.types'

// Storage bucket name for property images
const PROPERTIES_BUCKET = 'properties'

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

export interface UploadResult {
  path: string
  url: string
}

export interface StorageError {
  code: string
  message: string
}

/**
 * Validate file before upload
 */
function validateFile(file: File): StorageError | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      code: 'INVALID_FILE_TYPE',
      message: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  return null
}

/**
 * Generate a unique filename for the upload
 */
function generateFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop() || 'jpg'

  return `${timestamp}-${random}.${extension}`
}

/**
 * Upload a property image to Supabase Storage
 *
 * @param supabase - Supabase client with tenant context
 * @param tenantId - The tenant ID
 * @param file - The file to upload
 * @param propertyId - Optional property ID for organizing files
 * @returns Upload result with path and URL
 */
export async function uploadPropertyImage(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  file: File,
  propertyId?: string
): Promise<UploadResult> {
  // Validate file
  const validationError = validateFile(file)

  if (validationError) {
    throw new Error(validationError.message)
  }

  // Build storage path: properties/{tenantId}/{propertyId?}/{filename}
  const filename = generateFilename(file.name)
  const pathParts = [tenantId]

  if (propertyId) {
    pathParts.push(propertyId)
  }

  pathParts.push(filename)
  const storagePath = pathParts.join('/')

  // Upload to storage
  const { data, error } = await supabase.storage
    .from(PROPERTIES_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('[uploadPropertyImage] Upload failed:', error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(PROPERTIES_BUCKET).getPublicUrl(data.path)

  return {
    path: data.path,
    url: publicUrl,
  }
}

/**
 * Upload multiple property images
 *
 * @param supabase - Supabase client with tenant context
 * @param tenantId - The tenant ID
 * @param files - Array of files to upload
 * @param propertyId - Optional property ID for organizing files
 * @returns Array of upload results
 */
export async function uploadPropertyImages(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  files: File[],
  propertyId?: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = []

  for (const file of files) {
    const result = await uploadPropertyImage(supabase, tenantId, file, propertyId)

    results.push(result)
  }

  return results
}

/**
 * Delete a property image from storage
 *
 * @param supabase - Supabase client
 * @param path - The storage path to delete
 */
export async function deletePropertyImage(
  supabase: SupabaseClient<Database>,
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(PROPERTIES_BUCKET).remove([path])

  if (error) {
    console.error('[deletePropertyImage] Delete failed:', error)
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}

/**
 * Get a signed URL for a private image
 *
 * @param supabase - Supabase client
 * @param path - The storage path
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getSignedUrl(
  supabase: SupabaseClient<Database>,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PROPERTIES_BUCKET)
    .createSignedUrl(path, expiresIn)

  if (error) {
    console.error('[getSignedUrl] Failed to get signed URL:', error)
    throw new Error(`Failed to get signed URL: ${error.message}`)
  }

  return data.signedUrl
}
