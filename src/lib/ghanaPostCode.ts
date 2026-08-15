/**
 * Parsing a Ghana Post digital address, client side.
 *
 * Deliberately mirrors the backend's `GhanaPostCode` rule for rule. A code the
 * form accepts and the server rejects would fail on save with no field to
 * blame, so the two must agree — including the permissiveness about segment
 * lengths.
 *
 * Only the two-character prefix is interpreted. The area and unique-address
 * digits encode position through an algorithm Ghana Post has not published;
 * decoding them from a recreated scheme would produce coordinates that are
 * confidently wrong.
 */

const CODE = /^([A-Z][A-Z0-9])(\d{6,9})$/

export type ParsedPostCode = {
  /** As we store and display it: XX-NNN-NNNN. */
  normalised: string
  /** The two characters identifying region and district. */
  prefix: string
}

export function parseGhanaPostCode(raw: string | null | undefined): ParsedPostCode | null {
  if (!raw) return null

  // Landlords paste these from utility bills, the GhanaPostGPS app and
  // WhatsApp, with and without separators and in either case.
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  const match = CODE.exec(cleaned)

  if (!match) return null

  const [, prefix, digits] = match

  return { normalised: `${prefix}-${digits.slice(0, 3)}-${digits.slice(3)}`, prefix }
}
