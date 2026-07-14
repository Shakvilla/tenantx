'use client'

import { useState } from 'react'

export type SortValue = 'newest' | 'price_asc' | 'price_desc'

export const BED_FILTERS: { label: string; value: number | null }[] = [
  { label: 'Any type', value: null },
  { label: 'Studio', value: 0 },
  { label: '1 bed', value: 1 },
  { label: '2 beds', value: 2 },
  { label: '3+ beds', value: 3 },
]

const SORT_OPTIONS: { label: string; value: SortValue }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: low to high', value: 'price_asc' },
  { label: 'Price: high to low', value: 'price_desc' },
]

export interface LocationOption {
  slug: string
  label: string
  count: number
}

export interface FilterBarProps {
  bedFilter: number | null
  onBedFilter: (v: number | null) => void
  maxPrice: number | null
  onMaxPrice: (v: number | null) => void
  maxRent: number
  sort: SortValue
  onSort: (v: SortValue) => void
  hasFilters: boolean
  onClearAll: () => void
  brandColour: string
  /** Location filter — omit all three on city pages (scope is fixed by the URL). */
  locationFilter?: string | null
  onLocationFilter?: (slug: string | null) => void
  locationOptions?: LocationOption[]
}

function chipClass(active: boolean): string {
  return (
    'cursor-pointer whitespace-nowrap rounded-full border px-4 py-2 text-[13px] transition-colors ' +
    (active
      ? 'border-[#222222] bg-[#222222] font-semibold text-white'
      : 'border-[#DDDDDD] bg-white font-medium text-[#222222] hover:border-[#222222]')
  )
}

export default function FilterBar(props: FilterBarProps) {
  const {
    bedFilter, onBedFilter, maxPrice, onMaxPrice, maxRent,
    sort, onSort, hasFilters, onClearAll, brandColour,
    locationFilter, onLocationFilter, locationOptions,
  } = props
  const [showSlider, setShowSlider] = useState(false)

  return (
    <div>
      <div className='flex items-center gap-2 overflow-x-auto pb-0.5'>
        {BED_FILTERS.map(f => (
          <button key={String(f.value)} onClick={() => onBedFilter(f.value)} className={chipClass(bedFilter === f.value)}>
            {f.label}
          </button>
        ))}

        <span className='mx-1 h-5 w-px shrink-0 bg-[#DDDDDD]' aria-hidden='true' />

        <button
          onClick={() => setShowSlider(s => !s)}
          className={`${chipClass(maxPrice !== null)} flex items-center gap-1.5`}
        >
          <i className='ri-equalizer-line' aria-hidden='true' />
          {maxPrice !== null ? `Max GH₵ ${Number(maxPrice).toLocaleString()}` : 'Price'}
        </button>

        {locationOptions && onLocationFilter && (
          <select
            value={locationFilter ?? ''}
            onChange={e => onLocationFilter(e.target.value || null)}
            aria-label='Filter by location'
            className={
              'shrink-0 cursor-pointer rounded-full border border-solid px-3 py-2 text-[13px] transition-colors ' +
              ((locationFilter ?? '') !== ''
                ? 'border-[#222222] bg-[#222222] font-semibold text-white'
                : 'border-[#DDDDDD] bg-white font-medium text-[#222222] hover:border-[#222222]')
            }
          >
            <option value=''>All locations</option>
            {locationOptions.map(o => (
              <option key={o.slug} value={o.slug}>
                {o.label} ({o.count})
              </option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={onClearAll}
            className='shrink-0 cursor-pointer whitespace-nowrap border-none bg-transparent px-2 py-2 text-[13px] text-[#222222] underline'
          >
            Clear all
          </button>
        )}

        <label className='ml-auto flex shrink-0 cursor-pointer items-center gap-2'>
          <span className='text-[13px] text-[#717171]'>Sort</span>
          <select
            value={sort}
            onChange={e => onSort(e.target.value as SortValue)}
            aria-label='Sort listings'
            className='cursor-pointer rounded-full border border-[#DDDDDD] bg-white px-3 py-2 text-[13px] font-medium text-[#222222]'
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {showSlider && (
        <div className='mt-2.5 flex flex-wrap items-center gap-4 border-t border-[#F0F0F0] pt-3.5 pb-1'>
          <label htmlFor='max-price-slider' className='min-w-[180px] text-[13px] font-semibold text-[#222222]'>
            Max: {maxPrice !== null ? `GH₵ ${Number(maxPrice).toLocaleString()}` : 'Any price'}
          </label>
          <input
            id='max-price-slider'
            type='range' min={0} max={maxRent} step={100}
            value={maxPrice ?? maxRent}
            onChange={e => onMaxPrice(Number(e.target.value) >= maxRent ? null : Number(e.target.value))}
            className='max-w-[340px] flex-1'
            style={{ accentColor: brandColour }}
          />
          <button
            onClick={() => setShowSlider(false)}
            className='cursor-pointer border-none bg-transparent text-[13px] font-semibold text-[#222222] underline'
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
