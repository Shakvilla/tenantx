/* eslint-disable import/no-unresolved */
'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'

import { useRouter } from 'next/navigation'

import {
  globalLogin,
  selectTenant,
  registerUser,
  getCurrentUser,
  logoutUser,
  getStoredToken,
  getStoredTenantId,
  setStoredTenantId,
  clearStoredTokens,
  isOtpChallenge,
  verifySelectTenantOtp,
  type Workspace,
  type UserProfile,
  type OtpChallenge,
  type SelectTenantResponse
} from '@/lib/api/auth-client'
import {
  getStoredUserRole,
  setStoredUserRole,
  getStoredUserType,
  setStoredUserType
} from '@/lib/api/storage'
import { otpErrorMessage } from '@/lib/api/otp-errors'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  /** UserType from backend: LANDLORD | STAFF | MAINTAINER | OCCUPANT */
  userType: string
  avatarUrl?: string
  phone?: string
}

export interface AuthTenant {
  id: string
  name: string
  subdomain?: string
}

interface AuthState {
  user: AuthUser | null
  tenant: AuthTenant | null
  isAuthenticated: boolean
  isLoading: boolean
  isRefreshing: boolean
  pendingWorkspaces: Workspace[] | null
  needsWorkspaceSelection: boolean
  needsPasswordSetup: boolean
  needsOtp: boolean

  /** The live challenge plus the workspace it was raised for, so resend and verify can finish it. */
  otpChallenge: (OtpChallenge & { workspace: Workspace }) | null
}

interface AuthContextValue extends AuthState {
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; requiresWorkspaceSelection?: boolean; needsPasswordSetup?: boolean }>
  register: (data: {
    email: string
    password: string
    fullName: string
    companyName: string
  }) => Promise<{ success: boolean; error?: string }>
  selectWorkspace: (workspace: Workspace) => Promise<{ success: boolean; error?: string }>
  logout: (reason?: string) => Promise<void>
  refreshUser: () => Promise<void>
  verifyOtp: (otp: string, rememberDevice: boolean) => Promise<{ success: boolean; error?: string; startOver?: boolean }>
  resendOtp: () => Promise<void>
  cancelOtp: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Decodes the JWT payload (no signature verification — used for client-side scope checks only). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  const [state, setState] = useState<AuthState>({
    user: null,
    tenant: null,
    isAuthenticated: false,
    isLoading: true,
    isRefreshing: false,
    pendingWorkspaces: null,
    needsWorkspaceSelection: false,
    needsPasswordSetup: false,
    needsOtp: false,
    otpChallenge: null
  })

  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  // ---- Event Listeners for API Client ----
  useEffect(() => {
    const handleSessionExpired = (event: any) => {
      const message = event.detail?.message || 'Session expired. Please login again.'

      logout(message)
    }

    const handleRefreshing = (event: any) => {
      setState(prev => ({ ...prev, isRefreshing: !!event.detail?.isRefreshing }))
    }

    const handleForbidden = (event: any) => {
      const message: string = event.detail?.message ?? ''

      // Backend returns 403 with a specific message for token-type mismatches.
      // These are unrecoverable with the current session — clear tokens and force re-login.
      const isTokenError =
        message.toLowerCase().includes('global token') ||
        message.toLowerCase().includes('tenant mismatch') ||
        message.toLowerCase().includes('cannot be used for tenant')

      if (isTokenError) {
        // Clear the bad session and redirect to login so the user re-authenticates
        logout('Your session is invalid. Please log in again.')
        return
      }

      // During an impersonation session, certain endpoints legitimately return 403
      // (impersonation tokens have restricted scope). Don't eject the user — let the
      // individual page/component surface the error.
      const currentToken = getStoredToken()
      if (currentToken) {
        const payload = decodeJwtPayload(currentToken)
        if (payload?.scope === 'impersonation') return
      }

      // Genuine permission error — send to 403 page
      router.push('/403')
    }

    window.addEventListener('AUTH_SESSION_EXPIRED', handleSessionExpired)
    window.addEventListener('AUTH_REFRESHING', handleRefreshing)
    window.addEventListener('AUTH_FORBIDDEN', handleForbidden)

    return () => {
      window.removeEventListener('AUTH_SESSION_EXPIRED', handleSessionExpired)
      window.removeEventListener('AUTH_REFRESHING', handleRefreshing)
      window.removeEventListener('AUTH_FORBIDDEN', handleForbidden)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Bootstrap: check for existing session on mount ----
  useEffect(() => {
    const token = getStoredToken()
    const tenantId = getStoredTenantId()

    if (token && tenantId) {
      // Restore persisted role/userType so they survive page refresh
      const savedRole     = getStoredUserRole()
      const savedUserType = getStoredUserType()

      // Impersonation tokens carry scope=impersonation and the backend restricts
      // /users/me for this token type (returning 403). Skip the getCurrentUser call
      // entirely — ImpersonateHandoff already stored role/userType for us.
      const payload = decodeJwtPayload(token)
      if (payload?.scope === 'impersonation') {
        setState({
          user: { id: '', email: '', name: '', role: savedRole, userType: savedUserType },
          tenant: { id: tenantId, name: '' },
          isAuthenticated: true,
          isLoading: false,
          isRefreshing: false,
          pendingWorkspaces: null,
          needsWorkspaceSelection: false,
          needsPasswordSetup: false,
          needsOtp: false,
          otpChallenge: null
        })
        return
      }

      getCurrentUser(tenantId)
        .then(res => {
          if (res.success && res.data) {
            setState({
              user: mapProfileToUser(res.data, savedRole, savedUserType),
              tenant: { id: tenantId, name: res.data.companyName ?? '' },
              isAuthenticated: true,
              isLoading: false,
              isRefreshing: false,
              pendingWorkspaces: null,
              needsWorkspaceSelection: false,
              needsPasswordSetup: false,
              needsOtp: false,
              otpChallenge: null
            })
          } else {
            // Only clear tokens if explicitly UNAUTHORIZED (401)
            // If it's a 500 or network error, let the user stay "authenticated"
            // so they don't lose their session on transient backend issues.
            if (
              res.error?.code === 'UNAUTHORIZED' ||
              res.error?.message?.toLowerCase().includes('unauthorized') ||
              res.error?.message?.toLowerCase().includes('401') ||
              res.error?.code === 'FORBIDDEN' ||
              res.error?.message?.toLowerCase().includes('forbidden') ||
              res.error?.message?.toLowerCase().includes('403')
            ) {
              clearStoredTokens()
              setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false }))
            } else {
              // Transient error: stay authenticated but stop loading
              // We'll trust the token we have for now. Subsequent API calls will trigger refresh if needed.
              // console.error('Bootstrap user fetch failed with transient error:', JSON.stringify(res.error, null, 2))
              setState(prev => ({
                ...prev,
                isLoading: false,
                isAuthenticated: true, // We have a token/tenantId, so assume valid for now
                user: prev.user ?? { id: '', email: '', name: '', role: savedRole, userType: savedUserType },
                tenant: { id: tenantId, name: '' }
              }))
            }
          }
        })
        .catch(_error => {
          // console.error('Bootstrap user fetch crashed:', error instanceof Error ? error.message : error)

          // Don't wipe session on crash (network error etc), just stop loading
          setState(prev => ({
            ...prev,
            isLoading: false,
            isAuthenticated: !!token && !!tenantId
          }))
        })
    } else if (token) {
      // We have a global token but no tenant selected.
      // This happens if the user reloads during workspace selection.
      setState(prev => ({
        ...prev,
        isLoading: false,
        needsWorkspaceSelection: true
      }))
    } else {
      // No token at all
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  // ---- Login ----
  const login = useCallback(
    async (email: string, password: string) => {
      setState(prev => ({ ...prev, isLoading: true }))

      const result = await globalLogin({ email, password })

      if (!result.success || !result.data) {
        setState(prev => ({ ...prev, isLoading: false }))

        return { success: false, error: result.error?.message ?? 'Login failed' }
      }

      const loginData = result.data

      // Check for first-time login
      if (loginData.firstTimeLogin) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          needsPasswordSetup: true
        }))

        return { success: true, needsPasswordSetup: true }
      }

      const workspaces = loginData.workspaces ?? []

      if (workspaces.length === 0) {
        setState(prev => ({ ...prev, isLoading: false }))

        return { success: false, error: 'No workspaces available for this account.' }
      }

      if (workspaces.length === 1) {
        // Auto-select the only workspace
        return handleSelectWorkspace(workspaces[0])
      }

      // Multiple workspaces — show selection UI
      setState(prev => ({
        ...prev,
        isLoading: false,
        pendingWorkspaces: workspaces,
        needsWorkspaceSelection: true
      }))

      return { success: true, requiresWorkspaceSelection: true }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // ---- Select Workspace ----
  const handleSelectWorkspace = async (workspace: Workspace): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true }))

    const result = await selectTenant(workspace.tenantId)

    if (!result.success || !result.data) {
      setState(prev => ({ ...prev, isLoading: false }))

      return { success: false, error: result.error?.message ?? 'Failed to select workspace' }
    }

    // A challenge, not a session. Everything below this point assumes tokens exist.
    if (isOtpChallenge(result.data)) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        needsOtp: true,
        otpChallenge: { ...(result.data as OtpChallenge), workspace }
      }))

      return { success: true }
    }

    const tenantData = result.data as SelectTenantResponse

    establishTenantSession(tenantData, workspace)

    return { success: true }
  }

  /**
   * The one and only place a landlord session is established. Both the unchallenged
   * /select-tenant path and the post-OTP path call this, so the two cannot drift apart.
   */
  const establishTenantSession = (tenantData: SelectTenantResponse, workspace: Workspace) => {
    // setStoredTenantId is NOT redundant with selectTenant's own call. The OTP path never
    // reaches that call — selectTenant returned a challenge and bailed out before it — and
    // middleware treats a user as authenticated only when BOTH auth_token and tenant_id
    // cookies exist. Without this line a landlord completes the challenge and is bounced
    // straight back to /login. On the unchallenged path it simply sets the same value twice.
    setStoredTenantId(workspace.tenantId)
    setStoredUserRole(workspace.role)
    setStoredUserType(workspace.userType)

    setState({
      user: tenantData.user
        ? mapProfileToUser(tenantData.user, workspace.role, workspace.userType)
        : { id: '', email: '', name: '', role: workspace.role, userType: workspace.userType },
      tenant: { id: workspace.tenantId, name: workspace.tenantName },
      isAuthenticated: true,
      isLoading: false,
      isRefreshing: false,
      pendingWorkspaces: null,
      needsWorkspaceSelection: false,
      needsPasswordSetup: false,
      needsOtp: false,
      otpChallenge: null
    })
  }

  const selectWorkspaceMethod = useCallback(
    async (workspace: Workspace) => {
      return handleSelectWorkspace(workspace)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // ---- Verify login OTP ----
  const verifyOtp = useCallback(async (otp: string, rememberDevice: boolean) => {
    const challenge = stateRef.current.otpChallenge

    if (!challenge) return { success: false, error: 'No verification in progress.', startOver: true }

    setState(prev => ({ ...prev, isLoading: true }))

    const result = await verifySelectTenantOtp(challenge.pendingToken, otp, rememberDevice)

    if (!result.success || !result.data) {
      const display = otpErrorMessage(result.rawError)

      setState(prev => ({
        ...prev,
        isLoading: false,
        needsOtp: !display.startOver,
        otpChallenge: display.startOver ? null : prev.otpChallenge
      }))

      return { success: false, error: display.message, startOver: display.startOver }
    }

    establishTenantSession(result.data, challenge.workspace)

    return { success: true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Resend login OTP ----
  const resendOtp = useCallback(async () => {
    const challenge = stateRef.current.otpChallenge

    if (!challenge) return

    // A true resend: /select-tenant needs only the global token, which is still held. No
    // credentials are kept anywhere to make this possible.
    const result = await selectTenant(challenge.workspace.tenantId)

    if (result.success && isOtpChallenge(result.data)) {
      setState(prev => ({
        ...prev,
        otpChallenge: { ...(result.data as OtpChallenge), workspace: challenge.workspace }
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Cancel login OTP ----
  const cancelOtp = useCallback(() => {
    setState(prev => ({ ...prev, needsOtp: false, otpChallenge: null }))
  }, [])

  // ---- Register ----
  const register = useCallback(
    async (data: { email: string; password: string; fullName: string; companyName: string }) => {
      setState(prev => ({ ...prev, isLoading: true }))

      const result = await registerUser(data)

      if (!result.success || !result.data) {
        setState(prev => ({ ...prev, isLoading: false }))

        return { success: false, error: result.error?.message ?? 'Registration failed' }
      }

      const signup = result.data

      // The backend returns a tenant-scoped JWT immediately after signup.
      // Persist role + userType so the bootstrap useEffect can restore them on page refresh.
      setStoredUserRole('ADMIN')
      setStoredUserType('LANDLORD')

      setState({
        user: {
          id:       signup.userId,
          email:    signup.email,
          name:     data.fullName,
          role:     'ADMIN',
          userType: 'LANDLORD',
        },
        tenant: { id: signup.tenantId, name: signup.tenantName },
        isAuthenticated:       true,
        isLoading:             false,
        isRefreshing:          false,
        pendingWorkspaces:     null,
        needsWorkspaceSelection: false,
        needsPasswordSetup:    false,
        needsOtp:              false,
        otpChallenge:          null,
      })

      return { success: true }
    },
    []
  )

  // ---- Logout ----
  const logout = useCallback(
    async (reason?: string) => {
      await logoutUser()
      setState({
        user: null,
        tenant: null,
        isAuthenticated: false,
        isLoading: false,
        isRefreshing: false,
        pendingWorkspaces: null,
        needsWorkspaceSelection: false,
        needsPasswordSetup: false,
        needsOtp: false,
        otpChallenge: null
      })

      // A reason means this was an involuntary logout (session expired / invalid token) —
      // surface it on the login page and preserve where the user was headed, so a landlord
      // mid-form doesn't just silently vanish back to a blank login screen. A voluntary
      // logout (UserDropdown's "Log out") passes no reason and gets the plain redirect.
      if (reason && typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search
        const params = new URLSearchParams({ reason })

        if (currentPath && !currentPath.startsWith('/login')) {
          params.set('redirectTo', currentPath)
        }

        router.push(`/login?${params.toString()}`)
      } else {
        router.push('/login')
      }
    },
    [router]
  )

  // ---- Refresh ----
  const refreshUser = useCallback(async () => {
    const token = getStoredToken()
    const tenantId = getStoredTenantId()

    if (!token || !tenantId) return

    const res = await getCurrentUser(tenantId)

    if (res.success && res.data) {
      setState(prev => ({
        ...prev,
        user: mapProfileToUser(res.data!, getStoredUserRole(), getStoredUserType()),
        tenant: { id: tenantId, name: res.data!.companyName ?? '' },
        isAuthenticated: true
      }))
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        selectWorkspace: selectWorkspaceMethod,
        logout,
        refreshUser,
        verifyOtp,
        resendOtp,
        cancelOtp
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  return { isAuthenticated, isLoading }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mapProfileToUser(profile: UserProfile, role = '', userType = ''): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.fullName,
    role,
    userType
  }
}
