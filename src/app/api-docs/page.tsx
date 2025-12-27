import { getApiDocs } from '@/lib/swagger'
import ApiDoc from '@/components/swagger/ApiDoc'

export const metadata = {
  title: 'API Documentation - TenantX',
  description: 'Interactive API documentation for TenantX property management platform',
}

export default async function ApiDocsPage() {
  const spec = await getApiDocs()
  
  return <ApiDoc spec={spec as Record<string, unknown>} />
}
