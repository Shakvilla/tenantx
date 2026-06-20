import { apiClient, API_BASE } from './client'
import type { ArrearsReport } from '@/types/arrears'

const BASE = `${API_BASE}/reports/arrears`

export const arrearsApi = {
  /** GET /api/v1/reports/arrears */
  getReport(): Promise<ArrearsReport> {
    return apiClient.get<ArrearsReport>(BASE).then(r => r.data)
  },
}
