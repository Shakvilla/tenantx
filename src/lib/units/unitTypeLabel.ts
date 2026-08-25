/**
 * The human name for a stored unit type.
 *
 * The units list printed the stored value straight out with a `capitalize` class, so a
 * self-contained room appeared as **"Self_contained"** — the underscore and all. The landlord
 * who asked for these Ghanaian types in the first place then found them displayed in the
 * database's handwriting rather than his own.
 *
 * Prefers the reference list, which is where the real labels live ("Self-contained", "Chamber
 * and Hall"). Falls back to tidying the raw value, so a type that predates the list — or one
 * added to the backend before the frontend hears about it — still reads as words.
 */
export const unitTypeLabel = (
  value: string | null | undefined,
  unitTypes?: { value: string; label: string }[]
): string => {
  if (!value) return ''

  const known = unitTypes?.find(t => t.value === value)

  if (known) return known.label

  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/^\w/, c => c.toUpperCase())
}

export default unitTypeLabel
