'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

import { useRouter } from 'next/navigation'

import {
  loginUser as apiLogin,
  registerUser as apiRegister,
  logoutUser as apiLogout,
  getCurrentUser,
  getStoredToken,
  setStoredTokens,
  clearStoredTokens,
  type AuthUser,
  type AuthTenant,
} from '@/lib/api/auth-client'

// Types
interface AuthState {
  user: AuthUser | null
  tenant: AuthTenant | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: {
    email: string
    password: string
    name: string
    phone?: string
    tenantName: string
  }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  const [state, setState] = useState<AuthState>({
    user: null,
    tenant: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Check auth on mount
  const refreshUser = useCallback(async () => {
    const token = getStoredToken()

    if (!token) {
      setState({
        user: null,
        tenant: null,
        isAuthenticated: false,
        isLoading: false,
      })
      
      return
    }

    try {
      const response = await getCurrentUser()

      if (response.success && response.data) {
        setState({
          user: response.data.user,
          tenant: response.data.tenant,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        // Token may be stale - try to refresh the session
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        
        if (!refreshError && refreshData.session) {
          // Session refreshed - update tokens and retry
          setStoredTokens(refreshData.session.access_token, refreshData.session.refresh_token)
          const retryResponse = await getCurrentUser()
          
          if (retryResponse.success && retryResponse.data) {
            setState({
              user: retryResponse.data.user,
              tenant: retryResponse.data.tenant,
              isAuthenticated: true,
              isLoading: false,
            })
            return
          }
        }
        
        // Refresh failed - clear everything and redirect to login
        clearStoredTokens()
        await supabase.auth.signOut()
        setState({
          user: null,
          tenant: null,
          isAuthenticated: false,
          isLoading: false,
        })
        router.push('/login')
      }
    } catch {
      clearStoredTokens()
      setState({
        user: null,
        tenant: null,
        isAuthenticated: false,
        isLoading: false,
      })
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  // Login
  const login = useCallback(
    async (email: string, password: string) => {
      setState(prev => ({ ...prev, isLoading: true }))

      const response = await apiLogin(email, password)

      if (response.success && response.data) {
        setState({
          user: response.data.user,
          tenant: response.data.tenant,
          isAuthenticated: true,
          isLoading: false,
        })
        
return { success: true }
      }

      setState(prev => ({ ...prev, isLoading: false }))
      
return {
        success: false,
        error: response.error?.message || 'Login failed',
      }
    },
    []
  )

  // Register
  const register = useCallback(
    async (data: {
      email: string
      password: string
      name: string
      phone?: string
      tenantName: string
    }) => {
      setState(prev => ({ ...prev, isLoading: true }))

      const response = await apiRegister(data)

      if (response.success && response.data) {
        setState({
          user: response.data.user,
          tenant: response.data.tenant,
          isAuthenticated: true,
          isLoading: false,
        })
        
return { success: true }
      }

      setState(prev => ({ ...prev, isLoading: false }))
      
return {
        success: false,
        error: response.error?.message || 'Registration failed',
      }
    },
    []
  )

  // Logout
  const logout = useCallback(async () => {
    // Ensure Supabase session is cleared even if API fails
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // Continue even if signOut fails
    }
    
    await apiLogout()
    setState({
      user: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: false,
    })
    router.push('/login')
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  
return context
}

// Optional: Hook for requiring authentication
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
