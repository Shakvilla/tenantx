'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import {
  adminLogin as apiAdminLogin,
  getAdminMe,
  adminLogout as apiAdminLogout,
  verifyAdminLoginOtp,
  type AdminProfile
} from '@/lib/api/admin-auth-client'
import { isOtpChallenge, type OtpChallenge } from '@/lib/api/auth-client'
import { getStoredAdminToken, clearStoredAdminToken } from '@/lib/api/admin-storage'
import { otpErrorMessage } from '@/lib/api/otp-errors'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminUser extends AdminProfile {}

interface AdminAuthState {
  adminUser: AdminUser | null
  isAdminAuthenticated: boolean
  isAdminLoading: boolean
  needsOtp: boolean
  otpChallenge: OtpChallenge | null
}

interface AdminAuthContextValue extends AdminAuthState {
  adminLogin:  (email: string, password: string) => Promise<{ success: boolean; error?: string; otpRequired?: boolean }>
  adminLogout: () => void
  hasPermission: (permission: string) => boolean
  hasRole:       (role: string) => boolean
  setAdminUser:  (profile: AdminUser) => void
  verifyOtp: (otp: string, rememberDevice: boolean) => Promise<{ success: boolean; error?: string; startOver?: boolean }>
  cancelOtp: () => void
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
    isAdminLoading: true,
    needsOtp: false,
    otpChallenge: null
  })

  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  // ---- Listen for session expiry dispatched by the admin API interceptor ----
  useEffect(() => {
    const handleExpired = () => {
      setState({
        adminUser: null,
        isAdminAuthenticated: false,
        isAdminLoading: false,
        needsOtp: false,
        otpChallenge: null
      })
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
        setState({
          adminUser: profile,
          isAdminAuthenticated: true,
          isAdminLoading: false,
          needsOtp: false,
          otpChallenge: null
        })
      })
      .catch(() => {
        clearStoredAdminToken()
        setState({
          adminUser: null,
          isAdminAuthenticated: false,
          isAdminLoading: false,
          needsOtp: false,
          otpChallenge: null
        })
      })
  }, [])

  // ---- Login ----
  const adminLogin = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isAdminLoading: true }))
    try {
      const result = await apiAdminLogin(email, password) // stores admin_token in cookie + localStorage

      // A challenge mints no token, so there is no profile to fetch yet and nothing to store.
      if (isOtpChallenge(result)) {
        setState(prev => ({ ...prev, isAdminLoading: false, needsOtp: true, otpChallenge: result }))

        return { success: true, otpRequired: true }
      }

      const profile = await getAdminMe()
      setState({
        adminUser: profile,
        isAdminAuthenticated: true,
        isAdminLoading: false,
        needsOtp: false,
        otpChallenge: null
      })
      return { success: true }
    } catch (err: any) {
      setState(prev => ({ ...prev, isAdminLoading: false }))
      const msg = err?.response?.data?.message ?? err?.message ?? 'Admin login failed'
      return { success: false, error: msg }
    }
  }, [])

  // ---- Verify login OTP ----
  const verifyOtp = useCallback(async (otp: string, rememberDevice: boolean) => {
    const challenge = stateRef.current.otpChallenge

    if (!challenge) return { success: false, error: 'No verification in progress.', startOver: true }

    setState(prev => ({ ...prev, isAdminLoading: true }))

    try {
      await verifyAdminLoginOtp(challenge.pendingToken, otp, rememberDevice)

      const profile = await getAdminMe()

      setState({
        adminUser: profile,
        isAdminAuthenticated: true,
        isAdminLoading: false,
        needsOtp: false,
        otpChallenge: null
      })

      return { success: true }
    } catch (err) {
      const display = otpErrorMessage(err)

      setState(prev => ({
        ...prev,
        isAdminLoading: false,
        needsOtp: !display.startOver,
        otpChallenge: display.startOver ? null : prev.otpChallenge
      }))

      return { success: false, error: display.message, startOver: display.startOver }
    }
  }, [])

  // ---- Cancel login OTP ----
  const cancelOtp = useCallback(() => {
    setState(prev => ({ ...prev, needsOtp: false, otpChallenge: null }))
  }, [])

  // ---- Logout ----
  const adminLogout = useCallback(() => {
    apiAdminLogout()
    setState({
      adminUser: null,
      isAdminAuthenticated: false,
      isAdminLoading: false,
      needsOtp: false,
      otpChallenge: null
    })
    router.push('/admin/login')
  }, [router])

  // ---- Permission / role helpers ----
  const hasPermission = useCallback((permission: string) => {
    return state.adminUser?.permissions.includes(permission) ?? false
  }, [state.adminUser])

  const hasRole = useCallback((role: string) => {
    return state.adminUser?.roles.includes(role) ?? false
  }, [state.adminUser])

  // ---- Update the cached profile in-place (e.g. after a self-service profile edit) ----
  const setAdminUser = useCallback((profile: AdminUser) => {
    setState(prev => ({ ...prev, adminUser: profile }))
  }, [])

  return (
    <AdminAuthContext.Provider
      value={{ ...state, adminLogin, adminLogout, hasPermission, hasRole, setAdminUser, verifyOtp, cancelOtp }}
    >
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
