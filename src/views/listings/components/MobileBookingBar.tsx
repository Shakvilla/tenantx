'use client'

import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { formatGHS } from '../lib/format'

interface MobileBookingBarProps {
  listing: PublicListingDto
  primaryColour: string
  onRequestViewing: () => void
}

export default function MobileBookingBar({ listing, primaryColour, onRequestViewing }: MobileBookingBarProps) {
  return (
    <div
      className='fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t border-solid border-[#EBEBEB] bg-white px-5 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden'
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div>
        <div className='text-lg font-extrabold text-[#222222]'>{formatGHS(listing.rent)}</div>
        <div className='text-xs text-[#717171]'>per month</div>
      </div>
      <button
        onClick={onRequestViewing}
        className='cursor-pointer rounded-lg border-none px-6 py-3 text-sm font-semibold text-white'
        style={{ background: primaryColour }}
      >
        Request a viewing
      </button>
    </div>
  )
}
