'use client'

/**
 * BrandingThemeBridge
 *
 * Invisible component that reads the platform primary colour from
 * PlatformBrandingContext (fetched from /api/v1/public/branding) and syncs it
 * into the MUI theme via the settings system.
 *
 * Must be mounted inside both:
 *  - PlatformBrandingProvider  (to read primaryColour)
 *  - SettingsProvider          (to call updateSettings)
 *
 * updateCookie: false — branding colour is always fetched fresh from the API,
 * so we don't pollute the user's stored settings cookie with it.
 *
 * Returns null — renders nothing.
 */

import { useEffect } from 'react'

import { usePlatformBranding } from '@/contexts/PlatformBrandingContext'
import { useSettings } from '@core/hooks/useSettings'

export default function BrandingThemeBridge() {
  const { primaryColour } = usePlatformBranding()
  const { updateSettings } = useSettings()

  useEffect(() => {
    if (primaryColour) {
      updateSettings({ primaryColor: primaryColour }, { updateCookie: false })
    }
    // updateSettings is intentionally omitted from deps — it is not memoized in
    // SettingsProvider, so its reference changes on every render. Including it
    // would cause an infinite loop. primaryColour is the only trigger we need.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryColour])

  return null
}
