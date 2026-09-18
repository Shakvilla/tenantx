/**
 * Image URL rendering helpers (ImageKit CDN transformations).
 *
 * Formerly part of lib/imagekit.ts; extracted when the upload half moved to
 * lib/storage.ts. Uploads are now provider-agnostic, but stored image files are
 * still served from the ImageKit CDN, so every displayed image still needs a
 * transformation applied — that is what lives here.
 */

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

const URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? ''

/**
 * Build a transformed ImageKit URL (resize, format conversion, etc.)
 *
 * @example
 * buildUrl('/yiliora/properties/photo.jpg', [{ width: 400, height: 300, crop: 'maintain_ratio' }])
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