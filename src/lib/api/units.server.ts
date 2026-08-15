import type { Unit } from '@/types/property'
import { serverApiGet } from './server-api'

/**
 * Server-side unit fetcher
 * This must be used in Server Components where headers/cookies are available
 */

export async function serverGetUnitById(tenantId: string, id: string): Promise<Unit | null> {
  return serverApiGet<Unit>(tenantId, `/units/${id}`)
}
