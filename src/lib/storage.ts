/**
 * Unified storage client — provider-agnostic uploads via the StorageRouter.
 *
 * Replaces lib/imagekit.ts for every upload path. The provider (ImageKit,
 * MEGA/S3, …) is abstracted behind Spring, so the browser never holds a
 * provider key:
 *
 *   1. GET  /api/v1/storage/upload-auth?fileName=&contentType=&fileKind=
 *      mints a short-lived, per-tenant upload credential.
 *   2. the browser writes the file straight to the active provider — either a
 *      presigned PUT (S3/MEGA) or a multipart form POST (ImageKit).  The bytes
 *      never touch our server.
 *   3. POST /api/v1/storage/confirm-upload records the file in the usage
 *      ledger so its bytes count toward the tenant's storage quota.
 *
 * Two upload modes are supported, decided by the auth response:
 *
 *   - Form POST (ImageKit) — the auth response carries a non-empty `formData`
 *     map (token, signature, expire, publicKey, folder, …) that is appended to
 *     a multipart form alongside the file.
 *   - Presigned PUT (S3/MEGA) — the auth response carries an `uploadUrl` and an
 *     empty `formData` map; the file body goes straight to the provider.
 *
 * This mirrors lib/document-storage.ts, which already talks to the same
 * StorageRouter for private document files.
 */

import Cookies from 'js-cookie'

import { API_BASE } from './api/client'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * What kind of tenant content the file belongs to.  The backend uses this to
 * scope the storage folder (`/yiliora/{tenantId}/{fileKind}`) and to record
 * usage against the right bucket in the ledger.
 */
export type FileKind =
  | 'property'
  | 'unit'
  | 'occupant'
  | 'maintenance'
  | 'inspection'
  | 'agreement'
  | 'document'
  | 'platform'

/**
 * The upload credential returned by `GET /api/v1/storage/upload-auth`.
 *
 * `formData` decides the mode: when it has entries the file is posted as a
 * multipart form (ImageKit); when it is empty the file is PUT straight to
 * `uploadUrl` (S3/MEGA).
 */
export interface UploadAuth {

  /** Where the browser sends the file bytes (provider upload endpoint / presigned PUT URL). */
  uploadUrl: string

  /** Server-computed storage path, e.g. `/yiliora/{tenantId}/{fileKind}/{uniqueName}`. */
  filePath: string

  /** Provider file id where the provider separates it from the path (ImageKit). */
  fileId?: string

  /** Signature fields for a form POST. Empty/missing for presigned-PUT providers. */
  formData?: Record<string, string>
}

/**
 * What `uploadFile` returns once the bytes are with the provider and the
 * upload has been confirmed in the usage ledger.
 */
export interface UploadResult {

  /** URL the browser can render. For ImageKit this is the CDN URL; for S3/MEGA the object URL. */
  url: string

  /** Canonical storage path — what deletes/confirms/ledger rows key on. */
  filePath: string

  /** Provider id (IMAGEKIT / MEGA_S4) the file was written to. */
  provider: string
  fileId?: string

  /** Original file size in bytes, as recorded by confirm-upload. */
  sizeBytes: number
}

// ─── Auth headers ─────────────────────────────────────────────────────────────

/**
 * Authorization headers for the storage endpoints, read from the same cookies
 * the middleware uses to gate access.  Storage calls deliberately bypass the
 * axios client: the actual file bytes go to a *third-party* URL, where the
 * interceptor must not inject our auth headers.
 */
function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${Cookies.get('auth_token') ?? ''}`,
    'X-Tenant-ID': Cookies.get('tenant_id') ?? ''
  }
}

/** Extract a readable message from a Spring error body when present. */
async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null)

  return body?.error?.message ?? body?.message ?? `${fallback} (HTTP ${res.status})`
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Fetches a fresh upload credential for the active storage provider.
 *
 * The backend refuses to mint one when the tenant has consumed its storage
 * quota, so quota errors surface here, before any bytes move.
 */
export async function getUploadAuth(
  fileName: string,
  contentType: string,
  fileKind: FileKind = 'document'
): Promise<UploadAuth> {
  const params = new URLSearchParams({ fileName, contentType, fileKind })

  const res = await fetch(`${API_BASE}/storage/upload-auth?${params.toString()}`, {
    headers: authHeaders()
  })

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Failed to get upload auth'))
  }

  return res.json()
}

// ─── Core upload ──────────────────────────────────────────────────────────────

/**
 * Upload a single file through whatever storage provider is active.
 *
 * @param file     from an <input type="file"> or a drop event
 * @param fileKind what kind of content this is — scopes the storage folder
 * @param folder   reserved for callers that need to pin a sub-folder; the
 *                 backend already scopes uploads by tenant + fileKind
 */
export async function uploadFile(
  file: File,
  fileKind: FileKind = 'document',
  _folder?: string
): Promise<UploadResult> {
  const auth = await getUploadAuth(file.name, file.type, fileKind)

  const formFields = auth.formData ?? {}
  const isFormUpload = Object.keys(formFields).length > 0

  const uploaded = isFormUpload ? await uploadViaForm(file, auth) : await uploadViaPut(file, auth)

  // Record the file in the usage ledger now that the bytes are actually stored.
  await confirmUpload(uploaded.filePath, file.type, file.size, fileKind)

  return {
    url: uploaded.url,
    filePath: uploaded.filePath,
    fileId: uploaded.fileId,

    // Only ImageKit and MEGA/S3 are registered providers today; ImageKit is the
    // only one that uploads via a signed form POST.  If a third provider is
    // added this must be driven by the auth response instead of the mode.
    provider: isFormUpload ? 'IMAGEKIT' : 'MEGA_S4',
    sizeBytes: file.size
  }
}

/**
 * Presigned PUT (S3/MEGA): the raw file body goes straight to `auth.uploadUrl`.
 */
async function uploadViaPut(
  file: File,
  auth: UploadAuth
): Promise<{ url: string; filePath: string; fileId?: string }> {
  const res = await fetch(auth.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file
  })

  if (!res.ok) {
    throw new Error(`Upload failed (HTTP ${res.status})`)
  }

  // `uploadUrl` carries the presign query string — strip it so the stored URL
  // is the stable object URL rather than an expiring signed link.
  return {
    url: auth.uploadUrl.split('?')[0],
    filePath: auth.filePath,
    fileId: auth.fileId ?? auth.filePath
  }
}

/**
 * Form POST (ImageKit): the provider's signature fields travel in the multipart
 * form next to the file.
 */
async function uploadViaForm(
  file: File,
  auth: UploadAuth
): Promise<{ url: string; filePath: string; fileId?: string }> {
  const form = new FormData()

  Object.entries(auth.formData ?? {}).forEach(([key, value]) => form.append(key, value))
  form.append('file', file)

  const res = await fetch(auth.uploadUrl, { method: 'POST', body: form })

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Upload failed'))
  }

  const data = await res.json()

  return {
    url: data.url,
    filePath: data.filePath ?? auth.filePath,
    fileId: data.fileId ?? auth.fileId
  }
}

// ─── Post-upload bookkeeping ──────────────────────────────────────────────────

/**
 * Records a completed upload in the usage ledger so its bytes count toward the
 * tenant's storage quota.
 */
export async function confirmUpload(
  filePath: string,
  contentType: string,
  sizeBytes: number,
  fileKind: FileKind
): Promise<void> {
  const res = await fetch(`${API_BASE}/storage/confirm-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ filePath, contentType, sizeBytes, fileKind })
  })

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Failed to confirm upload'))
  }
}

// ─── Reads & deletes ──────────────────────────────────────────────────────────

/**
 * Returns a presigned download URL for a stored file.
 * For private buckets (MEGA S4, S3), the raw stored path returns 403 —
 * this calls the backend to mint a temporary signed URL.
 * Falls back to the raw path for public providers (ImageKit).
 */
export async function getDownloadUrl(filePath: string): Promise<string> {
  if (!filePath) return ''

  try {
    const res = await fetch(
      `${API_BASE}/storage/download-url?filePath=${encodeURIComponent(filePath)}`,
      { headers: authHeaders() }
    )

    if (!res.ok) return filePath
    const data = await res.json()
    return data?.url ?? filePath
  } catch {
    return filePath
  }
}

/**
 * Deletes files from the active provider and releases their bytes from the
 * tenant's usage ledger.
 *
 * @returns the number of files the provider actually removed
 */
export async function deleteFiles(filePaths: string[]): Promise<number> {
  if (filePaths.length === 0) return 0

  const res = await fetch(`${API_BASE}/storage/files`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(filePaths)
  })

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Failed to delete files'))
  }

  const data = await res.json()

  return data?.deleted ?? 0
}
