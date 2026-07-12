import { describe, it, expect, beforeEach, vi } from 'vitest'

import type * as ApiClient from '@/lib/api/client'

vi.mock('@/lib/api/client', async importOriginal => {
  const actual = await importOriginal<typeof ApiClient>()
  return { ...actual, apiClient: { get: vi.fn() } }
})

import { apiClient } from '@/lib/api/client'
import { openPaymentReceipt } from '@/lib/api/payments'

describe('openPaymentReceipt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // happy-dom lacks these; stub them
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock')
    globalThis.URL.revokeObjectURL = vi.fn()
    window.open = vi.fn()
  })

  it('fetches the receipt as a blob and opens it in a new tab', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: new Blob(['<html/>']) } as never)

    await openPaymentReceipt('pay-123')

    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/payments/pay-123/receipt'),
      expect.objectContaining({ responseType: 'blob' })
    )
    expect(window.open).toHaveBeenCalledWith('blob:mock', '_blank', 'noopener,noreferrer')
  })
})
