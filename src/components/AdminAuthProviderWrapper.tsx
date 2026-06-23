'use client'

import type { ReactNode } from 'react'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'

export function AdminAuthProviderWrapper({ children }: { children: ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>
}
