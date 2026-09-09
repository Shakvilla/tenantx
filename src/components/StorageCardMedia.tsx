'use client'

import { useStorageUrl } from '@/hooks/useStorageUrl'
import CardMedia from '@mui/material/CardMedia'
import type { CardMediaProps } from '@mui/material/CardMedia'

/**
 * Drop-in replacement for MUI CardMedia that resolves presigned URLs for
 * private storage providers (MEGA S4, S3). For ImageKit/public URLs,
 * passes through as-is.
 */
export function StorageCardMedia({ image, ...props }: CardMediaProps<'img'>) {
  const resolvedUrl = useStorageUrl(image)

  return <CardMedia image={resolvedUrl || undefined} {...props} />
}
