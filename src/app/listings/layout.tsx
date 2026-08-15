import type { ReactNode } from 'react'
import { PlatformBrandingProvider } from '@/contexts/PlatformBrandingContext'

/**
 * Public listings layout.
 * Applies the same fonts as the dashboard (Neo Sans Std for headings,
 * Proxima Nova Rg for body). The @font-face declarations are already
 * loaded globally via src/assets/fonts/stylesheet.css in the root layout.
 * MUI's CssBaseline (which normally does this) doesn't run on public pages,
 * so we set font-family directly here.
 * PlatformBrandingProvider fetches GET /api/v1/public/branding (no auth needed)
 * so the listings pages can use platformName, logoUrl, and primaryColour.
 */
export default function ListingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        .listings-root, .listings-root * {
          box-sizing: border-box;
        }
        .listings-root {
          font-family: 'Proxima Nova Rg', sans-serif;
          font-size: 15px;
          line-height: 1.5;
          color: #1a1a2e;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .listings-root h1,
        .listings-root h2,
        .listings-root h3,
        .listings-root h4,
        .listings-root h5,
        .listings-root h6 {
          font-family: var(--font-bricolage-grotesque), sans-serif;
          font-weight: bold;
          margin: 0;
        }
        .listings-root button,
        .listings-root input,
        .listings-root select,
        .listings-root textarea {
          font-family: 'Proxima Nova Rg', sans-serif;
        }
        .listings-root a {
          color: inherit;
        }
        .listings-root p {
          margin: 0;
        }
      `}</style>
      <div className='listings-root'>
        <PlatformBrandingProvider>
          {children}
        </PlatformBrandingProvider>
      </div>
    </>
  )
}
