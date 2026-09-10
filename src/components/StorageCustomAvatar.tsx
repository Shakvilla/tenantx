'use client'

import { useStorageUrl } from '@/hooks/useStorageUrl'
import CustomAvatar from '@core/components/mui/Avatar'
import type { CustomAvatarProps } from '@core/components/mui/Avatar'

/**
 * Drop-in replacement for @core/components/mui/Avatar (CustomAvatar) that
 * resolves presigned URLs for private storage providers (MEGA S4, S3) and
 * applies ImageKit transforms before handing the URL to the wrapped Avatar.
 *
 * Children (e.g. initials) are only rendered while there is no resolved image,
 * matching the wrapped Avatar's fallback behaviour.
 */
export function StorageCustomAvatar({ src, children, ...props }: CustomAvatarProps) {
  const resolvedUrl = useStorageUrl(src)

  return (
    <CustomAvatar src={resolvedUrl || undefined} {...props}>
      {resolvedUrl ? undefined : children}
    </CustomAvatar>
  )
}