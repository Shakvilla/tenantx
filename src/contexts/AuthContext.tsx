'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

import { useRouter } from 'next/navigation'

import {
  loginUser as apiLogin,
  registerUser as apiRegister,
  logoutUser as apiLogout,
  getCurrentUser,
  getStoredToken,
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
        // Token is invalid, clear it
        clearStoredTokens()
        setState({
          user: null,
          tenant: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    } catch {
      clearStoredTokens()
      setState({
        user: null,
        tenant: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }, [])

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
