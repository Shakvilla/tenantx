'use client'

import { useMemo, useState } from 'react'
import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { usePlatformBranding } from '@/contexts/PlatformBrandingContext'
import { matchesSearch } from './lib/format'
import { useSavedListings } from './lib/useSavedListings'
import ListingCard from './components/ListingCard'
import SearchPill from './components/SearchPill'
import FilterBar, { type SortValue } from './components/FilterBar'
import SiteFooter from './components/SiteFooter'

export default function ListingsIndexView({ listings }: { listings: PublicListingDto[] }) {
  const { platformName, logoUrl, primaryColour } = usePlatformBranding()
  const { isSaved, toggle } = useSavedListings()

  const [searchQuery, setSearchQuery] = useState('')
  const [bedFilter, setBedFilter] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [sort, setSort] = useState<SortValue>('newest')

  const maxRent = useMemo(() => {
    const rents = listings.map(l => l.rent).filter((r): r is number => r != null)
    return rents.length ? Math.max(...rents) : 10000
  }, [listings])

  const filtered = useMemo(() => {
    let out = listings.filter(l => l.status === 'ACTIVE')
    if (searchQuery.trim()) out = out.filter(l => matchesSearch(l, searchQuery))
    if (bedFilter !== null) {
      out = bedFilter >= 3
        ? out.filter(l => (l.bedrooms ?? 0) >= 3)
        : out.filter(l => l.bedrooms === bedFilter)
    }
    if (maxPrice !== null) out = out.filter(l => l.rent == null || l.rent <= maxPrice)
    return [...out].sort((a, b) => {
      if (sort === 'price_asc') return (a.rent ?? 0) - (b.rent ?? 0)
      if (sort === 'price_desc') return (b.rent ?? 0) - (a.rent ?? 0)
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    })
  }, [listings, searchQuery, bedFilter, maxPrice, sort])

  const hasFilters = bedFilter !== null || maxPrice !== null || searchQuery.trim() !== ''

  function clearAll() {
    setSearchQuery('')
    setBedFilter(null)
    setMaxPrice(null)
  }

  return (
    <div className='min-h-screen bg-white'>
      {/* ── Sticky top: header + filter bar stick together (header height varies
             when the search pill wraps on mobile, so they share one sticky wrapper) ── */}
      <div className='sticky top-0 z-50 bg-white'>
      <header className='border-b border-[#EBEBEB]'>
        <div className='mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3.5 lg:px-10'>
          <div className='flex items-center gap-2.5'>
            {logoUrl ? (
              <img src={logoUrl} alt={platformName} className='h-9 object-contain' />
            ) : (
              <>
                <svg width='30' height='30' viewBox='0 0 32 32' fill={primaryColour} xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
                  <path d='M16 1C10.5 1 6 5.9 6 12c0 4.3 2.3 8.6 5 11.5L16 29l5-5.5c2.7-2.9 5-7.2 5-11.5C26 5.9 21.5 1 16 1zm0 15a4 4 0 110-8 4 4 0 010 8z' />
                </svg>
                <span className='text-lg font-extrabold tracking-tight' style={{ color: primaryColour }}>
                  {platformName}
                </span>
              </>
            )}
          </div>

          <div className='order-3 w-full sm:order-none sm:mx-auto sm:w-auto sm:min-w-[340px] sm:max-w-md sm:flex-1'>
            <SearchPill value={searchQuery} onChange={setSearchQuery} brandColour={primaryColour} />
          </div>

          <div className='ml-auto hidden text-[13px] text-[#717171] sm:block'>
            {filtered.length > 0 && `${filtered.length} available`}
          </div>
        </div>
      </header>

      {/* ── Filter bar (inside the sticky wrapper) ── */}
      <div className='border-b border-[#EBEBEB]'>
        <div className='mx-auto max-w-[1400px] px-6 py-2.5 lg:px-10'>
          <FilterBar
            bedFilter={bedFilter} onBedFilter={setBedFilter}
            maxPrice={maxPrice} onMaxPrice={setMaxPrice} maxRent={maxRent}
            sort={sort} onSort={setSort}
            hasFilters={hasFilters} onClearAll={clearAll}
            brandColour={primaryColour}
          />
        </div>
      </div>
      </div>{/* /sticky wrapper */}

      {/* ── Content ── */}
      <main className='mx-auto max-w-[1400px] px-6 pb-20 pt-8 lg:px-10'>
        {listings.length > 0 && (
          <div className='mb-7'>
            <h1 className='text-2xl font-extrabold text-[#222222]'>Homes available in Ghana</h1>
            <p className='mt-1.5 text-sm text-[#717171]'>
              {filtered.length} home{filtered.length !== 1 ? 's' : ''} · Prices in GHS
            </p>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className='flex min-h-[400px] flex-col items-center justify-center gap-3 text-center'>
            <div
              className={`mb-1 flex h-20 w-20 items-center justify-center rounded-full ${
                listings.length === 0 ? 'bg-[#F7F7F7]' : 'bg-[#FFF5F5]'
              }`}
            >
              <i
                className={`${listings.length === 0 ? 'ri-home-4-line text-[#CCCCCC]' : 'ri-search-line'} text-4xl`}
                style={listings.length === 0 ? undefined : { color: primaryColour }}
                aria-hidden='true'
              />
            </div>
            <div className='text-[22px] font-bold text-[#222222]'>
              {listings.length === 0 ? 'No listings yet' : 'No exact matches'}
            </div>
            <div className='max-w-[300px] text-sm leading-relaxed text-[#717171]'>
              {listings.length === 0
                ? 'Check back soon — new rentals are added regularly.'
                : "Try adjusting your filters to find what you're looking for."}
            </div>
            {listings.length > 0 && (
              <button
                onClick={clearAll}
                className='mt-2 cursor-pointer rounded-lg border-none bg-[#222222] px-7 py-3 text-sm font-semibold text-white'
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {filtered.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                saved={isSaved(listing.id)}
                onToggleSave={() => toggle(listing.id)}
              />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
