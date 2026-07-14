import type { PublicListingDto } from '@/lib/api/listings-public-client'

/** One bucket of listings sharing a "{district}, {city}" location. */
export interface CityGroup {
  label: string                 // "Adenta, Accra" | "Accra" | "Other areas"
  slug: string                  // "adenta-accra" | "accra" | "other-areas"
  listings: PublicListingDto[]  // ACTIVE only (when built via groupByCity)
}

const FALLBACK_LABEL = 'Other areas'

/**
 * Derive the display city from a "{district}, {city}, {region}" address.
 * "Adenta, Accra, Greater Accra" → "Adenta, Accra"
 * "Accra, Accra, Greater Accra"  → "Accra" (district === city collapses)
 * "Kumasi"                       → "Kumasi"
 * ""/null                        → "Other areas"
 */
export function cityLabel(address: string | null | undefined): string {
  const parts = (address ?? '').split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length === 0) return FALLBACK_LABEL
  if (parts.length === 1) return parts[0]
  const [district, city] = parts
  return district.toLowerCase() === city.toLowerCase() ? city : `${district}, ${city}`
}

/** URL-safe slug: lowercase alphanumeric runs joined by hyphens. */
export function citySlug(label: string): string {
  const tokens = label.toLowerCase().match(/[a-z0-9]+/g)
  return tokens ? tokens.join('-') : 'other-areas'
}

/**
 * Group ACTIVE listings into CityGroups. Case variants of the same label
 * merge (first-seen casing wins). Sorted by listing count desc, label asc.
 */
export function groupByCity(listings: PublicListingDto[]): CityGroup[] {
  const map = new Map<string, CityGroup>()
  for (const l of listings) {
    if (l.status !== 'ACTIVE') continue
    const label = cityLabel(l.propertyAddress)
    const key = label.toLowerCase()
    let group = map.get(key)
    if (!group) {
      group = { label, slug: citySlug(label), listings: [] }
      map.set(key, group)
    }
    group.listings.push(l)
  }
  return [...map.values()].sort(
    (a, b) => b.listings.length - a.listings.length || a.label.localeCompare(b.label)
  )
}

/** Top n groups for headline placement — the fallback bucket never headlines. */
export function topCities(groups: CityGroup[], n = 10): CityGroup[] {
  return groups.filter(g => g.slug !== 'other-areas').slice(0, n)
}

/**
 * Resolve a slug back to its display label, scanning ALL listings regardless
 * of status — so a shared city link keeps resolving (and can render an empty
 * state) even after every listing there went INACTIVE. undefined = never
 * existed → the route 404s.
 */
export function labelForSlug(listings: PublicListingDto[], slug: string): string | undefined {
  for (const l of listings) {
    const label = cityLabel(l.propertyAddress)
    if (citySlug(label) === slug) return label
  }
  return undefined
}
