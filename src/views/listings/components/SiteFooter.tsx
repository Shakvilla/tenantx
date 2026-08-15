'use client'

import Link from 'next/link'
import { usePlatformBranding } from '@/contexts/PlatformBrandingContext'

interface SiteFooterProps {
  /** Right side of the bottom bar; defaults to the GHS pricing note. */
  rightNote?: string
  className?: string
}

const GOOD_TO_KNOW = [
  'Requesting a viewing is free',
  'Every listing has a verified property manager',
  'Prices are monthly, in Ghana Cedis',
]

export default function SiteFooter({ rightNote, className = '' }: SiteFooterProps) {
  const { platformName, logoUrl, primaryColour } = usePlatformBranding()
  const year = new Date().getFullYear()

  return (
    <footer className={`border-t border-[#EBEBEB] bg-[#F7F7F7] ${className}`}>
      <div className='mx-auto max-w-[1400px] px-6 py-10 lg:px-10'>
        {/* ── Tier 1: brand + link columns ── */}
        <div className='grid grid-cols-1 gap-10 sm:grid-cols-3'>
          <div>
            {logoUrl ? (
              <img src={logoUrl} alt={platformName} className='h-7 object-contain' />
            ) : (
              <div className='flex items-center gap-2'>
                <svg width='22' height='22' viewBox='0 0 32 32' fill={primaryColour} aria-hidden='true'>
                  <path d='M16 1C10.5 1 6 5.9 6 12c0 4.3 2.3 8.6 5 11.5L16 29l5-5.5c2.7-2.9 5-7.2 5-11.5C26 5.9 21.5 1 16 1zm0 15a4 4 0 110-8 4 4 0 010 8z' />
                </svg>
                <span className='text-base font-extrabold tracking-tight' style={{ color: primaryColour }}>
                  {platformName}
                </span>
              </div>
            )}
            <p className='mt-3 max-w-xs text-[13px] leading-relaxed text-[#717171]'>
              Quality rental homes across Ghana, listed and managed by verified property managers.
            </p>
          </div>

          <nav aria-label='Footer'>
            <h3 className='text-xs font-semibold uppercase tracking-[0.15em] text-[#222222]'>Explore</h3>
            <ul className='m-0 mt-3 list-none space-y-2 pl-0'>
              <li>
                <Link
                  href='/listings'
                  className='text-[13px] text-[#717171] no-underline transition-colors hover:text-[#222222] hover:underline'
                >
                  Browse all homes
                </Link>
              </li>
              <li>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className='cursor-pointer border-none bg-transparent p-0 text-[13px] text-[#717171] transition-colors hover:text-[#222222] hover:underline'
                >
                  Back to top
                </button>
              </li>
            </ul>
          </nav>

          <div>
            <h3 className='text-xs font-semibold uppercase tracking-[0.15em] text-[#222222]'>Good to know</h3>
            <ul className='m-0 mt-3 list-none space-y-2 pl-0'>
              {GOOD_TO_KNOW.map(note => (
                <li key={note} className='flex items-start gap-2 text-[13px] text-[#717171]'>
                  <i className='ri-checkbox-circle-line mt-px shrink-0 text-sm text-[#0A7B34]' aria-hidden='true' />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Tier 2: legal bar ── */}
        <div className='mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-[#EBEBEB] pt-5 text-xs text-[#717171]'>
          <span className='flex flex-wrap items-center gap-x-2 gap-y-1'>
            <span>
              © {year} {platformName} · Ghana Property Platform
            </span>
            <span aria-hidden='true'>·</span>
            <Link href='/listings/terms' className='text-[#717171] no-underline hover:text-[#222222] hover:underline'>
              Terms
            </Link>
            <span aria-hidden='true'>·</span>
            <Link href='/listings/privacy' className='text-[#717171] no-underline hover:text-[#222222] hover:underline'>
              Privacy
            </Link>
          </span>
          <span className='text-[#BBBBBB]'>{rightNote ?? 'All prices in Ghana Cedis (GHS)'}</span>
        </div>
      </div>
    </footer>
  )
}
