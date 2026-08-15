'use client'

import type { ReactNode } from 'react'

import { SubscriptionProvider } from '@/contexts/SubscriptionContext'

export function SubscriptionProviderWrapper({ children }: { children: ReactNode }) {
  return <SubscriptionProvider>{children}</SubscriptionProvider>
}
