import { useState, useEffect } from 'react'
import { ikUrl, IK_CARD } from '@/lib/image-urls'
import { getDownloadUrl } from '@/lib/storage'

/**
 * Resolves a raw stored file path to a renderable URL.
 * - data:/blob: URLs are used as-is.
 * - ImageKit URLs get a transformation applied (this account does not serve
 *   originals — a raw URL 404s).
 * - Private providers (MEGA S4, S3) get a temporary signed URL from the backend.
 */
export function useStorageUrl(filePath: string | null | undefined): string {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!filePath) {
      setUrl('')
      return
    }

    // Data/blob URLs — use as-is
    if (filePath.startsWith('data:') || filePath.startsWith('blob:')) {
      setUrl(filePath)
      return
    }

    // ImageKit URLs — apply transformation (account doesn't serve originals)
    if (filePath.includes('imagekit.io')) {
      setUrl(ikUrl(filePath, IK_CARD))
      return
    }

    // MEGA S4 / S3 paths — resolve presigned URL
    let cancelled = false
    getDownloadUrl(filePath).then(resolved => {
      if (!cancelled) setUrl(resolved)
    })

    return () => {
      cancelled = true
    }
  }, [filePath])

  return url
}