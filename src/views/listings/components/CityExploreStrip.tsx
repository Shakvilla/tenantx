'use client'

import Link from 'next/link'
import type { CityGroup } from '../lib/city'

/**
 * Horizontal-scroll row of city cards ("Explore by city") — photo, label,
 * listing count — each linking to the dedicated city page.
 */
export default function CityExploreStrip({ groups }: { groups: CityGroup[] }) {
  if (groups.length === 0) return null

  return (
    <section aria-label='Explore by city' className='mb-11'>
      <h2 className='text-xl font-extrabold text-[#222222]'>Explore by city</h2>
      <div className='mt-4 grid auto-cols-[150px] grid-flow-col gap-4 overflow-x-auto pb-2 sm:auto-cols-[190px]'>
        {groups.map(group => {
          const photo = group.listings.find(l => l.images.length > 0)?.images[0]
          return (
            <Link
              key={group.slug}
              href={`/listings/city/${group.slug}`}
              className='group/city relative block aspect-[4/5] overflow-hidden rounded-2xl bg-[#222222] no-underline'
            >
              {photo && (
                <img
                  src={photo}
                  alt=''
                  loading='lazy'
                  className='absolute inset-0 h-full w-full object-cover opacity-85 transition-transform duration-300 group-hover/city:scale-105'
                />
              )}
              <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent' aria-hidden='true' />
              <div className='absolute inset-x-0 bottom-0 p-3.5'>
                <div className='text-[15px] font-bold leading-tight text-white'>{group.label}</div>
                <div className='mt-0.5 text-xs text-white/80'>
                  {group.listings.length} home{group.listings.length !== 1 ? 's' : ''}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
