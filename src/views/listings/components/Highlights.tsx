'use client'

import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { formatDate } from '../lib/format'

export default function Highlights({ listing }: { listing: PublicListingDto }) {
  const items: { icon: string; title: string; sub: string }[] = []

  if (listing.availableFrom) {
    items.push({
      icon: 'ri-calendar-check-line',
      title: `Available ${formatDate(listing.availableFrom)}`,
      sub: 'Secure your move-in date today',
    })
  }
  if (listing.bedrooms === 0) {
    items.push({ icon: 'ri-home-2-line', title: 'Studio apartment', sub: 'Efficient open-plan living' })
  } else if (listing.bedrooms != null) {
    items.push({
      icon: 'ri-hotel-bed-line',
      title: `${listing.bedrooms}-bedroom ${listing.unitType.toLowerCase()}`,
      sub: 'Fully private bedrooms',
    })
  }
  if (listing.amenities.length >= 3) {
    items.push({
      icon: 'ri-star-line',
      title: `${listing.amenities.length} amenities included`,
      sub: listing.amenities.slice(0, 2).join(', ') + ' & more',
    })
  }
  if (listing.contactPhone) {
    items.push({
      icon: 'ri-shield-check-line',
      title: 'Verified property manager',
      sub: 'Identity and licence confirmed',
    })
  }

  if (!items.length) return null

  return (
    <div className='flex flex-col'>
      {items.slice(0, 3).map((h, i) => (
        <div
          key={i}
          className={`flex items-start gap-4 py-4 ${
            i < Math.min(items.length, 3) - 1 ? 'border-b border-[#EBEBEB]' : ''
          }`}
        >
          <i className={`${h.icon} mt-0.5 shrink-0 text-2xl text-[#222222]`} aria-hidden='true' />
          <div>
            <div className='text-[15px] font-semibold text-[#222222]'>{h.title}</div>
            <div className='mt-0.5 text-[13px] text-[#717171]'>{h.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
