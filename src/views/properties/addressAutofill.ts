/**
 * Turning a picked place into form values.
 *
 * Extracted from the dialog because assignment order and the "leave it blank
 * rather than guess" rule are the parts worth testing, and testing them
 * through a four-step MUI wizard would prove very little.
 */
import type { PlaceSuggestion } from '@/lib/api/places'

type LocationFields = { street: string; region: string; district: string; city: string }

/**
 * Assign a place onto the location fields.
 *
 * Unmatched values are cleared, never left as they were: a district from a
 * previously-selected city, sitting under a new address, is wrong in a way
 * that looks deliberate.
 */
export function applyPlaceToForm<T extends LocationFields>(form: T, place: PlaceSuggestion): T {
  return {
    ...form,
    street: place.street ?? '',
    region: place.region ?? '',
    district: place.district ?? '',
    city: place.city ?? ''
  }
}

/**
 * One sentence describing what just happened. Silence after an autofill leaves
 * people unsure whether anything happened at all, and unmatched fields need to
 * be pointed at rather than left quietly empty.
 */
export function describeAutofill(place: PlaceSuggestion): string {
  const filled: string[] = []

  const missing: string[] = []

  // Street is announced when present but never asked for when absent: it is
  // the one optional address field, and most Ghanaian localities have no
  // street name for the geocoder to return. Listing it under "please choose"
  // would demand something the user often cannot supply.
  if (place.street) filled.push('street')

  ;(
    [
      ['region', place.region],
      ['district', place.district],
      ['city', place.city]
    ] as const
  ).forEach(([name, value]) => (value ? filled.push(name) : missing.push(name)))

  if (!filled.length) {
    return missing.length ? `Please choose the ${list(missing)} below.` : ''
  }

  const filledPart = `Filled ${list(filled)} from the address.`

  return missing.length ? `${filledPart} Please choose the ${list(missing)} below.` : filledPart
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join('')
  if (items.length === 2) return `${items[0]} and ${items[1]}`

  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}
