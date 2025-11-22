export type CustomerStats = {
  total: number
  male: number
  female: number
  active: number
  inactive: number
}

export type FinancialMetrics = {
  revenue?: number
  withdrawals?: number
  balance?: number
  transactions?: number
  deposits?: number
}

export type ContributorData = {
  name: string
  agent: string
  contribution: number
}

export type RevenueData = {
  status: string
  percentage: number
}

export type DailyAgentRevenue = {
  date: string
  amount: number
}

