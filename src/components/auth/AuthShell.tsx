'use client'

import type { ReactNode } from 'react'

import classnames from 'classnames'

import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'

/**
 * The split-panel login layout, extracted because Login.tsx renders three branches through it
 * (main form, workspace selection, OTP challenge) and three copies of forty lines of layout is
 * three places for them to drift.
 */
export default function AuthShell({
  children,
  characterIllustration,
  authBackground,
  bordered
}: {
  children: ReactNode
  characterIllustration: string
  authBackground: string
  bordered: boolean
}) {
  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          { 'border-ie': bordered }
        )}
      >
        <div className='pli-6 max-lg:mbs-40 lg:mbe-24'>
          <img src={characterIllustration} alt='character-illustration' className='max-bs-[673px] max-is-full bs-auto' />
        </div>
        <img src={authBackground} className='absolute bottom-[4%] z-[-1] is-full max-md:hidden' />
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <Link className='absolute block-start-5 sm:block-start-[38px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </Link>
        <div className='flex flex-col gap-5 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          {children}
        </div>
      </div>
    </div>
  )
}
