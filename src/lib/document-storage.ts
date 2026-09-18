/**
 * Document upload — provider-agnostic, private files.
 *
 * Replaces the Supabase Storage path this used to take. That one routed bytes
 * through a Next route handler holding a service-role key with full storage
 * rights, and it returned a *public* URL which the list then opened directly:
 * anyone holding the link could read a tenancy agreement, across tenants. It
 * was also dead in every Docker deployment, because docker-compose never passed
 * the Supabase keys to the web container.
 *
 * The flow now matches how every other file in this product is stored, with the
 * storage backend abstracted behind Spring:
 *
 *   1. Spring signs a short-lived upload auth  GET /api/v1/documents/storage/auth
 *   2. the browser uploads straight to the provider (bytes never touch our server)
 *   3. the file is stored PRIVATE, so its URL 401s on its own
 *   4. reading one goes through  GET /api/v1/documents/{id}/download-url,
 *      which checks the caller owns the document and signs a link that expires
 *
 * Two upload modes are supported, decided by the auth response:
 *
 *   - Presigned PUT  (S3, R2, GCS, …) — the auth response carries `uploadUrl`
 *     and no `formData`; the file body goes straight to the provider.
 *   - Form POST      (ImageKit) — the auth response carries `uploadUrl` plus a
 *     `formData` map of signature fields (token, signature, expire, …) that
 *     are appended to a multipart form alongside the file.
 *
 * XHR rather than fetch, because the dialog shows a real progress bar and fetch
 * cannot report upload progress.
 */

import { apiGet, API_BASE } from './api/client'
import { getStoredToken } from './api/storage'

export type StorageUploadResult = {
  path: string
  publicUrl: string
  fileName: string
  fileId: string
  bytes: number
  mimeType: string
}

/**
 * Upload a document file.
 *
 * @param file       from an <input type="file"> or a drop event
 * @param tenantId   namespaces the storage folder per landlord workspace
 * @param onProgress called with 0–100 as the upload proceeds
 */
export async function uploadDocument(
  file: File,
  tenantId: string,
  onProgress?: (percent: number) => void
): Promise<StorageUploadResult> {
  // 1. Get presigned upload auth from the backend (provider-agnostic)
  const token = getStoredToken() ?? ''

  const authResponse = await fetch(
    `${API_BASE}/documents/storage/auth?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`,
    {
      headers: {
        'X-Tenant-ID': tenantId,
        'Authorization': `Bearer ${token}`
      }
    }
  )

  if (!authResponse.ok) {
    throw new Error('Failed to get upload auth')
  }

  const { uploadUrl, filePath, fileId, formData } = await authResponse.json()

  // 2. Upload via presigned PUT (works for S3, R2, GCS, etc.)
  //    or via form POST (works for ImageKit)
  if (formData && Object.keys(formData).length > 0) {
    return uploadViaForm(uploadUrl, formData, file, filePath, fileId, onProgress)
  } else {
    return uploadViaPut(uploadUrl, file, filePath, fileId, onProgress)
  }
}

function uploadViaPut(
  url: string,
  file: File,
  filePath: string,
  fileId: string,
  onProgress?: (percent: number) => void
): Promise<StorageUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          path: filePath,
          publicUrl: url.split('?')[0],
          fileName: file.name,
          fileId,
          bytes: file.size,
          mimeType: file.type
        })
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Upload failed')))
    xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled.')))

    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

function uploadViaForm(
  url: string,
  formData: Record<string, string>,
  file: File,
  filePath: string,
  fileId: string,
  onProgress?: (percent: number) => void
): Promise<StorageUploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    Object.entries(formData).forEach(([k, v]) => form.append(k, v))
    form.append('file', file)

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const resp = JSON.parse(xhr.responseText)

          resolve({
            path: resp.filePath ?? filePath,
            publicUrl: resp.url ?? url.split('?')[0],
            fileName: resp.name ?? file.name,
            fileId: resp.fileId ?? fileId,
            bytes: resp.size ?? file.size,
            mimeType: file.type
          })
        } catch {
          reject(new Error('Invalid response from the upload service.'))
        }
      } else {
        try {
          reject(new Error(JSON.parse(xhr.responseText)?.message ?? `Upload failed (HTTP ${xhr.status})`))
        } catch {
          reject(new Error(`Upload failed (HTTP ${xhr.status})`))
        }
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error — upload could not complete.')))
    xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled.')))

    xhr.open('POST', url)
    xhr.send(form)
  })
}

/**
 * A signed, expiring link to a document's file.
 *
 * Document files are private, so the stored URL cannot be opened directly. The
 * server checks the caller owns this document before signing — which is the
 * check the previous public-URL scheme never made.
 */
export async function getDocumentDownloadUrl(documentId: string): Promise<string> {
  const { url } = await apiGet<{ url: string }>(`${API_BASE}/documents/${documentId}/download-url`)

  return url
}

/** Format bytes into a human-readable string, e.g. "1.2 MB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
export const ALLOWED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.docx'
export const MAX_FILE_SIZE_MB = 10