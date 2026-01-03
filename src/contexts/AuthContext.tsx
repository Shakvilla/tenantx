'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

import { useRouter } from 'next/navigation'

// Types - preserved for your new backend
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

// Mock user for development - replace with your backend auth
const MOCK_USER: AuthUser = {
  id: 'dev-user-001',
  email: 'developer@tenantx.dev',
  name: 'Developer',
  role: 'admin',
}

const MOCK_TENANT: AuthTenant = {
  id: 'dev-tenant-001',
  name: 'Development Org',
}

/**
 * AuthProvider stub - replace with your new backend auth
 * 
 * TODO: Implement authentication with your new backend:
 * - Replace mock data with actual API calls
 * - Implement token storage/refresh
 * - Connect to your auth provider
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  // Development mode: auto-authenticated with mock user
  const [state, setState] = useState<AuthState>({
    user: MOCK_USER,
    tenant: MOCK_TENANT,
    isAuthenticated: true,
    isLoading: false,
  })

  // Refresh user - stub
  const refreshUser = useCallback(async () => {
    // TODO: Fetch current user from your backend
    setState({
      user: MOCK_USER,
      tenant: MOCK_TENANT,
      isAuthenticated: true,
      isLoading: false,
    })
  }, [])

  // Login - stub
  const login = useCallback(
    async (_email: string, _password: string) => {
      setState(prev => ({ ...prev, isLoading: true }))

      // TODO: Call your backend login API
      // Simulate success for development
      setState({
        user: MOCK_USER,
        tenant: MOCK_TENANT,
        isAuthenticated: true,
        isLoading: false,
      })

      return { success: true }
    },
    []
  )

  // Register - stub
  const register = useCallback(
    async (_data: {
      email: string
      password: string
      name: string
      phone?: string
      tenantName: string
    }) => {
      setState(prev => ({ ...prev, isLoading: true }))

      // TODO: Call your backend register API
      setState({
        user: MOCK_USER,
        tenant: MOCK_TENANT,
        isAuthenticated: true,
        isLoading: false,
      })

      return { success: true }
    },
    []
  )

  // Logout - stub
  const logout = useCallback(async () => {
    // TODO: Call your backend logout API
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

  // For development, always authenticated
  // TODO: Implement actual auth check
  return { isAuthenticated: true, isLoading: false }
}
