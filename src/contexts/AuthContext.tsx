/* eslint-disable import/no-unresolved */
'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

import { useRouter } from 'next/navigation'

import {
  globalLogin,
  selectTenant,
  registerUser,
  getCurrentUser,
  logoutUser,
  getStoredToken,
  getStoredTenantId,
  clearStoredTokens,
  type Workspace,
  type UserProfile
} from '@/lib/api/auth-client'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

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
    needsPasswordSetup: false
  })

  // ---- Event Listeners for API Client ----
  useEffect(() => {
    const handleSessionExpired = (event: any) => {
      const message = event.detail?.message || 'Session expired. Please login again.'

      logout(message)
    }

    const handleRefreshing = (event: any) => {
      setState(prev => ({ ...prev, isRefreshing: !!event.detail?.isRefreshing }))
    }

    // const handleForbidden = () => {
    //   router.push('/403')
    // }

    window.addEventListener('AUTH_SESSION_EXPIRED', handleSessionExpired)
    window.addEventListener('AUTH_REFRESHING', handleRefreshing)

    // window.addEventListener('AUTH_FORBIDDEN', handleForbidden)

    return () => {
      window.removeEventListener('AUTH_SESSION_EXPIRED', handleSessionExpired)
      window.removeEventListener('AUTH_REFRESHING', handleRefreshing)

      // window.removeEventListener('AUTH_FORBIDDEN', handleForbidden)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Bootstrap: check for existing session on mount ----
  useEffect(() => {
    const token = getStoredToken()
    const tenantId = getStoredTenantId()

    if (token && tenantId) {
      getCurrentUser(tenantId)
        .then(res => {
          if (res.success && res.data) {
            setState({
              user: mapProfileToUser(res.data),
              tenant: { id: tenantId, name: res.data.companyName ?? '' },
              isAuthenticated: true,
              isLoading: false,
              isRefreshing: false,
              pendingWorkspaces: null,
              needsWorkspaceSelection: false,
              needsPasswordSetup: false
            })
          } else {
            // Only clear tokens if explicitly UNAUTHORIZED (401)
            // If it's a 500 or network error, let the user stay "authenticated"
            // so they don't lose their session on transient backend issues.
            if (
              res.error?.code === 'UNAUTHORIZED' ||
              res.error?.message?.toLowerCase().includes('unauthorized') ||
              res.error?.message?.toLowerCase().includes('401')
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

    // The select-tenant response includes the user profile inline (AuthResponseDto.user).
    // No need for a separate getCurrentUser() call — eliminates the API waterfall.
    const tenantData = result.data

    setState({
      user: tenantData.user
        ? mapProfileToUser(tenantData.user, workspace.role)
        : { id: '', email: '', name: '', role: workspace.role },
      tenant: {
        id: workspace.tenantId,
        name: workspace.tenantName
      },
      isAuthenticated: true,
      isLoading: false,
      isRefreshing: false,
      pendingWorkspaces: null,
      needsWorkspaceSelection: false,
      needsPasswordSetup: false
    })

    return { success: true }
  }

  const selectWorkspaceMethod = useCallback(
    async (workspace: Workspace) => {
      return handleSelectWorkspace(workspace)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // ---- Register ----
  const register = useCallback(
    async (data: { email: string; password: string; fullName: string; companyName: string }) => {
      setState(prev => ({ ...prev, isLoading: true }))

      const result = await registerUser(data)

      if (!result.success || !result.data) {
        setState(prev => ({ ...prev, isLoading: false }))

        return { success: false, error: result.error?.message ?? 'Registration failed' }
      }

      setState(prev => ({ ...prev, isLoading: false }))

      return { success: true }
    },
    []
  )

  // ---- Logout ----
  const logout = useCallback(
    async (_reason?: string) => {
      await logoutUser()
      setState({
        user: null,
        tenant: null,
        isAuthenticated: false,
        isLoading: false,
        isRefreshing: false,
        pendingWorkspaces: null,
        needsWorkspaceSelection: false,
        needsPasswordSetup: false
      })

      router.push('/login')
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
        user: mapProfileToUser(res.data!),
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
        refreshUser
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
function mapProfileToUser(profile: UserProfile, role = ''): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.fullName,
    role
  }
}
