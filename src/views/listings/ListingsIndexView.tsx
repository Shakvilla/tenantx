'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { usePlatformBranding } from '@/contexts/PlatformBrandingContext'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatGHS(n: number | null) {
  if (n == null) return '—'
  return 'GH₵ ' + Number(n).toLocaleString('en-GH', { minimumFractionDigits: 0 })
}

function bedroomLabel(n: number | null) {
  if (n == null) return null
  if (n === 0) return 'Studio'
  return `${n} bed${n !== 1 ? 's' : ''}`
}

function daysSince(iso: string | null | undefined) {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

// ─── SaveButton ─────────────────────────────────────────────────────────────

function SaveButton({ id }: { id: string }) {
  const [saved, setSaved] = useState(false)

  function toggle(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setSaved(s => !s)
  }

  return (
    <button
      onClick={toggle}
      aria-label={saved ? 'Remove from saved' : 'Save'}
      style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 1, display: 'flex' }}
    >
      <svg width='26' height='26' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'>
        <path d='M16 28l-1.5-1.4C7.4 19.8 3 16 3 11A7 7 0 0116 6.6 7 7 0 0129 11c0 5-4.4 8.8-11.5 15.6z'
          fill='none' stroke='rgba(0,0,0,0.3)' strokeWidth='3' />
        <path d='M16 28l-1.5-1.4C7.4 19.8 3 16 3 11A7 7 0 0116 6.6 7 7 0 0129 11c0 5-4.4 8.8-11.5 15.6z'
          fill={saved ? '#E53E3E' : 'rgba(255,255,255,0.88)'}
          stroke={saved ? '#E53E3E' : 'rgba(255,255,255,0.9)'} strokeWidth='1.5' />
      </svg>
    </button>
  )
}

// ─── ListingCard ─────────────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: PublicListingDto }) {
  const [imgIdx, setImgIdx] = useState(0)
  const [hovered, setHovered] = useState(false)
  const age = daysSince((listing as any).createdAt)
  const isNew = age != null && age <= 14
  const imgs = listing.images

  function prev(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); setImgIdx(i => Math.max(0, i - 1)) }
  function next(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); setImgIdx(i => Math.min(imgs.length - 1, i + 1)) }

  return (
    <Link href={`/listings/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <article>
        {/* Image */}
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '4/3', background: '#F0F0F0' }}>
          {imgs.length > 0 ? (
            <img src={imgs[imgIdx]} alt={listing.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: hovered ? 'scale(1.03)' : 'scale(1)', transition: 'transform 0.4s ease' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#C0C0C0', gap: 6 }}>
              <i className='ri-image-line' style={{ fontSize: '2rem' }} />
              <span style={{ fontSize: 12 }}>No photo</span>
            </div>
          )}

          <SaveButton id={listing.id} />

          {isNew && (
            <span style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, background: '#fff', color: '#222', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 40, letterSpacing: '0.03em', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
              New
            </span>
          )}

          {imgs.length > 1 && (
            <>
              {imgIdx > 0 && (
                <button onClick={prev} aria-label='Previous photo' style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 3, background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.18)' }}>
                  <i className='ri-arrow-left-s-line' style={{ fontSize: '1.1rem', color: '#222' }} />
                </button>
              )}
              {imgIdx < imgs.length - 1 && (
                <button onClick={next} aria-label='Next photo' style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 3, background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.18)' }}>
                  <i className='ri-arrow-right-s-line' style={{ fontSize: '1.1rem', color: '#222' }} />
                </button>
              )}
              <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 4, zIndex: 2 }}>
                {imgs.slice(0, 5).map((_, i) => (
                  <span key={i} style={{ width: i === imgIdx ? 6 : 5, height: i === imgIdx ? 6 : 5, borderRadius: '50%', background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all 0.15s' }} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Card text */}
        <div style={{ paddingTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {listing.propertyName}
            </span>
            {isNew && (
              <span style={{ fontSize: 13, color: '#222', flexShrink: 0 }}>
                ★ <span style={{ fontSize: 12, color: '#717171' }}>New</span>
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: '#717171', marginTop: 2 }}>
            {[listing.unitType, listing.unitNo && `Unit ${listing.unitNo}`].filter(Boolean).join(' · ')}
          </div>
          <div style={{ fontSize: 13, color: '#717171', marginTop: 1 }}>
            {[bedroomLabel(listing.bedrooms), listing.bathrooms != null && `${listing.bathrooms} bath${listing.bathrooms !== 1 ? 's' : ''}`].filter(Boolean).join(' · ')}
          </div>
          <div style={{ marginTop: 8, fontSize: 15 }}>
            <span style={{ fontWeight: 700, color: '#222' }}>{formatGHS(listing.rent)}</span>
            <span style={{ fontWeight: 400, color: '#717171', fontSize: 13 }}> / month</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

// ─── Filters / sort ──────────────────────────────────────────────────────────

const BED_FILTERS = [
  { label: 'Any type', value: null },
  { label: 'Studio', value: 0 },
  { label: '1 bed', value: 1 },
  { label: '2 beds', value: 2 },
  { label: '3+ beds', value: 3 },
]

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price ↑', value: 'price_asc' },
  { label: 'Price ↓', value: 'price_desc' },
]

// ─── Main ───────────────────────────────────────────────────────────────────

export default function ListingsIndexView({ listings }: { listings: PublicListingDto[] }) {
  const { platformName, logoUrl, primaryColour } = usePlatformBranding()

  const [bedFilter, setBedFilter]    = useState<number | null>(null)
  const [maxPrice, setMaxPrice]      = useState<number | null>(null)
  const [sort, setSort]              = useState('newest')
  const [showPriceSlider, setSlider] = useState(false)

  const maxRent = useMemo(() => {
    const rents = listings.map(l => l.rent).filter((r): r is number => r != null)
    return rents.length ? Math.max(...rents) : 10000
  }, [listings])

  const filtered = useMemo(() => {
    let out = listings.filter(l => l.status === 'ACTIVE')
    if (bedFilter !== null) {
      out = bedFilter >= 3
        ? out.filter(l => (l.bedrooms ?? 0) >= 3)
        : out.filter(l => l.bedrooms === bedFilter)
    }
    if (maxPrice !== null) out = out.filter(l => l.rent == null || l.rent <= maxPrice)
    return [...out].sort((a, b) => {
      if (sort === 'price_asc')  return (a.rent ?? 0) - (b.rent ?? 0)
      if (sort === 'price_desc') return (b.rent ?? 0) - (a.rent ?? 0)
      return new Date((b as any).createdAt ?? 0).getTime() - new Date((a as any).createdAt ?? 0).getTime()
    })
  }, [listings, bedFilter, maxPrice, sort])

  const hasFilters = bedFilter !== null || maxPrice !== null

  const chip = (active: boolean): React.CSSProperties => ({
    padding: '9px 18px', borderRadius: 40,
    border: `1px solid ${active ? '#222' : '#DDDDDD'}`,
    background: active ? '#222' : '#fff',
    color: active ? '#fff' : '#222',
    fontSize: 13, fontWeight: active ? 600 : 500,
    cursor: 'pointer', fontFamily: 'inherit',
    whiteSpace: 'nowrap', transition: 'all 0.15s',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>

      {/* ── Header ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', borderBottom: '1px solid #EBEBEB' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo: platform logo image if set, otherwise a generic pin icon in brand colour */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {logoUrl ? (
              <img src={logoUrl} alt={platformName} style={{ height: 36, objectFit: 'contain' }} />
            ) : (
              <>
                <svg width='30' height='30' viewBox='0 0 32 32' fill={primaryColour} xmlns='http://www.w3.org/2000/svg'>
                  <path d='M16 1C10.5 1 6 5.9 6 12c0 4.3 2.3 8.6 5 11.5L16 29l5-5.5c2.7-2.9 5-7.2 5-11.5C26 5.9 21.5 1 16 1zm0 15a4 4 0 110-8 4 4 0 010 8z'/>
                </svg>
                <span style={{ fontWeight: 800, fontSize: 18, color: primaryColour, letterSpacing: '-0.5px' }}>
                  {platformName}
                </span>
              </>
            )}
          </div>
          <div style={{ fontSize: 13, color: '#717171' }}>
            {filtered.length > 0 && `${filtered.length} available`}
          </div>
        </div>
      </header>

      {/* ── Filter bar ── */}
      <div style={{ position: 'sticky', top: 72, zIndex: 40, background: '#fff', borderBottom: '1px solid #EBEBEB' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 24px' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', alignItems: 'center', paddingBottom: 2 }}>
            {BED_FILTERS.map(f => (
              <button key={String(f.value)} onClick={() => setBedFilter(f.value)} style={chip(bedFilter === f.value)}>
                {f.label}
              </button>
            ))}

            <span style={{ width: 1, height: 20, background: '#DDDDDD', flexShrink: 0, margin: '0 4px' }} />

            <button onClick={() => setSlider(s => !s)} style={{ ...chip(maxPrice !== null), display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className='ri-equalizer-line' />
              {maxPrice !== null ? `Max GH₵ ${Number(maxPrice).toLocaleString()}` : 'Price'}
            </button>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexShrink: 0 }}>
              {SORT_OPTIONS.map(o => (
                <button key={o.value} onClick={() => setSort(o.value)} style={{ ...chip(sort === o.value), padding: '9px 14px' }}>
                  {o.label}
                </button>
              ))}
            </div>

            {hasFilters && (
              <button onClick={() => { setBedFilter(null); setMaxPrice(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', color: '#222', fontFamily: 'inherit', padding: '9px 8px', whiteSpace: 'nowrap' }}>
                Clear all
              </button>
            )}
          </div>

          {showPriceSlider && (
            <div style={{ padding: '14px 0 4px', borderTop: '1px solid #F0F0F0', marginTop: 10, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#222', minWidth: 180 }}>
                Max: {maxPrice !== null ? `GH₵ ${Number(maxPrice).toLocaleString()}` : 'Any price'}
              </label>
              <input
                type='range' min={0} max={maxRent} step={100}
                value={maxPrice ?? maxRent}
                onChange={e => setMaxPrice(Number(e.target.value) >= maxRent ? null : Number(e.target.value))}
                style={{ flex: 1, maxWidth: 340, accentColor: primaryColour }}
              />
              <button onClick={() => setSlider(false)} style={{ fontSize: 13, color: '#222', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontWeight: 600 }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
        {listings.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#222', margin: 0 }}>
              Homes available in Ghana
            </h1>
            <p style={{ fontSize: 14, color: '#717171', marginTop: 6 }}>
              {filtered.length} home{filtered.length !== 1 ? 's' : ''} · Prices in GHS
            </p>
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: listings.length === 0 ? '#F7F7F7' : '#FFF5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              <i className={listings.length === 0 ? 'ri-home-4-line' : 'ri-search-line'} style={{ fontSize: '2.2rem', color: listings.length === 0 ? '#CCCCCC' : primaryColour }} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#222' }}>
              {listings.length === 0 ? 'No listings yet' : 'No exact matches'}
            </div>
            <div style={{ fontSize: 14, color: '#717171', maxWidth: 300, lineHeight: 1.6 }}>
              {listings.length === 0
                ? 'Check back soon — new rentals are added regularly.'
                : "Try adjusting your filters to find what you're looking for."}
            </div>
            {listings.length > 0 && (
              <button
                onClick={() => { setBedFilter(null); setMaxPrice(null) }}
                style={{ marginTop: 8, padding: '12px 28px', borderRadius: 8, background: '#222', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '40px 24px' }}>
            {filtered.map(listing => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #EBEBEB', background: '#F7F7F7', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 12, color: '#717171' }}>
          <span>© 2025 {platformName} · Ghana Property Platform</span>
          <span style={{ color: '#BBBBBB' }}>All prices in Ghana Cedis (GHS)</span>
        </div>
      </footer>
    </div>
  )
}
