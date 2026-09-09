import { useState, useEffect } from 'react'
import { getDownloadUrl } from '@/lib/storage'

/**
 * Resolves a raw stored file path to a presigned download URL.
 * For public providers (ImageKit), returns the path as-is.
 * For private providers (MEGA S4, S3), fetches a temporary signed URL from the backend.
 */
export function useStorageUrl(filePath: string | null | undefined): string {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!filePath) {
      setUrl('')
      return
    }

    // If it's already a data/blob/ImageKit URL, use as-is
    if (
      filePath.startsWith('data:') ||
      filePath.startsWith('blob:') ||
      filePath.includes('imagekit.io')
    ) {
      setUrl(filePath)
      return
    }

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
