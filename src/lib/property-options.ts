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

/**
 * Resolves the count to store from a submitted option and the count already on
 * record.
 *
 * The open-ended option stands for every count at or above its number, so on
 * its own it cannot say which. Taking it literally rewrites an 8-bedroom
 * property to 6 the moment its owner edits the description — the count they
 * never touched. When the stored count already falls in that bucket, keep it.
 */
export function fromCountOption(
  option: string | null | undefined,
  stored?: number | string | null
): number | undefined {
  if (!option) return undefined

  const submitted = parseInt(option.replace('+', ''), 10)

  if (!Number.isFinite(submitted)) return undefined

  if (!option.endsWith('+')) return submitted

  const previous = typeof stored === 'number' ? stored : parseInt(String(stored ?? '').replace('+', ''), 10)

  return Number.isFinite(previous) && previous >= submitted ? previous : submitted
}

/**
 * Renders a stored count for display.
 *
 * Read-only views have no fixed option list to honour, so they show the real
 * number: `toCountOption` is for prefilling the form's Select and collapses
 * every count of 6 or more onto "6+", which on a detail page reads as an
 * approximation of a number the system knows exactly. Returns '' when there is
 * no count to show, leaving the caller to phrase its own absence.
 */
export function countLabel(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''

  const count = typeof value === 'number' ? value : parseInt(String(value).replace('+', ''), 10)

  return Number.isFinite(count) && count >= 1 ? String(count) : ''
}
