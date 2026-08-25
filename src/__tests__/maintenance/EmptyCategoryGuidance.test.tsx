import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

/**
 * An empty required-looking dropdown with no explanation is a dead end.
 *
 * On a new account the Category list arrives empty and nothing said where it
 * comes from, so the form read as broken rather than unconfigured. The list is
 * built on a page the landlord has never seen and had no reason to look for.
 */

vi.mock('@/lib/api/storage', () => ({ getStoredTenantId: () => 'tenant-1' }))

vi.mock('@/lib/api/maintenance', () => ({
  createMaintenanceRequest: vi.fn(),
  updateMaintenanceRequest: vi.fn(),
  getMaintenanceCategories: vi.fn(),
  getMaintainers: vi.fn(async () => [])
}))

vi.mock('@/lib/api/properties', () => ({ getProperties: vi.fn(async () => ({ success: true, data: [] })) }))
vi.mock('@/lib/api/units', () => ({ getUnitsByProperty: vi.fn(async () => ({ success: true, data: [] })) }))
vi.mock('@/lib/api/occupants', () => ({ getOccupants: vi.fn(async () => ({ success: true, data: [] })) }))

import AddMaintenanceRequestDialog from '@/views/maintenance/requests/AddMaintenanceRequestDialog'
import { getMaintenanceCategories } from '@/lib/api/maintenance'

describe('AddMaintenanceRequestDialog — empty category list', () => {
  beforeEach(() => {
    vi.mocked(getMaintenanceCategories).mockResolvedValue([] as any)
  })

  it('says where the list is built, and that the request can be logged without one', async () => {
    render(<AddMaintenanceRequestDialog open handleClose={vi.fn()} onSaved={vi.fn()} />)

    await waitFor(() => expect(screen.getByText(/no categories yet/i)).toBeTruthy())

    const link = screen.getByRole('link', { name: /maintenance categories/i })

    expect(link.getAttribute('href')).toBe('/maintenance/categories')
  })

  it('stays quiet once the landlord has categories', async () => {
    vi.mocked(getMaintenanceCategories).mockResolvedValue([{ id: 'c1', name: 'Plumbing' }] as any)

    render(<AddMaintenanceRequestDialog open handleClose={vi.fn()} onSaved={vi.fn()} />)

    await waitFor(() => expect(screen.getByLabelText(/^category$/i)).toBeTruthy())
    expect(screen.queryByText(/no categories yet/i)).toBeNull()
  })
})
