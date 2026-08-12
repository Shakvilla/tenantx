/**
 * Public listings client — no auth, no tenant header.
 * Uses native fetch so it works in both Server and Client components.
 */

// Same precedence as server-api.ts, and for the same reason: every caller of
// the fetch helpers below is a Server Component, so these requests leave the
// Node server, not the browser. NEXT_PUBLIC_API_BASE_URL is the BROWSER's route
// to the API — in Docker that is localhost:<published port>, which from inside
// the web container is the web container itself, so the fetch ECONNREFUSEs and
// every listing silently disappears. API_BASE_URL_INTERNAL carries the compose
// service name. It is not NEXT_PUBLIC_, so it is undefined in the browser
// bundle and client callers fall through to the public value unchanged.
const API_BASE =
  process.env.API_BASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublicListingDto {
  id: string

  // Unit
  unitId: string
  unitNo: string
  unitType: string
  bedrooms: number | null
  bathrooms: number | null
  sizeSqft: number | null
  rent: number | null
  currency: string
  amenities: string[]
  images: string[]

  // Property
  propertyId: string
  propertyName: string
  propertyAddress: string

  // Listing
  title: string
  description: string | null
  contactPhone: string | null
  contactEmail: string | null
  availableFrom: string | null    // LocalDate → "YYYY-MM-DD"
  status: string                  // "ACTIVE" | "INACTIVE"

  createdAt: string
  updatedAt: string | null
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function getPublicListings(): Promise<PublicListingDto[]> {
  const res = await fetch(`${API_BASE}/listings/public`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch listings: ${res.status}`)
  return res.json() as Promise<PublicListingDto[]>
}

export async function getPublicListing(id: string): Promise<PublicListingDto> {
  const res = await fetch(`${API_BASE}/listings/public/${id}`, {
    cache: 'no-store',           // always fresh — listing status can change
  })

  if (!res.ok) {
    throw new Error(`Listing not found: ${res.status}`)
  }

  return res.json() as Promise<PublicListingDto>
}
