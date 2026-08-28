'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import {
  adminLogin as apiAdminLogin,
  getAdminMe,
  adminLogout as apiAdminLogout,
  verifyAdminLoginOtp,
  resendAdminOtp,
  type AdminProfile
} from '@/lib/api/admin-auth-client'
import { isOtpChallenge, type OtpChallenge } from '@/lib/api/auth-client'
import { getStoredAdminToken, clearStoredAdminToken } from '@/lib/api/admin-storage'
import { otpErrorMessage } from '@/lib/api/otp-errors'
import { adminLoginErrorMessage } from '@/lib/api/admin-login-errors'

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
  resendOtp: (channel?: 'EMAIL' | 'SMS') => Promise<{ success: boolean; error?: string }>
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

      // This provider is mounted GLOBALLY (Providers.tsx), and the bootstrap effect below
      // validates any stored admin token on EVERY page. A stale token therefore fires this
      // handler on /register or /login too — and unconditionally pushing /admin/login from
      // there locked users with a dead admin cookie out of the entire tenant auth surface.
      // Only hijack navigation when the user is actually in the admin area; elsewhere the
      // silent state reset above is the whole job.
      if (window.location.pathname.startsWith('/admin')) {
        router.push('/admin/login')
      }
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

      // The RAW error is mapped, not err.response.data.message: the backend's own message for a
      // 401 is "Invalid password"/"Invalid email", which names which half was wrong and is exactly
      // the oracle the login form must not expose. adminLoginErrorMessage decides what is safe to
      // say per status/code — see its module comment.
      return { success: false, error: adminLoginErrorMessage(err).message }
    }
  }, [])

  // ---- Verify login OTP ----
  const verifyOtp = useCallback(async (otp: string, rememberDevice: boolean) => {
    const challenge = stateRef.current.otpChallenge

    if (!challenge) return { success: false, error: 'No verification in progress.', startOver: true }

    setState(prev => ({ ...prev, isAdminLoading: true }))

    // verifyAdminLoginOtp and getAdminMe are deliberately NOT in the same try block. A failure
    // in verifyAdminLoginOtp is a genuine OTP failure — wrong/expired code, exhausted attempts,
    // dead pending token — and otpErrorMessage's discrimination applies. A failure in getAdminMe
    // happens AFTER the code was accepted and admin_token already stored (verifyAdminLoginOtp
    // stores it before returning); reporting that through otpErrorMessage told a CORRECTLY
    // verified admin "that code isn't valid", or on a 403 cleared the challenge and left a valid
    // token sitting in storage with no session ever established from it.
    try {
      await verifyAdminLoginOtp(challenge.pendingToken, otp, rememberDevice)
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

    try {
      const profile = await getAdminMe()

      setState({
        adminUser: profile,
        isAdminAuthenticated: true,
        isAdminLoading: false,
        needsOtp: false,
        otpChallenge: null
      })

      return { success: true }
    } catch {
      // The code was valid and a token is stored, but there is no profile to show for it — don't
      // leave a half-authenticated token behind for a session that never actually got
      // established client-side.
      clearStoredAdminToken()

      setState({
        adminUser: null,
        isAdminAuthenticated: false,
        isAdminLoading: false,
        needsOtp: false,
        otpChallenge: null
      })

      return {
        success: false,
        error: 'Signed in, but we could not load your profile. Please sign in again.',
        startOver: true
      }
    }
  }, [])

  // ---- Resend login OTP ----
  const resendOtp = useCallback(async (channel?: 'EMAIL' | 'SMS') => {
    const challenge = stateRef.current.otpChallenge

    if (!challenge) return { success: false, error: 'No verification in progress.' }

    try {
      const result = await resendAdminOtp(challenge.pendingToken, channel)

      setState(prev => ({ ...prev, otpChallenge: result }))

      return { success: true }
    } catch (err) {
      return { success: false, error: otpErrorMessage(err).message }
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
      value={{ ...state, adminLogin, adminLogout, hasPermission, hasRole, setAdminUser, verifyOtp, resendOtp, cancelOtp }}
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
