'use client'

import { forwardRef } from 'react'
import { useStorageUrl } from '@/hooks/useStorageUrl'
import Avatar from '@mui/material/Avatar'
import type { AvatarProps } from '@mui/material/Avatar'

/**
 * Drop-in replacement for MUI Avatar that resolves presigned URLs for
 * private storage providers (MEGA S4, S3). For ImageKit/public URLs,
 * applies the account's transformation (originals are not served).
 */
const StorageAvatar = forwardRef<HTMLDivElement, AvatarProps>(function StorageAvatar(
  { src, ...props },
  ref
) {
  const resolvedUrl = useStorageUrl(src)

  return <Avatar ref={ref} src={resolvedUrl || undefined} {...props} />
})

export { StorageAvatar }