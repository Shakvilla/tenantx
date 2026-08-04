import { rankItem } from '@tanstack/match-sorter-utils'

import type { FilterFn } from '@tanstack/react-table'

/**
 * Shared fuzzy filter for TanStack tables.
 *
 * Several table components augment `@tanstack/table-core`'s `FilterFns` interface with a
 * `fuzzy` key. That augmentation is project-wide, and table-core resolves
 * `filterFns` to a *required* option as soon as `keyof FilterFns` is not `never`
 * (see ResolvedFilterFns in features/ColumnFiltering.d.ts). Every useReactTable call
 * therefore has to pass `filterFns: { fuzzy: fuzzyFilter }`, whether or not it filters.
 */
export const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}
