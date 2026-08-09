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
   * "local" (our own catalogue) or "geocoder". Null on a suggestion cached
   * before the field existed: the places cache has a 24-hour TTL, so entries
   * outlive a deploy.
   */
  source?: 'local' | 'geocoder' | null
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
