import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { openBlobDocument } from '@/utils/openBlobDocument'

/**
 * A landlord pressed "Receipt" and nothing happened — twice, on two different days. The server
 * was innocent: GET /payments/{id}/receipt returned 200 with a complete HTML document. The
 * window.open() call happened after an `await`, so the browser no longer counted it as a user
 * gesture and blocked it, returning null with no error and no console warning.
 *
 * A cash tenant will not leave the yard without a receipt, so this is the one document a
 * Ghanaian landlord cannot do without.
 */
describe('openBlobDocument', () => {
  const originalOpen = window.open
  let fakeWin: any

  beforeEach(() => {
    fakeWin = { document: { write: vi.fn() }, location: { href: '' }, close: vi.fn() }
    window.open = vi.fn(() => fakeWin) as any
    // happy-dom has no object-URL support
    ;(URL as any).createObjectURL = vi.fn(() => 'blob:fake')
    ;(URL as any).revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    window.open = originalOpen
  })

  it('opens the window BEFORE fetching, so the click still counts as a gesture', async () => {
    const order: string[] = []

    ;(window.open as any).mockImplementation(() => {
      order.push('open')

      return fakeWin
    })

    await openBlobDocument(async () => {
      order.push('fetch')

      return new Blob(['<html>receipt</html>'])
    })

    expect(order).toEqual(['open', 'fetch'])
    expect(fakeWin.location.href).toBe('blob:fake')
  })

  /*
   * Throwing "your browser blocked the window" was better than failing silently, but it still
   * sent the landlord away without the document. Three visits in a row he pressed "Receipt" and
   * got nothing usable, while the server was returning a perfectly good one — and his tenant
   * pays cash and is standing there waiting for paper. A pop-up setting is not a good enough
   * reason to refuse. Blocked now means: fetch it anyway and hand it over as a download.
   */
  it('hands the document over as a download when the browser blocks the window', async () => {
    ;(window.open as any).mockReturnValue(null)

    const click = vi.fn()
    const anchor = { href: '', download: '', click, remove: vi.fn() } as any
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(anchor)
    const append = vi.spyOn(document.body, 'appendChild').mockImplementation((n: any) => n)

    try {
      await expect(
        openBlobDocument(async () => new Blob(['x']), { downloadName: 'receipt-abc.html' })
      ).resolves.toBeUndefined()

      expect(click).toHaveBeenCalledTimes(1)
      expect(anchor.download).toBe('receipt-abc.html')
      expect(anchor.href).toContain('blob:')
    } finally {
      createElement.mockRestore()
      append.mockRestore()
    }
  })

  it('closes the placeholder tab when the document cannot be fetched', async () => {
    await expect(
      openBlobDocument(async () => {
        throw new Error('500 from server')
      })
    ).rejects.toThrow('500 from server')

    // Otherwise the landlord is left staring at a blank tab that says "Loading…" forever.
    expect(fakeWin.close).toHaveBeenCalled()
  })
})
