/**
 * The unit amenity vocabulary — one copy, for everything that reads or writes it.
 *
 * Amenities are persisted as ids (`kitchen_cabinets`), chosen from the Add Unit
 * form's checkbox list. The id is a storage key, never display text: anything
 * rendering one straight to the page prints `kitchen_cabinets` at a prospective
 * tenant, which is what the public listing page did.
 *
 * This list previously existed in three places — both Add Unit dialogs and the
 * dashboard's amenities card — and in none of the public listing code, which is
 * how the ids leaked to the one page strangers actually see. Add an amenity
 * here and every surface picks it up.
 */

export interface AmenityDef {
  /** Stored value. Lowercase, underscore-separated. */
  id: string
  /** What a human is shown. */
  label: string
  /** Remix icon class. */
  icon: string
}

/** The amenities the Add / Edit Unit form offers, in the order it offers them. */
export const UNIT_AMENITIES: AmenityDef[] = [
  { id: 'furnished', label: 'Furnished', icon: 'ri-home-heart-line' },
  { id: 'ac', label: 'Air Conditioning', icon: 'ri-temp-cold-line' },
  { id: 'balcony', label: 'Balcony', icon: 'ri-window-line' },
  { id: 'laundry', label: 'In-unit Laundry', icon: 'ri-water-flash-line' },
  { id: 'parking', label: 'Parking Space', icon: 'ri-parking-box-line' },
  { id: 'kitchen_cabinets', label: 'Kitchen Cabinets', icon: 'ri-cup-line' },
  { id: 'wardrobes', label: 'Built-in Wardrobes', icon: 'ri-shirt-line' },
  { id: 'wifi', label: 'WiFi / Internet', icon: 'ri-wifi-line' }
]

/**
 * Values the form does not offer but that still arrive — the public listing
 * page carried its own icon map for these before this module existed, and
 * older rows may hold them. Recognised so they render as well as the rest;
 * deliberately not offered as checkboxes.
 */
const ALSO_RECOGNISED: AmenityDef[] = [
  { id: 'pool', label: 'Swimming Pool', icon: 'ri-drop-line' },
  { id: 'gym', label: 'Gym', icon: 'ri-run-line' },
  { id: 'security', label: 'Security', icon: 'ri-shield-check-line' },
  { id: 'generator', label: 'Backup Generator', icon: 'ri-flashlight-line' },
  { id: 'water', label: 'Water Supply', icon: 'ri-water-flash-line' },
  { id: 'kitchen', label: 'Kitchen', icon: 'ri-restaurant-line' }
]

const FALLBACK_ICON = 'ri-checkbox-circle-line'

const BY_ID = new Map<string, AmenityDef>(
  [...UNIT_AMENITIES, ...ALSO_RECOGNISED].map(a => [a.id, a])
)

/** `"  Kitchen Cabinets "` and `"kitchen-cabinets"` both key as `kitchen_cabinets`. */
function normalise(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function lookup(value: string): AmenityDef | undefined {
  return BY_ID.get(normalise(value))
}

/**
 * Best-effort prose for a value we have no entry for. The vocabulary is not
 * closed — other tenants' data and future ids both land here — and a raw id
 * reaching the page is the bug this module exists to prevent, so an unknown
 * value gets tidied rather than passed through.
 *
 * Capitals already present survive: `DSTV_ready` is `DSTV Ready`, not `Dstv Ready`.
 */
export function humaniseAmenity(value: string): string {
  return value
    .trim()
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

/** Display text for a stored amenity value. Never returns a raw id. */
export function amenityLabel(value: string): string {
  return lookup(value)?.label ?? humaniseAmenity(value)
}

/**
 * Icon class for a stored amenity value.
 *
 * Exact lookup, not substring: matching `kitchen_cabinets` against `kitchen`
 * gave the cabinets a restaurant icon, and the first-match-wins iteration made
 * the result depend on declaration order.
 */
export function amenityIcon(value: string): string {
  return lookup(value)?.icon ?? FALLBACK_ICON
}
