import { describe, it, expect, beforeEach, vi } from 'vitest'

import type * as ApiClient from '@/lib/api/client'

vi.mock('@/lib/api/client', async importOriginal => {
  const actual = await importOriginal<typeof ApiClient>()
  return { ...actual, apiClient: { get: vi.fn() } }
})

import { apiClient } from '@/lib/api/client'
import { openPaymentReceipt } from '@/lib/api/payments'

describe('openPaymentReceipt', () => {
  let fakeWin: any

  beforeEach(() => {
    vi.clearAllMocks()
    // happy-dom lacks these; stub them
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock')
    globalThis.URL.revokeObjectURL = vi.fn()

    fakeWin = { document: { write: vi.fn() }, location: { href: '' }, close: vi.fn() }
    window.open = vi.fn(() => fakeWin) as any
  })

  /**
   * The assertion changed with the fix, deliberately. It used to require
   * window.open(blobUrl) — that is, open the tab AFTER the fetch, which is exactly the ordering
   * that made the receipt never appear: once an await separates window.open from the click, the
   * browser stops treating it as a user gesture and blocks it silently.
   *
   * The tab is now opened empty while the gesture is still live and pointed at the blob when it
   * arrives, so the expectation is a blank open followed by a location assignment.
   */
  it('opens the tab before fetching, then points it at the receipt', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: new Blob(['<html/>']) } as never)

    await openPaymentReceipt('pay-123')

    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/payments/pay-123/receipt'),
      expect.objectContaining({ responseType: 'blob' })
    )
    expect(window.open).toHaveBeenCalledWith('', '_blank', 'noopener,noreferrer')
    expect(fakeWin.location.href).toBe('blob:mock')
  })

  it('reports a blocked pop-up rather than doing nothing', async () => {
    window.open = vi.fn(() => null) as any

    await expect(openPaymentReceipt('pay-123')).rejects.toThrow(/blocked/i)
  })
})
