'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { CityGroup } from '../lib/city'

// ImageKit does not serve original files on this account; see ikUrl.
import { ikUrl, IK_CARD } from '@/lib/imagekit'

const arrowBtn =
  'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-solid ' +
  'border-[#DDDDDD] bg-white text-[#222222] transition-colors hover:border-[#222222] ' +
  'disabled:cursor-default disabled:opacity-35 disabled:hover:border-[#DDDDDD]'

/**
 * Carousel of compact city cards ("Explore by city") — photo, label, listing
 * count — each linking to the dedicated city page. Scroll-snapped horizontal
 * track with paging arrows that disable at either end (touch swipe on mobile).
 */
export default function CityExploreStrip({ groups }: { groups: CityGroup[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  function updateArrows() {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 0)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [groups])

  function page(dir: 1 | -1) {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: 'smooth' })
  }

  if (groups.length === 0) return null

  return (
    <section aria-label='Explore by city' className='mb-11'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-xl font-extrabold text-[#222222]'>Explore by city</h2>
        <div className='flex gap-2'>
          <button aria-label='Scroll cities left' disabled={!canLeft} onClick={() => page(-1)} className={arrowBtn}>
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
              <path d='M15 18l-6-6 6-6' />
            </svg>
          </button>
          <button aria-label='Scroll cities right' disabled={!canRight} onClick={() => page(1)} className={arrowBtn}>
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
              <path d='M9 6l6 6-6 6' />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        data-city-track
        onScroll={updateArrows}
        className='mt-4 grid snap-x snap-mandatory auto-cols-[104px] grid-flow-col gap-3 overflow-x-auto pb-2 sm:auto-cols-[124px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      >
        {groups.map(group => {
          const photo = group.listings.find(l => l.images.length > 0)?.images[0]
          return (
            <Link
              key={group.slug}
              href={`/listings/city/${group.slug}`}
              className='group/city relative block aspect-[4/5] snap-start overflow-hidden rounded-xl bg-[#222222] no-underline'
            >
              {photo && (
                <img
                  src={ikUrl(photo, IK_CARD)}
                  alt=''
                  loading='lazy'
                  className='absolute inset-0 h-full w-full object-cover opacity-85 transition-transform duration-300 group-hover/city:scale-105'
                />
              )}
              <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent' aria-hidden='true' />
              <div className='absolute inset-x-0 bottom-0 p-2.5'>
                <div className='text-[13px] font-bold leading-tight text-white'>{group.label}</div>
                <div className='mt-0.5 text-[11px] text-white/80'>
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
