'use client'

import Link from 'next/link'
import { usePlatformBranding } from '@/contexts/PlatformBrandingContext'
import { buildTerms, buildPrivacy } from './lib/legal'
import SiteFooter from './components/SiteFooter'

export default function LegalPageView({ doc }: { doc: 'terms' | 'privacy' }) {
  const { platformName, logoUrl, primaryColour } = usePlatformBranding()
  const { title, lastUpdated, intro, sections } = doc === 'terms' ? buildTerms(platformName) : buildPrivacy(platformName)

  return (
    <div className='flex min-h-screen flex-col bg-white'>
      {/* ── Header (same shell as the detail page) ── */}
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

      {/* ── Document ── */}
      <main className='mx-auto w-full max-w-3xl flex-1 px-6 pb-20 pt-10'>
        <h1 className='text-[32px] font-extrabold leading-tight text-[#222222]'>{title}</h1>
        <p className='mt-2 text-[13px] text-[#717171]'>Last updated: {lastUpdated}</p>
        <p className='mt-6 text-[15px] leading-relaxed text-[#222222]'>{intro}</p>

        {sections.map(section => (
          <section key={section.heading} className='mt-9'>
            <h2 className='text-lg font-bold text-[#222222]'>{section.heading}</h2>
            {section.paragraphs?.map(p => (
              <p key={p} className='mt-3 text-[15px] leading-relaxed text-[#484848]'>
                {p}
              </p>
            ))}
            {section.bullets && (
              <ul className='mt-3 list-none space-y-2 pl-0'>
                {section.bullets.map(b => (
                  <li key={b} className='flex items-start gap-2.5 text-[15px] leading-relaxed text-[#484848]'>
                    <span className='mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#DDDDDD]' aria-hidden='true' />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </main>

      <SiteFooter />
    </div>
  )
}
