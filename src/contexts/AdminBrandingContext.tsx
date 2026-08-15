'use client'

/**
 * AdminBrandingContext
 *
 * Fetches the BRANDING platform settings once on mount and exposes them
 * to all components inside the admin shell. Call refresh() after saving
 * branding settings to propagate changes without a page reload.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

import { getPlatformSettings } from '@/lib/api/admin-auth-client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BrandingState {
  platformName:  string
  logoUrl:       string
  primaryColour: string
  refresh:       () => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AdminBrandingContext = createContext<BrandingState>({
  platformName:  'TenantX',
  logoUrl:       '',
  primaryColour: '#7367F0',
  refresh:       () => {},
})

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AdminBrandingProvider({ children }: { children: React.ReactNode }) {
  const [platformName,  setPlatformName]  = useState('TenantX')
  const [logoUrl,       setLogoUrl]       = useState('')
  const [primaryColour, setPrimaryColour] = useState('#7367F0')

  const fetchBranding = useCallback(async () => {
    try {
      const settings = await getPlatformSettings()
      const branding = settings['BRANDING'] ?? []
      const get = (key: string) => branding.find(s => s.settingKey === key)?.settingValue ?? ''

      const name   = get('branding.platform_name')
      const logo   = get('branding.logo_url')
      const colour = get('branding.primary_colour')

      if (name)   setPlatformName(name)
      setLogoUrl(logo)
      if (colour) setPrimaryColour(colour)
    } catch {
      // silently fall back to defaults on error
    }
  }, [])

  useEffect(() => { fetchBranding() }, [fetchBranding])

  return (
    <AdminBrandingContext.Provider value={{ platformName, logoUrl, primaryColour, refresh: fetchBranding }}>
      {children}
    </AdminBrandingContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAdminBranding() {
  return useContext(AdminBrandingContext)
}
