/**
 * Document upload — ImageKit, private files.
 *
 * Replaces the Supabase Storage path this used to take. That one routed bytes
 * through a Next route handler holding a service-role key with full storage
 * rights, and it returned a *public* URL which the list then opened directly:
 * anyone holding the link could read a tenancy agreement, across tenants. It
 * was also dead in every Docker deployment, because docker-compose never passed
 * the Supabase keys to the web container.
 *
 * The flow now matches how every other file in this product is stored:
 *
 *   1. Spring signs a short-lived upload token   GET /api/v1/imagekit/auth
 *   2. the browser uploads straight to ImageKit  (bytes never touch our server)
 *   3. the file is stored PRIVATE, so its URL 401s on its own
 *   4. reading one goes through  GET /api/v1/documents/{id}/download-url,
 *      which checks the caller owns the document and signs a link that expires
 *
 * The trade-off worth naming: `isPrivateFile` is set by the browser, and the
 * upload signature covers only the token and its expiry, so a hand-built
 * request could omit it. That is the same trust this app already extends for
 * the `folder` of every property and occupant image. Closing it means proxying
 * uploads through Spring, which buys server-controlled flags at the cost of
 * streaming 10 MB files through Java — worth doing if documents ever carry
 * something stricter than they do today.
 *
 * XHR rather than fetch, because the dialog shows a real progress bar and fetch
 * cannot report upload progress.
 */

import { apiGet, API_BASE } from './api/client'

export type StorageUploadResult = {
  path: string
  publicUrl: string
  fileName: string
  fileId: string
  bytes: number
  mimeType: string
}

type ImageKitAuthParams = {
  token: string
  expire: number
  signature: string
}

const PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ?? ''
const IK_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'

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
  // Fail here rather than sending publicKey='' and letting ImageKit answer
  // "Your request is missing publicKey parameter." — that reads as a bug in the
  // upload code when the cause is a build-time config gap. NEXT_PUBLIC_* values
  // are inlined at build time, so a container built without this cannot be
  // fixed by restarting it; it needs a rebuild.
  if (!PUBLIC_KEY) {
    throw new Error(
      'Document upload is not configured: NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY was empty when this app was built. Rebuild with the key set.'
    )
  }

  const auth = await apiGet<ImageKitAuthParams>(`${API_BASE}/imagekit/auth`)

  return new Promise((resolve, reject) => {
    const body = new FormData()

    body.append('file', file)
    body.append('fileName', file.name)
    body.append('publicKey', PUBLIC_KEY)
    body.append('signature', auth.signature)
    body.append('expire', String(auth.expire))
    body.append('token', auth.token)
    body.append('folder', `/yiliora/${tenantId}/documents`)
    body.append('useUniqueFileName', 'true')

    // The point of the whole migration. Without this the file is world-readable
    // to anyone who learns its URL.
    body.append('isPrivateFile', 'true')

    const xhr = new XMLHttpRequest()

    xhr.open('POST', IK_UPLOAD_URL)

    if (onProgress) {
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      })
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)

          resolve({
            path: data.filePath,
            publicUrl: data.url,
            fileName: data.name ?? file.name,
            fileId: data.fileId,
            bytes: data.size ?? file.size,
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

    xhr.send(body)
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
