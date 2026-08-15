import { serverApiGet } from './server-api'
import type { TenantRecord } from './tenants'

/**
 * Server-side tenant fetcher
 * This must be used in Server Components where headers/cookies are available
 */

export async function serverGetTenantById(tenantId: string, id: string): Promise<TenantRecord | null> {
  return serverApiGet<TenantRecord>(tenantId, `/tenants/${id}`)
}
