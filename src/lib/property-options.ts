/**
 * Option lists for the property form's room-count dropdowns.
 *
 * The dropdowns are open-ended at the top ("6+"), so the option value is not
 * always the number that gets stored: submitting strips the "+" and saves a
 * plain integer. Reading a property back therefore needs the inverse mapping —
 * without it, a property saved as "6+" comes back as 6, matches no option, and
 * MUI renders the Select blank. Keep the lists and `toCountOption` together so
 * the two directions cannot drift apart.
 */

export const BEDROOM_OPTIONS = ['1', '2', '3', '4', '5', '6+'] as const
export const BATHROOM_OPTIONS = ['1', '2', '3', '4', '5+'] as const
export const ROOM_OPTIONS = ['1', '2', '3', '4', '5', '6+'] as const

/**
 * Maps a stored room count onto the select option that represents it.
 *
 * Counts at or above the open-ended bucket collapse onto that option, so a
 * 9-bedroom property prefills as "6+" rather than blank. Values that cannot be
 * represented (absent, zero, negative, non-numeric) return '' so the Select
 * shows its placeholder instead of an out-of-range value.
 */
export function toCountOption(
  value: number | string | null | undefined,
  options: readonly string[]
): string {
  if (value === null || value === undefined || value === '') return ''

  const count = typeof value === 'number' ? value : parseInt(String(value).replace('+', ''), 10)

  if (!Number.isFinite(count) || count < 1) return ''

  const exact = options.find(o => o === String(count))

  if (exact) return exact

  // Fall back to the open-ended bucket ("6+") when the count exceeds it.
  const openEnded = options.find(o => o.endsWith('+'))

  if (openEnded && count >= parseInt(openEnded, 10)) return openEnded

  return ''
}
