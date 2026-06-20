import { apiClient, API_BASE } from './client'
import type {
  WalletResponse,
  LedgerPageResponse,
  WithdrawalRequest,
  WithdrawalResponse,
  UpdateLinkedMomoRequest,
} from '@/types/wallet'

const BASE = `${API_BASE}/wallet`

export const walletApi = {

  /** Get (or auto-create) the wallet for the current landlord */
  getWallet(): Promise<WalletResponse> {
    return apiClient.get<WalletResponse>(BASE).then(r => r.data)
  },

  /** Paginated ledger with optional filters */
  getLedger(params?: {
    from?: string        // YYYY-MM-DD
    to?: string          // YYYY-MM-DD
    propertyId?: string
    occupantId?: string
    page?: number
    size?: number
  }): Promise<LedgerPageResponse> {
    return apiClient
      .get<LedgerPageResponse>(`${BASE}/ledger`, { params })
      .then(r => r.data)
  },

  /** Initiate a MoMo withdrawal */
  requestWithdrawal(data: WithdrawalRequest): Promise<WithdrawalResponse> {
    return apiClient.post<WithdrawalResponse>(`${BASE}/withdraw`, data).then(r => r.data)
  },

  /** Paginated withdrawal history */
  getWithdrawals(page = 0, size = 20): Promise<{ content: WithdrawalResponse[]; totalElements: number }> {
    return apiClient
      .get(`${BASE}/withdrawals`, { params: { page, size } })
      .then(r => r.data)
  },

  /** Update the linked MoMo number */
  updateLinkedMomo(data: UpdateLinkedMomoRequest): Promise<WalletResponse> {
    return apiClient.put<WalletResponse>(`${BASE}/linked-momo`, data).then(r => r.data)
  },
}
