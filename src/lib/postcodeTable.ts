import { getPostcodeDistricts, type PostcodeDistrict } from '@/lib/api/reference'

export type DecodedAddress = { regionValue: string; districtValue: string }

/**
 * Fetched once per page load, not once per mount.
 *
 * AddPropertyDialog renders its steps through a switch, so the address field
 * unmounts and remounts on every Previous/Next. The table is static reference
 * data, so one in-flight promise shared by every caller is the whole cache.
 */
let tablePromise: Promise<PostcodeDistrict[]> | null = null

export function loadPostcodeTable(): Promise<PostcodeDistrict[]> {
  if (!tablePromise) {
    tablePromise = getPostcodeDistricts().catch(err => {
      // Don't memoise a failure: the next caller should get another go rather
      // than being stuck without a table for the life of the page.
      tablePromise = null
      throw err
    })
  }

  return tablePromise
}

/**
 * The region and district a code's two-character prefix identifies, or null.
 *
 * Null covers three different situations that all end the same way — no table
 * yet, a prefix we have never seen, and one of the 13 published prefixes whose
 * district has since been split. In every case the landlord is asked rather
 * than guessed at.
 */
export function decodePrefix(table: PostcodeDistrict[] | null, prefix: string): DecodedAddress | null {
  if (!table) return null

  const match = table.find(row => row.prefix === prefix)

  if (!match || !match.regionValue || !match.districtValue) return null

  return { regionValue: match.regionValue, districtValue: match.districtValue }
}
