/**
 * Server-side property API helpers.
 *
 * This file uses `next/headers` (via server-api.ts) and must ONLY be imported
 * from Server Components, Server Actions, or Route Handlers — never from
 * client components ('use client').
 */
import type { Property } from '@/types/property'

import { serverApiGet } from './server-api'

/**
 * Get a single property by ID (server-side — uses cookies).
 *
 * This is intended for Next.js Server Components / Server Actions where
 * `localStorage` is unavailable and auth must come from cookies.
 */
export async function serverGetPropertyById(tenantId: string, id: string): Promise<Property | null> {
  return serverApiGet<Property>(tenantId, `/properties/${id}`)
}
