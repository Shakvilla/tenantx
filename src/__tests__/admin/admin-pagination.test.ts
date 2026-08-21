import { describe, it, expect, vi, beforeEach } from 'vitest'

// The bug this file pins: PaginatedResponse describes a flat {data, cursor, hasMore, total},
// but every paginated admin endpoint returns {data, meta:{pagination:{…}}}. The old code
// asserted the raw response WAS the flat shape, so `total` and `cursor` were always undefined —
// invisible to TypeScript, visible to an operator as "0–0 of 0" beneath five rows, and as a
// "next page" button that re-requested page 0 forever.
const get = vi.fn()

vi.mock('axios', () => {
  const client = {
    get: (...args: unknown[]) => get(...args),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
  }

  return { default: { create: () => client, isAxiosError: () => false } }
})

import { getAdminTenants, getSystemAdmins } from '@/lib/api/admin-auth-client'

function envelope(rows: unknown[], pagination: Record<string, unknown>) {
  return { data: { success: true, data: rows, meta: { pagination } } }
}

describe('admin list pagination', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('reads the row count from meta.pagination rather than reporting zero', async () => {
    get.mockResolvedValue(
      envelope([{ id: '1' }, { id: '2' }], { total: 5, hasNext: true, cursor: 'CURSOR_PAGE_2' })
    )

    const res = await getAdminTenants(undefined, 2)

    expect(res.total).toBe(5)
    expect(res.data).toHaveLength(2)
  })

  // Without this the list can never advance: AdminTenantsView stores res.cursor as the key for
  // the next page, and an undefined key means page 1 re-requests page 0.
  it('surfaces the next-page cursor and hasMore', async () => {
    get.mockResolvedValue(envelope([{ id: '1' }], { total: 5, hasNext: true, cursor: 'CURSOR_PAGE_2' }))

    const res = await getAdminTenants(undefined, 1)

    expect(res.cursor).toBe('CURSOR_PAGE_2')
    expect(res.hasMore).toBe(true)
  })

  it('reports no further pages on the last page', async () => {
    get.mockResolvedValue(envelope([{ id: '5' }], { total: 5, hasNext: false, cursor: null }))

    const res = await getAdminTenants('CURSOR_PAGE_5', 1)

    expect(res.hasMore).toBe(false)
    expect(res.cursor).toBeNull()
  })

  // The System Admins list is served by the same envelope and had the same defect.
  it('applies the same mapping to the system admins list', async () => {
    get.mockResolvedValue(envelope([{ id: 'a' }], { total: 3, hasNext: false, cursor: null }))

    const res = await getSystemAdmins()

    expect(res.total).toBe(3)
    expect(res.hasMore).toBe(false)
  })

  // A response without the meta block must degrade, not throw — an endpoint that stops sending
  // pagination should show an empty count, not break the page.
  it('degrades to no count when the envelope carries no pagination block', async () => {
    get.mockResolvedValue({ data: { success: true, data: [{ id: '1' }] } })

    const res = await getAdminTenants()

    expect(res.total).toBeUndefined()
    expect(res.cursor).toBeNull()
    expect(res.hasMore).toBe(false)
  })
})
