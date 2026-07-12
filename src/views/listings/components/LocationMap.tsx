'use client'

import { buildMaps, buildMapsEmbed } from '../lib/format'

interface LocationMapProps {
  propertyName: string
  propertyAddress: string
}

export default function LocationMap({ propertyName, propertyAddress }: LocationMapProps) {
  const query = `${propertyName}, ${propertyAddress}`

  return (
    <div>
      <div className='overflow-hidden rounded-2xl border border-[#EBEBEB]'>
        <iframe
          src={buildMapsEmbed(query)}
          title={`Map of ${propertyName}`}
          loading='lazy'
          referrerPolicy='no-referrer-when-downgrade'
          className='block h-[300px] w-full border-0 sm:h-[380px]'
        />
      </div>
      <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <i className='ri-map-pin-2-fill shrink-0 text-2xl text-[#222222]' aria-hidden='true' />
          <div>
            <div className='text-[15px] font-semibold text-[#222222]'>{propertyName}</div>
            <div className='mt-0.5 text-[13px] text-[#717171]'>{propertyAddress}</div>
          </div>
        </div>
        <a
          href={buildMaps(query)}
          target='_blank'
          rel='noopener noreferrer'
          className='flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-solid border-[#222222] px-4 py-2 text-[13px] font-semibold text-[#222222] no-underline'
        >
          <i className='ri-external-link-line' aria-hidden='true' /> Open in Maps
        </a>
      </div>
    </div>
  )
}
