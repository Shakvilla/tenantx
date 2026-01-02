/**
 * Tenant Image Upload API
 * POST /api/v1/tenants/upload
 * 
 * Uploads tenant images to Supabase Storage under Tenants/{propertyName}/{tenantName}/ folder
 */

import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { authenticateApiRoute } from '@/lib/auth/authenticate'
import { handleError } from '@/lib/errors'
import { ValidationError } from '@/lib/errors'

// Storage bucket name for tenant files
const TENANTS_BUCKET = 'tenants'

// Allowed image MIME types (including HEIC/HEIF from iPhones)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/svg+xml',
  'image/bmp',
]

// Allowed file extensions (fallback when MIME type is not reliable)
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'svg', 'bmp']

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Check if file is a valid image by MIME type or extension
 */
function isValidImageFile(file: File): boolean {
  // Check MIME type first
  if (ALLOWED_MIME_TYPES.includes(file.type)) {
    return true
  }
  
  // Fallback: check file extension (useful when MIME type is empty/wrong)
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  if (ALLOWED_EXTENSIONS.includes(extension)) {
    return true
  }
  
  // Also accept if MIME starts with 'image/' as a lenient fallback
  if (file.type.startsWith('image/')) {
    return true
  }
  
  return false
}

/**
 * Sanitize a string to be safe for use in file paths
 */
function sanitizePath(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Generate a unique filename for the upload
 */
function generateFilename(originalName: string, prefix?: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop() || 'jpg'
  const prefixPart = prefix ? `${prefix}-` : ''

  return `${prefixPart}${timestamp}-${random}.${extension}`
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await authenticateApiRoute(request)
    const supabase = await createClient()

    // Get form data
    const formData = await request.formData()

    const file = formData.get('file') as File | null
    const propertyName = formData.get('propertyName') as string | null
    const tenantName = formData.get('tenantName') as string | null
    const fileType = formData.get('fileType') as string | null // 'avatar', 'ghanaCardFront', 'ghanaCardBack'

    // Validate required fields
    if (!file) {
      throw new ValidationError('File is required', 'file')
    }

    if (!propertyName) {
      throw new ValidationError('Property name is required', 'propertyName')
    }

    if (!tenantName) {
      throw new ValidationError('Tenant name is required', 'tenantName')
    }

    // Validate file type (using improved validation)
    if (!isValidImageFile(file)) {
      console.error('[Tenant Upload] Invalid file type:', file.type, 'name:', file.name)
      throw new ValidationError(
        `Invalid file type "${file.type}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
        'file'
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(
        `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        'file'
      )
    }

    // Build storage path: Tenants/{propertyName}/{tenantName}/{filename}
    const sanitizedPropertyName = sanitizePath(propertyName)
    const sanitizedTenantName = sanitizePath(tenantName)
    const filename = generateFilename(file.name, fileType || undefined)

    const storagePath = `${tenantId}/${sanitizedPropertyName}/${sanitizedTenantName}/${filename}`

    // Upload to storage
    const { data, error } = await supabase.storage
      .from(TENANTS_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('[Tenant Upload] Upload failed:', error)
      throw new Error(`Failed to upload image: ${error.message}`)
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(TENANTS_BUCKET).getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      data: {
        path: data.path,
        url: publicUrl,
        fileType: fileType || 'avatar',
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
