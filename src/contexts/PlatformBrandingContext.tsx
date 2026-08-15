'use client'

/**
 * PlatformBrandingContext
 *
 * Fetches branding from the public (unauthenticated) backend endpoint and
 * exposes it to all components inside the tenant portal.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlatformBrandingState {
  platformName:  string
  logoUrl:       string
  primaryColour: string
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const PlatformBrandingContext = createContext<PlatformBrandingState>({
  platformName:  'TenantX',
  logoUrl:       '',
  primaryColour: '#7367F0',
})

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function PlatformBrandingProvider({ children }: { children: React.ReactNode }) {
  const [platformName,  setPlatformName]  = useState('TenantX')
  const [logoUrl,       setLogoUrl]       = useState('')
  const [primaryColour, setPrimaryColour] = useState('#7367F0')

  const fetchBranding = useCallback(async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1'
      const res = await fetch(`${apiBase}/public/branding`, { cache: 'no-store' })

      if (!res.ok) return
      const data = await res.json()

      if (data.platformName)  setPlatformName(data.platformName)
      if (data.logoUrl !== undefined) setLogoUrl(data.logoUrl)
      if (data.primaryColour) setPrimaryColour(data.primaryColour)
    } catch {
      // silently fall back to defaults
    }
  }, [])

  useEffect(() => { fetchBranding() }, [fetchBranding])

  return (
    <PlatformBrandingContext.Provider value={{ platformName, logoUrl, primaryColour }}>
      {children}
    </PlatformBrandingContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePlatformBranding() {
  return useContext(PlatformBrandingContext)
}
