// Dashboard summary aggregate (2026-08-20 dashboard performance audit, handoff #2).
// One request replaces the tile components' 7–8 independent fetches — including the two
// full-history /invoices downloads that were aggregated in the browser to draw a sparkline.
// Cached server-side for 60s per tenant.
import { apiGet } from '@/lib/api/client'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'

export interface InvoiceStatsSummary {
  total: number
  draft: number
  pending: number
  partial: number
  paid: number
  overdue: number
  cancelled: number
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
}

export interface MonthlyTrendPoint {
  month: string // "2026-08"
  paidAmount: number
  outstandingAmount: number
}

export interface ExpenseSummary {
  totalAmount: number
  total: number
  byItem: { item: string; amount: number }[]
}

export interface PropertyStatsSummary {
  totalProperties: number
  activeProperties: number
  inactiveProperties: number
  occupiedUnits: number
  vacantUnits: number
  damagedUnits: number
  reservedUnits: number
}

export interface OccupantStatsSummary {
  total: number
  active: number
  inactive: number
  pending: number
}

export interface DashboardSummary {
  invoices: InvoiceStatsSummary
  paidThisMonth: number
  monthlyTrend: MonthlyTrendPoint[]
  expenses: ExpenseSummary
  properties: PropertyStatsSummary
  occupants: OccupantStatsSummary
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiGet<DashboardSummary>(`${API_BASE}/dashboard/summary`)
}
