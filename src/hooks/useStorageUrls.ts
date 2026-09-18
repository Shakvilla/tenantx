import { useState, useEffect } from 'react'
import { ikUrl, IK_CARD } from '@/lib/image-urls'
import { getDownloadUrl } from '@/lib/storage'

/**
 * Batch-resolve an array of raw stored paths to renderable URLs.
 * Returns a map of original path → resolved URL.
 *
 * Mirrors `useStorageUrl` but resolves many paths in one pass:
 * - data:/blob: URLs pass through as-is.
 * - ImageKit URLs get a transformation applied (account doesn't serve originals).
 * - Private providers (MEGA S4, S3) get signed URLs from the backend; failures
 *   fall back to the raw path.
 */
export function useStorageUrls(paths: string[]): Record<string, string> {
  const [resolved, setResolved] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!paths.length) return
    let cancelled = false

    Promise.all(
      paths.map(async path => {
        try {
          if (path.startsWith('data:') || path.startsWith('blob:')) return [path, path] as const
          if (path.includes('imagekit.io')) return [path, ikUrl(path, IK_CARD)] as const
          const url = await getDownloadUrl(path)
          return [path, url] as const
        } catch {
          return [path, path] as const
        }
      })
    ).then(results => {
      if (!cancelled) setResolved(Object.fromEntries(results))
    })

    return () => {
      cancelled = true
    }
  }, [paths.join(',')])

  return resolved
}