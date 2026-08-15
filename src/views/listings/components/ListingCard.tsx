'use client'

import Link from 'next/link'
import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { formatGHS, bedroomLabel, daysSince } from '../lib/format'
import PhotoCarousel from './PhotoCarousel'
import SaveButton from './SaveButton'

interface ListingCardProps {
  listing: PublicListingDto
  saved: boolean
  onToggleSave: () => void
}

export default function ListingCard({ listing, saved, onToggleSave }: ListingCardProps) {
  const age = daysSince(listing.createdAt)
  const isNew = age != null && age <= 14

  const bedBath = [
    bedroomLabel(listing.bedrooms),
    listing.bathrooms != null && `${listing.bathrooms} bath${listing.bathrooms !== 1 ? 's' : ''}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link href={`/listings/${listing.id}`} className='group/card block text-inherit no-underline'>
      <article>
        <div className='relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#F0F0F0]'>
          <PhotoCarousel images={listing.images} alt={listing.title} />
          <SaveButton saved={saved} onToggle={onToggleSave} className='absolute right-3 top-3 z-[2]' />
          {isNew && (
            <span className='absolute left-3 top-3 z-[2] rounded-full bg-white px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#222222] shadow-sm'>
              New
            </span>
          )}
        </div>

        <div className='pt-2.5'>
          <div className='truncate text-sm font-semibold text-[#222222]'>{listing.propertyAddress}</div>
          <div className='mt-0.5 truncate text-[13px] text-[#717171]'>
            {[listing.propertyName, listing.unitNo && `Unit ${listing.unitNo}`].filter(Boolean).join(' · ')}
          </div>
          {bedBath && <div className='text-[13px] text-[#717171]'>{bedBath}</div>}
          <div className='mt-2 text-[15px]'>
            <span className='font-bold text-[#222222]'>{formatGHS(listing.rent)}</span>
            <span className='text-[13px] text-[#717171]'> / month</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
