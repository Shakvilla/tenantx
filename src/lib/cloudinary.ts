/**
 * Cloudinary upload utility
 *
 * Uses unsigned upload — no server-side signature required.
 * Configure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and
 * NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local.
 */

const CLOUD_NAME   = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME   ?? ''
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ''

export type CloudinaryUploadResult = {
  publicId:    string   // stable ID for future management (delete, transform)
  secureUrl:   string   // https URL to the file
  fileName:    string   // original filename
  format:      string   // e.g. "pdf", "jpg"
  bytes:       number   // file size in bytes
  resourceType: string  // "image" | "raw" | "video"
}

/**
 * Upload a file to Cloudinary with progress reporting.
 *
 * @param file       The File object from an <input type="file">
 * @param folder     Cloudinary folder path, e.g. "tenantx/documents"
 * @param onProgress Called with 0–100 as the upload progresses
 */
export function uploadToCloudinary(
  file: File,
  folder = 'tenantx/documents',
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    return Promise.reject(
      new Error(
        'Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ' +
        'and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local.'
      )
    )
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file',           file)
    formData.append('upload_preset',  UPLOAD_PRESET)
    formData.append('folder',         folder)

    const xhr = new XMLHttpRequest()

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      })
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText)
        resolve({
          publicId:     res.public_id,
          secureUrl:    res.secure_url,
          fileName:     res.original_filename || file.name,
          format:       res.format,
          bytes:        res.bytes,
          resourceType: res.resource_type
        })
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err?.error?.message ?? `Upload failed (${xhr.status})`))
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`))
        }
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

    // Cloudinary auto-detect endpoint handles images, PDFs, and raw files
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`)
    xhr.send(formData)
  })
}

/** Format bytes into a human-readable string, e.g. "1.2 MB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Allowed MIME types for document uploads */
export const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export const ALLOWED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.docx'
export const MAX_FILE_SIZE_MB   = 10
