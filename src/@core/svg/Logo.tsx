// React Imports
import type { SVGAttributes } from 'react'

/**
 * The Yiliora mark — the Y glyph only, without the wordmark.
 *
 * <p>The full lockup lives at {@code public/images/logo/yiliora.svg}. It is not
 * used here on purpose: the sidebar renders the platform (or tenant) name as a
 * text element right beside this mark, so a lockup would print the name twice.
 * The lockup also sets its wordmark in an unstyled {@code <text>} element, which
 * resolves to whatever default face the viewer's OS supplies — fine for a quick
 * preview, wrong for a logo. Pairing the mark with the sidebar's own themed text
 * sidesteps both problems and gets dark mode for free.
 *
 * <p>The stroke is the brand pink rather than {@code var(--mui-palette-primary-main)}
 * so the mark stays the mark when a tenant's branding changes the primary colour.
 * Swap the constant below if you would rather it follow the theme.
 */
const BRAND = '#EF4195'

const Logo = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg
      width='24'
      height='28'
      viewBox='8 6 24 28'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      role='img'
      aria-label='Yiliora'
      {...props}
    >
      <g transform='translate(4 4)'>
        <path
          d='M23.4 6.6 L16 15.4 L16 25.4'
          fill='none'
          stroke={BRAND}
          strokeWidth='5.6'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path d='M8.6 6.6 L10.8 9.2' fill='none' stroke={BRAND} strokeWidth='5.6' strokeLinecap='round' />
      </g>
    </svg>
  )
}

export default Logo
