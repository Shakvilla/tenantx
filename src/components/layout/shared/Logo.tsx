'use client'

// React Imports
import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'

// Third-party Imports
import styled from '@emotion/styled'

// Type Imports
import type { VerticalNavContextProps } from '@menu/contexts/verticalNavContext'

// Component Imports
import MaterializeLogo from '@core/svg/Logo'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useAuth } from '@/contexts/AuthContext'
import { usePlatformBranding } from '@/contexts/PlatformBrandingContext'

/**
 * The Yiliora lockup — mark plus wordmark — in a light and a dark cut.
 *
 * <p>Two files rather than one because the wordmark is near-black (#101322) and
 * measures 1.49:1 against the dark theme's ground, i.e. invisible. The dark cut
 * carries the same artwork with the wordmark in white; the pink mark is identical
 * in both, since it clears contrast on either ground unchanged.
 */
const LOCKUP_LIGHT = '/images/logo/yiliora-logo.png'
const LOCKUP_DARK = '/images/logo/yiliora-logo-dark.png'

type LogoTextProps = {
  isHovered?: VerticalNavContextProps['isHovered']
  isCollapsed?: VerticalNavContextProps['isCollapsed']
  transitionDuration?: VerticalNavContextProps['transitionDuration']
  isBreakpointReached?: VerticalNavContextProps['isBreakpointReached']
  color?: CSSProperties['color']
}

const LogoText = styled.span<LogoTextProps>`
  font-size: 1.25rem;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: 0.15px;
  text-transform: capitalize;
  color: var(--mui-palette-text-primary);
  color: ${({ color }) => color ?? 'var(--mui-palette-text-primary)'};
  transition: ${({ transitionDuration }) =>
    `margin-inline-start ${transitionDuration}ms ease-in-out, opacity ${transitionDuration}ms ease-in-out`};

  ${({ isHovered, isCollapsed, isBreakpointReached }) =>
    !isBreakpointReached && isCollapsed && !isHovered
      ? 'opacity: 0; margin-inline-start: 0;'
      : 'opacity: 1; margin-inline-start: 8px;'}
`

const Logo = ({ color }: { color?: CSSProperties['color'] }) => {
  // Refs
  const logoTextRef = useRef<HTMLSpanElement>(null)

  // Hooks
  const { isHovered, transitionDuration, isBreakpointReached } = useVerticalNav()
  const { settings } = useSettings()
  const { tenant, isAuthenticated } = useAuth()
  const { logoUrl, platformName: brandingName } = usePlatformBranding()

  // Vars
  const { layout } = settings

  // settings.mode is only a fallback here — the hook prefers MUI's live colour
  // scheme, and resolves 'system' itself.
  const lockup = useImageVariant(settings.mode ?? themeConfig.mode, LOCKUP_LIGHT, LOCKUP_DARK)

  // Use tenant name if authenticated, otherwise use default template name
  const displayName = isAuthenticated && tenant?.name ? tenant.name : themeConfig.templateName

  /**
   * Collapsed rail: the lockup is 2.4:1 and will not fit a ~68px rail, so the
   * standalone mark stands in. It is also the only cut that is a vector, which is
   * what you want at the size the rail renders it.
   */
  const isNarrowRail = layout === 'collapsed' && !isHovered && !isBreakpointReached

  /**
   * The lockup already sets the word "Yiliora", so printing the platform name
   * beside it would say it twice. A tenant's own name is different information —
   * it is the workspace label — so that still shows.
   */
  const showNameBesideLogo = displayName !== themeConfig.templateName

  useEffect(() => {
    if (layout !== 'collapsed') {
      return
    }

    if (logoTextRef && logoTextRef.current) {
      if (!isBreakpointReached && layout === 'collapsed' && !isHovered) {
        logoTextRef.current?.classList.add('hidden')
      } else {
        logoTextRef.current.classList.remove('hidden')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered, layout, isBreakpointReached])

  return (
    <div className='flex items-center min-bs-[24px]'>
      {logoUrl ? (
        // A tenant's own uploaded branding always wins over the platform lockup.
        <img
          src={logoUrl}
          alt={brandingName || displayName}
          style={{ maxHeight: 28, maxWidth: 120, objectFit: 'contain' }}
        />
      ) : isNarrowRail ? (
        <MaterializeLogo />
      ) : (
        <img src={lockup} alt={brandingName || 'Yiliora'} style={{ height: 28, width: 'auto' }} />
      )}
      {(logoUrl || isNarrowRail || showNameBesideLogo) && (
        <LogoText
          color={color}
          ref={logoTextRef}
          isHovered={isHovered}
          isCollapsed={layout === 'collapsed'}
          transitionDuration={transitionDuration}
          isBreakpointReached={isBreakpointReached}
        >
          {displayName}
        </LogoText>
      )}
    </div>
  )
}

export default Logo

