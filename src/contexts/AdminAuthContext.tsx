'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import {
  adminLogin as apiAdminLogin,
  getAdminMe,
  adminLogout as apiAdminLogout,
  type AdminProfile
} from '@/lib/api/admin-auth-client'
import { getStoredAdminToken, clearStoredAdminToken } from '@/lib/api/admin-storage'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminUser extends AdminProfile {}

interface AdminAuthState {
  adminUser: AdminUser | null
  isAdminAuthenticated: boolean
  isAdminLoading: boolean
}

interface AdminAuthContextValue extends AdminAuthState {
  adminLogin:  (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  adminLogout: () => void
  hasPermission: (permission: string) => boolean
  hasRole:       (role: string) => boolean
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  const [state, setState] = useState<AdminAuthState>({
    adminUser: null,
    isAdminAuthenticated: false,
    isAdminLoading: true
  })

  // ---- Listen for session expiry dispatched by the admin API interceptor ----
  useEffect(() => {
    const handleExpired = () => {
      setState({ adminUser: null, isAdminAuthenticated: false, isAdminLoading: false })
      router.push('/admin/login')
    }
    window.addEventListener('ADMIN_SESSION_EXPIRED', handleExpired)
    return () => window.removeEventListener('ADMIN_SESSION_EXPIRED', handleExpired)
  }, [router])

  // ---- Bootstrap: restore session from stored admin_token ----
  useEffect(() => {
    const token = getStoredAdminToken()
    if (!token) {
      setState(prev => ({ ...prev, isAdminLoading: false }))
      return
    }
    getAdminMe()
      .then(profile => {
        setState({ adminUser: profile, isAdminAuthenticated: true, isAdminLoading: false })
      })
      .catch(() => {
        clearStoredAdminToken()
        setState({ adminUser: null, isAdminAuthenticated: false, isAdminLoading: false })
      })
  }, [])

  // ---- Login ----
  const adminLogin = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isAdminLoading: true }))
    try {
      await apiAdminLogin(email, password) // stores admin_token in cookie + localStorage
      const profile = await getAdminMe()
      setState({ adminUser: profile, isAdminAuthenticated: true, isAdminLoading: false })
      return { success: true }
    } catch (err: any) {
      setState(prev => ({ ...prev, isAdminLoading: false }))
      const msg = err?.response?.data?.message ?? err?.message ?? 'Admin login failed'
      return { success: false, error: msg }
    }
  }, [])

  // ---- Logout ----
  const adminLogout = useCallback(() => {
    apiAdminLogout()
    setState({ adminUser: null, isAdminAuthenticated: false, isAdminLoading: false })
    router.push('/admin/login')
  }, [router])

  // ---- Permission / role helpers ----
  const hasPermission = useCallback((permission: string) => {
    return state.adminUser?.permissions.includes(permission) ?? false
  }, [state.adminUser])

  const hasRole = useCallback((role: string) => {
    return state.adminUser?.roles.includes(role) ?? false
  }, [state.adminUser])

  return (
    <AdminAuthContext.Provider value={{ ...state, adminLogin, adminLogout, hasPermission, hasRole }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
