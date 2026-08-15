'use client'

import { useState } from 'react'
import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { formatGHS, formatDate, buildWhatsApp } from '../lib/format'

interface BookingCardProps {
  listing: PublicListingDto
  primaryColour: string
  onRequestViewing: () => void
}

const outlineLink =
  'flex w-full items-center justify-center gap-2 rounded-lg border border-solid border-[#DDDDDD] bg-white ' +
  'px-3 py-3 text-sm font-medium text-[#222222] no-underline transition-colors hover:border-[#222222]'

export default function BookingCard({ listing, primaryColour, onRequestViewing }: BookingCardProps) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <div className='flex flex-col gap-3.5 rounded-2xl border border-solid border-[#DDDDDD] p-6 shadow-[0_6px_20px_rgba(0,0,0,0.10)]'>
      <div className='flex items-end gap-1.5'>
        <span className='text-2xl font-extrabold text-[#222222]'>{formatGHS(listing.rent)}</span>
        <span className='pb-0.5 text-sm text-[#717171]'>/ month</span>
      </div>

      {listing.availableFrom && (
        <div className='flex items-center gap-2 rounded-lg bg-[#F0FBF0] px-3.5 py-2.5 text-[13px] font-medium text-[#0A7B34]'>
          <i className='ri-calendar-check-line' aria-hidden='true' />
          Available {formatDate(listing.availableFrom)}
        </div>
      )}

      <hr className='m-0 border-0 border-t border-solid border-[#EBEBEB]' />

      {listing.contactPhone && (
        <a
          href={buildWhatsApp(listing.contactPhone, listing.title)}
          target='_blank'
          rel='noopener noreferrer'
          className='flex w-full items-center justify-center gap-2 rounded-lg border-none bg-[#25D366] px-3 py-3.5 text-[15px] font-semibold text-white no-underline'
        >
          <i className='ri-whatsapp-line text-lg' aria-hidden='true' />
          WhatsApp agent
        </a>
      )}

      <button
        onClick={onRequestViewing}
        className='w-full cursor-pointer rounded-lg border-none px-3 py-3.5 text-[15px] font-semibold text-white'
        style={{ background: primaryColour }}
      >
        Request a viewing
      </button>

      <p className='m-0 text-center text-xs text-[#717171]'>You won't be charged anything</p>

      <hr className='m-0 border-0 border-t border-solid border-[#EBEBEB]' />

      {listing.contactPhone && (
        <a href={`tel:${listing.contactPhone}`} className={outlineLink}>
          <i className='ri-phone-line' aria-hidden='true' /> Call agent
        </a>
      )}
      {listing.contactEmail && (
        <a
          href={`mailto:${listing.contactEmail}?subject=${encodeURIComponent('Enquiry: ' + listing.title)}`}
          className={outlineLink}
        >
          <i className='ri-mail-line' aria-hidden='true' /> Email agent
        </a>
      )}

      <button
        onClick={copy}
        className={`cursor-pointer border-none bg-transparent py-1 text-xs underline ${
          copied ? 'text-[#0A7B34]' : 'text-[#717171]'
        }`}
      >
        <i className={`${copied ? 'ri-check-line' : 'ri-link'} mr-1`} aria-hidden='true' />
        {copied ? 'Link copied!' : 'Copy listing link'}
      </button>

      <div className='flex items-center gap-3 pt-1'>
        <div
          className='flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-base font-bold text-white'
          style={{ background: primaryColour }}
        >
          {listing.propertyName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className='text-[13px] font-semibold text-[#222222]'>{listing.propertyName}</div>
          <div className='mt-0.5 flex items-center gap-1 text-xs text-[#717171]'>
            <i className='ri-shield-check-fill text-sm text-[#0A7B34]' aria-hidden='true' /> Verified manager
          </div>
        </div>
      </div>
    </div>
  )
}
