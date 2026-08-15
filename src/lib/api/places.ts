/**
 * Address autocomplete.
 *
 * The backend does the geocoding and the matching, so what comes back here is
 * already in our own vocabulary: `region` and `district` are our slugs and
 * `city` is a locality from our reference data. Any of the three is null when
 * the backend could not match it confidently — never guess a replacement.
 */
import { apiGet, API_BASE } from './client'

export type PlaceSuggestion = {
  label: string
  /** null when the geocoder had no street — it never falls back to the
   *  place name, which for a locality query would just echo the city. */
  street: string | null
  region: string | null
  district: string | null
  city: string | null
  latitude: number
  longitude: number
  /** null for our own localities — the catalogue holds places, not buildings. */
  placeId: string | null
  /**
   * "local" (our own catalogue), "geocoder", or "learned" — a locality
   * landlords entered that the catalogue lacks. Null on a suggestion cached
   * before the field existed: the places cache has a 24-hour TTL, so entries
   * outlive a deploy.
   */
  source?: 'local' | 'geocoder' | 'learned' | null
}

export type PlaceSearchResult = {
  status: 'ok' | 'unavailable'
  suggestions: PlaceSuggestion[]
}

export async function searchPlaces(query: string): Promise<PlaceSearchResult> {
  try {
    return await apiGet<PlaceSearchResult>(
      `${API_BASE}/places/autocomplete?q=${encodeURIComponent(query)}&limit=8`
    )
  } catch {
    // The form works without this. A failed lookup is a degraded search, not
    // an error the user has to deal with.
    return { status: 'unavailable', suggestions: [] }
  }
}

export type ReverseResolved = {
  region: string
  regionLabel: string
  district: string
  districtLabel: string
  city: string
  distanceMetres: number
  /**
   * Whether the nearest locality is close enough to lead with. False does not
   * mean wrong — it means "this is the nearest place we know, and it is far
   * enough away that you should check".
   */
  confident: boolean
}

/**
 * The address a captured position appears to be in, or null when no locality
 * is near enough to name.
 *
 * Never applied automatically by the caller: an OSM place node is a point, not
 * a boundary, so a property near a district edge can resolve to its neighbour.
 */
export async function reverseResolve(latitude: number, longitude: number): Promise<ReverseResolved | null> {
  try {
    const data = await apiGet<ReverseResolved | ''>(
      `${API_BASE}/places/reverse?lat=${latitude}&lon=${longitude}`
    )

    // 204 arrives as an empty body: a real coordinate with nothing near it.
    return data ? (data as ReverseResolved) : null
  } catch {
    // The capture still succeeded and the coordinates are still saved. Losing
    // the suggested address is a degraded lookup, not a failed capture.
    return null
  }
}
