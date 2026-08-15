'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { amenityLabel, amenityIcon } from '@/lib/amenities'
import { usePlatformBranding } from '@/contexts/PlatformBrandingContext'
import { useSavedListings } from './lib/useSavedListings'
import PhotoMosaic from './components/PhotoMosaic'
import Highlights from './components/Highlights'
import LocationMap from './components/LocationMap'
import InquiryForm from './components/InquiryForm'
import BookingCard from './components/BookingCard'
import MobileBookingBar from './components/MobileBookingBar'
import SimilarListings from './components/SimilarListings'
import SaveButton from './components/SaveButton'
import SiteFooter from './components/SiteFooter'

// ─── View ────────────────────────────────────────────────────────────────────

interface ListingDetailViewProps {
  listing: PublicListingDto
  allListings?: PublicListingDto[]
}

export default function ListingDetailView({ listing, allListings = [] }: ListingDetailViewProps) {
  const { platformName, logoUrl, primaryColour } = usePlatformBranding()
  const { isSaved, toggle } = useSavedListings()
  const [descExpanded, setDescExpanded] = useState(false)
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false)
  const [shared, setShared] = useState(false)

  const isInactive = listing.status !== 'ACTIVE'

  const descWords = (listing.description ?? '').split(' ')
  const longDesc = descWords.length > 60
  const visibleDesc = !longDesc || descExpanded ? listing.description : descWords.slice(0, 60).join(' ') + '…'
  const visibleAmenities = amenitiesExpanded ? listing.amenities : listing.amenities.slice(0, 8)

  function scrollToForm() {
    document.getElementById('request-viewing')?.scrollIntoView({ behavior: 'smooth' })
  }

  function share() {
    const url = window.location.href
    if (typeof navigator.share === 'function') {
      navigator.share({ title: listing.title, url }).catch(() => {})
    } else if (navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setShared(true)
          setTimeout(() => setShared(false), 2000)
        })
        .catch(() => {})
    }
  }

  const actionBtn =
    'flex cursor-pointer items-center gap-1.5 rounded-lg border-none bg-transparent px-2.5 py-1.5 text-[13px] font-semibold text-[#222222] underline hover:bg-[#F7F7F7]'

  return (
    <div className='min-h-screen bg-white'>
      {/* ── Header ── */}
      <header className='sticky top-0 z-50 border-b border-[#EBEBEB] bg-white'>
        <div className='mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6'>
          <Link href='/listings' className='flex items-center gap-1.5 text-sm font-medium text-[#222222] no-underline'>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
              <path d='M19 12H5M5 12l7-7M5 12l7 7' />
            </svg>
            Back to listings
          </Link>

          <div className='flex items-center gap-2'>
            {logoUrl ? (
              <img src={logoUrl} alt={platformName} className='h-8 object-contain' />
            ) : (
              <>
                <svg width='24' height='24' viewBox='0 0 32 32' fill={primaryColour} aria-hidden='true'>
                  <path d='M16 1C10.5 1 6 5.9 6 12c0 4.3 2.3 8.6 5 11.5L16 29l5-5.5c2.7-2.9 5-7.2 5-11.5C26 5.9 21.5 1 16 1zm0 15a4 4 0 110-8 4 4 0 010 8z' />
                </svg>
                <span className='text-base font-extrabold tracking-tight' style={{ color: primaryColour }}>
                  {platformName}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Inactive banner ── */}
      {isInactive && (
        <div className='flex items-center gap-2 border-b border-[#FECACA] bg-[#FEF2F2] px-6 py-3 text-[13px] font-medium text-[#B91C1C]'>
          <i className='ri-error-warning-line text-lg' aria-hidden='true' />
          This unit is no longer available for rent.
        </div>
      )}

      {/* ── Content (bottom padding clears the mobile booking bar) ── */}
      <div className={`mx-auto max-w-6xl px-6 py-7 ${!isInactive ? 'pb-28 lg:pb-7' : ''}`}>
        {/* Title + actions */}
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h1 className='text-[26px] font-extrabold leading-tight text-[#222222]'>{listing.title}</h1>
            <div className='mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-[#717171]'>
              <i className='ri-map-pin-2-line' style={{ color: primaryColour }} aria-hidden='true' />
              <span>{listing.propertyAddress}</span>
              <span aria-hidden='true'>·</span>
              <span>{listing.unitType}</span>
              <span aria-hidden='true'>·</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isInactive ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-[#F0FBF0] text-[#0A7B34]'
                }`}
              >
                {isInactive ? 'Unavailable' : 'Available'}
              </span>
            </div>
          </div>

          <div className='flex shrink-0 items-center gap-1'>
            <button onClick={share} className={actionBtn}>
              <i className={shared ? 'ri-check-line' : 'ri-upload-2-line'} aria-hidden='true' />
              <span>{shared ? 'Copied' : 'Share'}</span>
            </button>
            <span className={actionBtn.replace('cursor-pointer ', '')} role='presentation'>
              <SaveButton saved={isSaved(listing.id)} onToggle={() => toggle(listing.id)} />
              <span aria-hidden='true'>{isSaved(listing.id) ? 'Saved' : 'Save'}</span>
            </span>
          </div>
        </div>

        {/* Photos */}
        <div className='mt-5'>
          <PhotoMosaic images={listing.images} title={listing.title} />
        </div>

        {/* Two-column body */}
        <div className='mt-9 grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_380px] lg:gap-[52px]'>
          {/* Left */}
          <div>
            {/* Host strip */}
            <div className='flex items-center justify-between border-b border-[#EBEBEB] pb-6'>
              <div>
                <div className='text-xl font-bold text-[#222222]'>
                  {listing.unitType} offered by {listing.propertyName}
                </div>
                <div className='mt-1 flex flex-wrap gap-2 text-sm text-[#717171]'>
                  {listing.bedrooms != null && (
                    <span>{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bedroom${listing.bedrooms !== 1 ? 's' : ''}`}</span>
                  )}
                  {listing.bathrooms != null && (
                    <>
                      <span aria-hidden='true'>·</span>
                      <span>{listing.bathrooms} bathroom{listing.bathrooms !== 1 ? 's' : ''}</span>
                    </>
                  )}
                  {listing.sizeSqft != null && (
                    <>
                      <span aria-hidden='true'>·</span>
                      <span>{Number(listing.sizeSqft).toLocaleString()} sqft</span>
                    </>
                  )}
                </div>
              </div>
              <div
                className='flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-xl font-extrabold text-white'
                style={{ background: primaryColour }}
              >
                {listing.propertyName.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Highlights */}
            <div className='border-b border-[#EBEBEB] py-6'>
              <Highlights listing={listing} />
            </div>

            {/* Description */}
            {listing.description && (
              <div className='border-b border-[#EBEBEB] py-6'>
                <p className='whitespace-pre-wrap text-[15px] leading-7 text-[#222222]'>{visibleDesc}</p>
                {longDesc && (
                  <button
                    onClick={() => setDescExpanded(e => !e)}
                    className='mt-3 flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-sm font-bold text-[#222222] underline'
                  >
                    {descExpanded ? 'Show less' : 'Show more'}
                    <i className={descExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} aria-hidden='true' />
                  </button>
                )}
              </div>
            )}

            {/* Amenities */}
            {listing.amenities.length > 0 && (
              <div className='border-b border-[#EBEBEB] py-6'>
                <h2 className='mb-[18px] text-xl font-bold text-[#222222]'>What this place offers</h2>
                <div className='grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2'>
                  {visibleAmenities.map((a, i) => (
                    <div key={i} className='flex items-center gap-3 text-sm text-[#222222]'>
                      <i className={`${amenityIcon(a)} shrink-0 text-xl`} aria-hidden='true' />
                      {amenityLabel(a)}
                    </div>
                  ))}
                </div>
                {listing.amenities.length > 8 && (
                  <button
                    onClick={() => setAmenitiesExpanded(e => !e)}
                    className='mt-[18px] cursor-pointer rounded-lg border border-solid border-[#222222] bg-white px-5 py-2.5 text-sm font-semibold text-[#222222]'
                  >
                    {amenitiesExpanded ? 'Show fewer amenities' : `Show all ${listing.amenities.length} amenities`}
                  </button>
                )}
              </div>
            )}

            {/* Location */}
            <div className='border-b border-[#EBEBEB] py-6'>
              <h2 className='mb-3.5 text-xl font-bold text-[#222222]'>Where you'll be</h2>
              <LocationMap propertyName={listing.propertyName} propertyAddress={listing.propertyAddress} />
            </div>

            {/* Inquiry form */}
            {!isInactive && (
              <div id='request-viewing' className='py-6'>
                <h2 className='mb-1.5 text-xl font-bold text-[#222222]'>Request a viewing</h2>
                <p className='mb-5 text-sm text-[#717171]'>
                  Fill in your details and the property manager will reach out to schedule a visit.
                </p>
                <InquiryForm listing={listing} primaryColour={primaryColour} />
              </div>
            )}
          </div>

          {/* Right (desktop sidebar) */}
          <div className='sticky top-[88px] hidden lg:block'>
            {isInactive ? (
              <div className='rounded-2xl border border-solid border-[#DDDDDD] p-7 text-center text-[#AAAAAA] shadow-[0_6px_20px_rgba(0,0,0,0.07)]'>
                <i className='ri-home-line mb-2.5 block text-4xl text-[#E0E0E0]' aria-hidden='true' />
                <div className='mb-1.5 text-[15px] font-semibold text-[#717171]'>Unit unavailable</div>
                <div className='mb-5 text-[13px]'>This listing has been deactivated.</div>
                <Link
                  href='/listings'
                  className='inline-block rounded-lg bg-[#222222] px-5 py-2.5 text-[13px] font-semibold text-white no-underline'
                >
                  Browse other listings
                </Link>
              </div>
            ) : (
              <BookingCard listing={listing} primaryColour={primaryColour} onRequestViewing={scrollToForm} />
            )}
          </div>
        </div>

        {/* Mobile-only inactive card (sidebar is hidden below lg) */}
        {isInactive && (
          <div className='mt-8 rounded-2xl border border-solid border-[#DDDDDD] p-7 text-center text-[#AAAAAA] lg:hidden'>
            <div className='mb-1.5 text-[15px] font-semibold text-[#717171]'>Unit unavailable</div>
            <Link href='/listings' className='mt-2 inline-block rounded-lg bg-[#222222] px-5 py-2.5 text-[13px] font-semibold text-white no-underline'>
              Browse other listings
            </Link>
          </div>
        )}

        {/* Similar listings */}
        <div className='mt-10'>
          <SimilarListings all={allListings} current={listing} isSaved={isSaved} onToggleSave={toggle} />
        </div>
      </div>

      {/* Mobile booking bar */}
      {!isInactive && (
        <MobileBookingBar listing={listing} primaryColour={primaryColour} onRequestViewing={scrollToForm} />
      )}

      <SiteFooter className='mt-10' rightNote={`Listing #${listing.id.slice(0, 8).toUpperCase()}`} />
    </div>
  )
}
