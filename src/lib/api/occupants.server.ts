import { serverApiGet } from './server-api'
import type { OccupantRecord } from './occupants'

/**
 * Server-side occupant fetcher
 * Must be used in Server Components where headers/cookies are available
 */
export async function serverGetOccupantById(
  tenantId: string,
  id: string
): Promise<OccupantRecord | null> {
  return serverApiGet<OccupantRecord>(tenantId, `/occupants/${id}`)
}
