'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { usePlatformBranding } from '@/contexts/PlatformBrandingContext'
import { matchesSearch } from './lib/format'
import { cityLabel, citySlug, groupByCity, topCities } from './lib/city'
import { useSavedListings } from './lib/useSavedListings'
import ListingCard from './components/ListingCard'
import SearchPill from './components/SearchPill'
import FilterBar, { type SortValue } from './components/FilterBar'
import CityExploreStrip from './components/CityExploreStrip'
import SiteFooter from './components/SiteFooter'

/** Max cards shown per city section on the segmented main page. */
const SECTION_CARD_CAP = 8

function sortListings(listings: PublicListingDto[], sort: SortValue): PublicListingDto[] {
  return [...listings].sort((a, b) => {
    if (sort === 'price_asc') return (a.rent ?? 0) - (b.rent ?? 0)
    if (sort === 'price_desc') return (b.rent ?? 0) - (a.rent ?? 0)
    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  })
}

interface ListingsIndexViewProps {
  listings: PublicListingDto[]
  /** When set, the view renders as a dedicated city page scoped to this city. */
  cityScope?: { slug: string; label: string }
}

export default function ListingsIndexView({ listings, cityScope }: ListingsIndexViewProps) {
  const { platformName, logoUrl, primaryColour } = usePlatformBranding()
  const { isSaved, toggle } = useSavedListings()

  const [searchQuery, setSearchQuery] = useState('')
  const [bedFilter, setBedFilter] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [locationFilter, setLocationFilter] = useState<string | null>(null)
  const [sort, setSort] = useState<SortValue>('newest')

  // City page: hard-scope everything (grid, counts, price slider max) to the
  // city fixed by the URL. Not clearable — it's the page's identity.
  const scoped = useMemo(
    () =>
      cityScope
        ? listings.filter(l => citySlug(cityLabel(l.propertyAddress)) === cityScope.slug)
        : listings,
    [listings, cityScope]
  )

  const cityGroups = useMemo(() => groupByCity(scoped), [scoped])
  const top = useMemo(() => topCities(cityGroups), [cityGroups])

  const maxRent = useMemo(() => {
    const rents = scoped.map(l => l.rent).filter((r): r is number => r != null)
    return rents.length ? Math.max(...rents) : 10000
  }, [scoped])

  const filtered = useMemo(() => {
    let out = scoped.filter(l => l.status === 'ACTIVE')
    if (searchQuery.trim()) out = out.filter(l => matchesSearch(l, searchQuery))
    if (bedFilter !== null) {
      out = bedFilter >= 3
        ? out.filter(l => (l.bedrooms ?? 0) >= 3)
        : out.filter(l => l.bedrooms === bedFilter)
    }
    if (maxPrice !== null) out = out.filter(l => l.rent == null || l.rent <= maxPrice)
    if (locationFilter !== null) {
      out = out.filter(l => citySlug(cityLabel(l.propertyAddress)) === locationFilter)
    }
    return sortListings(out, sort)
  }, [scoped, searchQuery, bedFilter, maxPrice, locationFilter, sort])

  const hasFilters =
    bedFilter !== null || maxPrice !== null || locationFilter !== null || searchQuery.trim() !== ''

  // Segmented top-10 feed is only the default (no filters) state of the main
  // index — and only when at least one named city exists (all-"Other areas"
  // data falls back to the flat grid rather than a blank page).
  const segmented = !cityScope && !hasFilters && top.length > 0

  function clearAll() {
    setSearchQuery('')
    setBedFilter(null)
    setMaxPrice(null)
    setLocationFilter(null)
  }

  const renderCard = (listing: PublicListingDto) => (
    <ListingCard
      key={listing.id}
      listing={listing}
      saved={isSaved(listing.id)}
      onToggleSave={() => toggle(listing.id)}
    />
  )

  const gridClass = 'grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

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
            {...(!cityScope && {
              locationFilter,
              onLocationFilter: setLocationFilter,
              locationOptions: cityGroups.map(g => ({ slug: g.slug, label: g.label, count: g.listings.length })),
            })}
          />
        </div>
      </div>
      </div>{/* /sticky wrapper */}

      {/* ── Content ── */}
      <main className='mx-auto max-w-[1400px] px-6 pb-20 pt-8 lg:px-10'>
        {cityScope ? (
          <div className='mb-7'>
            <Link
              href='/listings'
              className='text-[13px] font-medium text-[#717171] no-underline hover:text-[#222222] hover:underline'
            >
              ← All listings
            </Link>
            <h1 className='mt-2 text-2xl font-extrabold text-[#222222]'>
              Homes available in {cityScope.label} - Ghana
            </h1>
            <p className='mt-1.5 text-sm text-[#717171]'>
              {filtered.length} home{filtered.length !== 1 ? 's' : ''} · Prices in GHS
            </p>
          </div>
        ) : (
          listings.length > 0 && (
            <div className='mb-7'>
              <h1 className='text-2xl font-extrabold text-[#222222]'>Homes available in Ghana</h1>
              <p className='mt-1.5 text-sm text-[#717171]'>
                {filtered.length} home{filtered.length !== 1 ? 's' : ''} · Prices in GHS
              </p>
            </div>
          )
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
              {listings.length === 0
                ? 'No listings yet'
                : cityScope && !hasFilters
                  ? `No homes currently available in ${cityScope.label}.`
                  : 'No exact matches'}
            </div>
            <div className='max-w-[300px] text-sm leading-relaxed text-[#717171]'>
              {hasFilters
                ? "Try adjusting your filters to find what you're looking for."
                : 'Check back soon — new rentals are added regularly.'}
            </div>
            {hasFilters && (
              <button
                onClick={clearAll}
                className='mt-2 cursor-pointer rounded-lg border-none bg-[#222222] px-7 py-3 text-sm font-semibold text-white'
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : segmented ? (
          <>
            <CityExploreStrip groups={top} />
            {top.map(group => (
              <section key={group.slug} aria-labelledby={`city-${group.slug}`} className='mb-12'>
                <h2 id={`city-${group.slug}`} className='text-xl font-extrabold text-[#222222]'>
                  Homes available in {group.label} - Ghana
                </h2>
                <div className={`mt-4 ${gridClass}`}>
                  {sortListings(group.listings, sort).slice(0, SECTION_CARD_CAP).map(renderCard)}
                </div>
                {group.listings.length > SECTION_CARD_CAP && (
                  <Link
                    href={`/listings/city/${group.slug}`}
                    className='mt-5 inline-block text-sm font-semibold text-[#222222] underline'
                  >
                    See all {group.listings.length} homes in {group.label} →
                  </Link>
                )}
              </section>
            ))}
          </>
        ) : (
          <div className={gridClass}>{filtered.map(renderCard)}</div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
