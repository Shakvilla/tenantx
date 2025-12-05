// Documentation: /docs/reports/reports-flow.md

export type DateRangePreset = 'last7days' | 'last30days' | 'last3months' | 'last6months' | 'lastyear' | 'alltime' | 'custom'

export type DateRange = {
  startDate: Date | null
  endDate: Date | null
  preset?: DateRangePreset
}

export type ReportType = 'tenants' | 'expenses' | 'earnings' | 'maintenance'

export type ReportSummary = {
  label: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon?: string
  color?: 'success' | 'error' | 'warning' | 'info'
}

export type TenantsReportData = {
  totalTenants: number
  activeTenants: number
  inactiveTenants: number
  occupancyRate: number
  newTenants: number
  trends: {
    date: string
    active: number
    inactive: number
  }[]
  distribution: {
    label: string
    value: number
  }[]
  leaseStatus: {
    label: string
    value: number
  }[]
}

export type ExpensesReportData = {
  totalExpenses: number
  paidExpenses: number
  unpaidExpenses: number
  averageExpense: number
  trends: {
    date: string
    amount: number
  }[]
  byCategory: {
    label: string
    value: number
  }[]
  monthlyComparison: {
    month: string
    amount: number
  }[]
}

export type EarningsReportData = {
  totalRevenue: number
  paidRevenue: number
  pendingRevenue: number
  averageRevenue: number
  trends: {
    date: string
    amount: number
  }[]
  byProperty: {
    label: string
    value: number
  }[]
  paymentStatus: {
    label: string
    value: number
  }[]
}

export type MaintenanceReportData = {
  totalRequests: number
  completedRequests: number
  pendingRequests: number
  inProgressRequests: number
  trends: {
    date: string
    count: number
  }[]
  statusDistribution: {
    label: string
    value: number
  }[]
  byProperty: {
    label: string
    value: number
  }[]
}

