import { apiGet } from './client'
import type { GraTaxSummary } from '@/types/gra'

const BASE = '/api/v1/gra'

/**
 * Fetch GRA income summary for a given year (and optionally quarter).
 *
 * @param year    e.g. 2024
 * @param quarter 1–4 for quarterly, undefined for full-year
 */
export function getGraIncomeSummary(year: number, quarter?: number): Promise<GraTaxSummary> {
  const params = new URLSearchParams({ year: String(year) })
  if (quarter != null) params.set('quarter', String(quarter))
  return apiGet<GraTaxSummary>(`${BASE}/income-summary?${params}`)
}
