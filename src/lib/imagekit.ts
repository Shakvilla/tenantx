/**
 * ImageKit upload utility
 *
 * Upload flow:
 *   1. Fetch short-lived auth params from Spring Boot  GET /api/v1/imagekit/auth
 *      (private key never leaves the server)
 *   2. POST file directly to ImageKit's upload API with those params
 *   3. Return the CDN URL
 *
 * Usage:
 *   import { uploadImage, uploadImages } from '@/lib/imagekit'
 *
 *   const url  = await uploadImage(file, { folder: '/tenantx/properties' })
 *   const urls = await uploadImages(files, { folder: '/tenantx/avatars' })
 */

import { apiGet, API_BASE } from './api/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImageKitAuthParams {
  token: string
  expire: number
  signature: string
}

export interface UploadOptions {
  /** ImageKit folder path, e.g. "/tenantx/properties".  Defaults to "/tenantx". */
  folder?: string
  /** Custom file name (without extension).  Defaults to original filename. */
  fileName?: string
  /** Override the useUniqueFileName behaviour.  Defaults to true. */
  useUniqueFileName?: boolean
  /** Array of tag strings for ImageKit. */
  tags?: string[]
}

export interface UploadedFile {
  url: string
  fileId: string
  name: string
  filePath: string
  thumbnailUrl: string
  width?: number
  height?: number
  size: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PUBLIC_KEY    = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY    ?? ''
const URL_ENDPOINT  = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT  ?? ''
const IK_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'

if (typeof window !== 'undefined') {
  if (!PUBLIC_KEY)   console.warn('[ImageKit] NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY is not set')
  if (!URL_ENDPOINT) console.warn('[ImageKit] NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT is not set')
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Fetches a fresh set of upload auth parameters from Spring Boot.
 * Each call gets a new token valid for ~1 hour.
 */
async function getAuthParams(): Promise<ImageKitAuthParams> {
  return apiGet<ImageKitAuthParams>(`${API_BASE}/imagekit/auth`)
}

// ─── Core upload ─────────────────────────────────────────────────────────────

/**
 * Upload a single File to ImageKit.
 * Returns the public CDN URL.
 */
export async function uploadImage(
  file: File,
  options: UploadOptions = {}
): Promise<UploadedFile> {
  // Fail here rather than sending publicKey='' and letting ImageKit answer
  // "Your request is missing publicKey parameter." — that message reads as a
  // bug in the upload code when the real cause is a build-time config gap.
  // NEXT_PUBLIC_* values are inlined at build time, so a container built
  // without this set cannot be fixed by restarting it: it needs a rebuild.
  if (!PUBLIC_KEY) {
    throw new Error(
      'Image upload is not configured: NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY was empty when this app was built. Rebuild with the key set.'
    )
  }

  const auth = await getAuthParams()

  const {
    folder            = '/tenantx',
    fileName          = file.name,
    useUniqueFileName = true,
    tags              = []
  } = options

  const form = new FormData()
  form.append('file',              file)
  form.append('fileName',          fileName)
  form.append('publicKey',         PUBLIC_KEY)
  form.append('signature',         auth.signature)
  form.append('expire',            String(auth.expire))
  form.append('token',             auth.token)
  form.append('folder',            folder)
  form.append('useUniqueFileName', String(useUniqueFileName))
  if (tags.length) form.append('tags', tags.join(','))

  const res = await fetch(IK_UPLOAD_URL, { method: 'POST', body: form })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message ?? `ImageKit upload failed (${res.status})`)
  }

  return res.json() as Promise<UploadedFile>
}

/**
 * Upload multiple files in parallel.
 * Returns an array of CDN URLs in the same order as the input files.
 */
export async function uploadImages(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadedFile[]> {
  return Promise.all(files.map(f => uploadImage(f, options)))
}

/**
 * Convenience wrapper — returns just the URL string.
 */
export async function uploadImageUrl(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  const result = await uploadImage(file, options)
  return result.url
}

/**
 * Convenience wrapper — returns just the URL strings.
 */
export async function uploadImageUrls(
  files: File[],
  options: UploadOptions = {}
): Promise<string[]> {
  const results = await uploadImages(files, options)
  return results.map(r => r.url)
}

// ─── Rendering ───────────────────────────────────────────────────────────────

/**
 * Transformations for the three sizes we actually display at.
 *
 * `f-auto` is what lets ImageKit answer with WebP/AVIF where the browser says
 * it can take it — the uploaded PNGs run to 845 KB, which is not a thing to
 * hand a phone on a Ghanaian mobile connection.
 */
export const IK_THUMB = 'w-160,q-80,f-auto'
export const IK_CARD = 'w-800,q-80,f-auto'
export const IK_FULL = 'w-1600,q-85,f-auto'

const IK_HOST = 'ik.imagekit.io'

/**
 * The URL to actually render for a stored ImageKit URL.
 *
 * <strong>This account does not serve original files.</strong> A stored URL
 * fetched as-is returns 404 with `ik-error: ENOENT - Resource not found at any
 * upstream origin`; the same file with a transformation returns 200. So every
 * image we display has to carry one, and this is the single place that decides
 * how.
 *
 * The transformation goes in the PATH (`/<endpointId>/tr:w-400/<path>`), not
 * the query string. The query form (`?tr=w-400`) is the better-known one and
 * it 404s here — verified against the live account, so do not "simplify" it.
 *
 * Anything that is not one of our ImageKit URLs is returned untouched, because
 * listings carry stock photography from other hosts.
 */
export function ikUrl(url: string | null | undefined, transform: string = IK_CARD): string {
  if (!url) return ''

  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    // Not a URL at all — a relative asset path, say. Leave it be.
    return url
  }

  if (parsed.hostname !== IK_HOST) return url

  const segments = parsed.pathname.split('/').filter(Boolean)

  // Already transformed: re-wrapping would nest transformations and change the
  // rendering silently.
  if (segments.some(s => s.startsWith('tr:'))) return url

  // [endpointId, ...filePath] — the transformation sits between the two. Put
  // it before the endpoint id and the URL addresses a different account.
  const [endpointId, ...filePath] = segments

  if (!endpointId || filePath.length === 0) return url

  parsed.pathname = `/${endpointId}/tr:${transform}/${filePath.join('/')}`

  return parsed.toString()
}

/**
 * Build a transformed ImageKit URL (resize, format conversion, etc.)
 *
 * @example
 * buildUrl('/tenantx/properties/photo.jpg', [{ width: 400, height: 300, crop: 'maintain_ratio' }])
 */
export function buildUrl(
  filePath: string,
  transformations: Record<string, string | number>[] = []
): string {
  if (!filePath) return ''

  const base = URL_ENDPOINT.replace(/\/$/, '')

  if (!transformations.length) {
    return `${base}${filePath.startsWith('/') ? '' : '/'}${filePath}`
  }

  const tr = transformations
    .map(t =>
      Object.entries(t)
        .map(([k, v]) => `${k}-${v}`)
        .join(',')
    )
    .join(':')

  return `${base}/tr:${tr}${filePath.startsWith('/') ? '' : '/'}${filePath}`
}
