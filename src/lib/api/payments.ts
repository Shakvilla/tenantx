/**
 * Payments API client
 *
 * Endpoints:
 *   POST /api/v1/payments/initiate-momo          → initiate MoMo via Redde
 *   POST /api/v1/payments/record-manual          → record cash/cheque/bank
 *   GET  /api/v1/payments/{id}                   → get payment
 *   GET  /api/v1/payments/{id}/status            → poll gateway status
 *   GET  /api/v1/payments/invoice/{invoiceId}    → list payments for invoice
 *
 *   GET  /api/v1/payment-gateway/configs         → list gateway configs
 *   POST /api/v1/payment-gateway/configs         → save/update config
 *   DELETE /api/v1/payment-gateway/configs/{id}  → delete config
 */

import { apiClient, API_BASE } from './client'
import type {
  InitiateMoMoRequest,
  RecordManualRequest,
  PaymentResponse,
  GatewayConfigRequest,
  GatewayConfigResponse
} from '@/types/payment'

const PAYMENTS_BASE = `${API_BASE}/payments`
const GATEWAY_BASE  = `${API_BASE}/payment-gateway`

// ── Payment operations ────────────────────────────────────────────────────────

export const paymentsApi = {
  /** Initiate a Mobile Money payment via Redde (or configured default gateway) */
  initiateMoMo: async (req: InitiateMoMoRequest): Promise<PaymentResponse> => {
    const res = await apiClient.post<PaymentResponse>(`${PAYMENTS_BASE}/initiate-momo`, req)
    return res.data
  },

  /** Record a manual payment (Cash, Cheque, Bank Transfer) */
  recordManual: async (req: RecordManualRequest): Promise<PaymentResponse> => {
    const res = await apiClient.post<PaymentResponse>(`${PAYMENTS_BASE}/record-manual`, req)
    return res.data
  },

  /** Get a single payment by ID */
  getById: async (id: string): Promise<PaymentResponse> => {
    const res = await apiClient.get<PaymentResponse>(`${PAYMENTS_BASE}/${id}`)
    return res.data
  },

  /** Poll the gateway for the latest status of a pending MoMo payment */
  checkStatus: async (id: string): Promise<PaymentResponse> => {
    const res = await apiClient.get<PaymentResponse>(`${PAYMENTS_BASE}/${id}/status`)
    return res.data
  },

  /** List all payments recorded against an invoice */
  getByInvoice: async (invoiceId: string): Promise<PaymentResponse[]> => {
    const res = await apiClient.get<PaymentResponse[]>(`${PAYMENTS_BASE}/invoice/${invoiceId}`)
    return res.data
  },

  /** List all payments made by an occupant (across all their invoices) */
  getByOccupant: async (occupantId: string): Promise<PaymentResponse[]> => {
    const res = await apiClient.get<PaymentResponse[]>(`${PAYMENTS_BASE}/occupant/${occupantId}`)
    return res.data
  }
}

// ── Gateway config ────────────────────────────────────────────────────────────

export const gatewayConfigApi = {
  list: async (): Promise<GatewayConfigResponse[]> => {
    const res = await apiClient.get<GatewayConfigResponse[]>(`${GATEWAY_BASE}/configs`)
    return res.data
  },

  save: async (req: GatewayConfigRequest): Promise<GatewayConfigResponse> => {
    const res = await apiClient.post<GatewayConfigResponse>(`${GATEWAY_BASE}/configs`, req)
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${GATEWAY_BASE}/configs/${id}`)
  }
}
