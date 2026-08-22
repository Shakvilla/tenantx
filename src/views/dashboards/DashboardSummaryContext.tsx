'use client'

// One fetch for every dashboard summary tile (2026-08-20 dashboard performance audit,
// handoff #2). The four tile components used to fire 7–8 independent requests — two of them
// downloading the tenant's whole invoice history to compute a 12-month sparkline client-side.
// They now consume this provider, which issues exactly one request to /dashboard/summary.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { getDashboardSummary, type DashboardSummary } from '@/lib/api/dashboard'

interface DashboardSummaryState {
  summary: DashboardSummary | null
  loading: boolean
}

const DashboardSummaryContext = createContext<DashboardSummaryState>({ summary: null, loading: true })

export const useDashboardSummary = () => useContext(DashboardSummaryContext)

export const DashboardSummaryProvider = ({ children }: { children: ReactNode }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getDashboardSummary()
      .then(s => {
        if (!cancelled) setSummary(s)
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Memoized so the provider's value doesn't get a new identity on unrelated re-renders
  // (DASHBOARD-P5-02's unstable-context-value trap).
  const value = useMemo(() => ({ summary, loading }), [summary, loading])

  return <DashboardSummaryContext.Provider value={value}>{children}</DashboardSummaryContext.Provider>
}
