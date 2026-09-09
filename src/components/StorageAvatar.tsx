'use client'

import { useStorageUrl } from '@/hooks/useStorageUrl'
import Avatar from '@mui/material/Avatar'
import type { AvatarProps } from '@mui/material/Avatar'

/**
 * Drop-in replacement for MUI Avatar that resolves presigned URLs for
 * private storage providers (MEGA S4, S3). For ImageKit/public URLs,
 * passes through as-is.
 */
export function StorageAvatar({ src, ...props }: AvatarProps) {
  const resolvedUrl = useStorageUrl(src)

  return <Avatar src={resolvedUrl || undefined} {...props} />
}
