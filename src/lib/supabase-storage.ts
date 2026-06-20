/**
 * Document upload utility.
 *
 * POSTs a FormData request to /api/upload-document (our own Next.js route).
 * The server-side route handles the actual Supabase Storage call using the
 * service-role key, so no Supabase SDK or auth token is needed in the browser.
 *
 * Using XHR (rather than fetch) gives us real upload progress events.
 */

export type StorageUploadResult = {
  path:      string
  publicUrl: string
  fileName:  string
  fileId:    string   // same as path
  bytes:     number
  mimeType:  string
}

/**
 * Upload a file via the /api/upload-document server route.
 *
 * @param file       The File object from an <input type="file"> or drop event
 * @param tenantId   Namespaces the storage path per landlord workspace
 * @param onProgress Called with 0–100 as the upload progresses (real XHR events)
 */
export function uploadDocument(
  file: File,
  tenantId: string,
  onProgress?: (percent: number) => void
): Promise<StorageUploadResult> {
  return new Promise((resolve, reject) => {
    const body = new FormData()
    body.append('file', file)
    body.append('tenantId', tenantId)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload-document')

    // Real progress tracking via XHR upload events
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      })
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as StorageUploadResult
          resolve(data)
        } catch {
          reject(new Error('Invalid response from upload server.'))
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err?.error ?? `Upload failed (HTTP ${xhr.status})`))
        } catch {
          reject(new Error(`Upload failed (HTTP ${xhr.status})`))
        }
      }
    })

    xhr.addEventListener('error',  () => reject(new Error('Network error — upload could not complete.')))
    xhr.addEventListener('abort',  () => reject(new Error('Upload was cancelled.')))

    xhr.send(body)
  })
}

/** Format bytes into a human-readable string, e.g. "1.2 MB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)         return `${bytes} B`
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ALLOWED_TYPES      = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
export const ALLOWED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.docx'
export const MAX_FILE_SIZE_MB   = 10
