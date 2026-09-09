import { useStorageUrl } from '@/hooks/useStorageUrl'

/**
 * Drop-in replacement for <img> that resolves presigned URLs for private
 * storage providers (MEGA S4, S3). For ImageKit/public URLs, passes through as-is.
 */
export function StorageImage({
  src,
  alt = '',
  ...props
}: {
  src: string | null | undefined
  alt?: string
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const resolvedUrl = useStorageUrl(src)

  if (!resolvedUrl) return null

  return <img src={resolvedUrl} alt={alt} {...props} />
}
