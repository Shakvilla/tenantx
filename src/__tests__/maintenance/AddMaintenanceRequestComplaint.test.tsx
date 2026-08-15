import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/lib/api/maintenance', () => ({
  createMaintenanceRequest: vi.fn(),
  updateMaintenanceRequest: vi.fn(),
  assignMaintainerToRequest: vi.fn(),
  updateMaintenanceRequestStatus: vi.fn(),
  getMaintainers: vi.fn(),
  getMaintenanceCategories: vi.fn()
}))
vi.mock('@/lib/api/properties', () => ({ getProperties: vi.fn() }))
vi.mock('@/lib/api/units', () => ({ getUnitsByProperty: vi.fn() }))
vi.mock('@/lib/api/occupants', () => ({ getOccupants: vi.fn() }))
vi.mock('@/lib/api/storage', () => ({ getStoredTenantId: vi.fn() }))

import AddMaintenanceRequestDialog from '@/views/maintenance/requests/AddMaintenanceRequestDialog'
import { createMaintenanceRequest, getMaintainers, getMaintenanceCategories } from '@/lib/api/maintenance'
import { getProperties } from '@/lib/api/properties'
import { getUnitsByProperty } from '@/lib/api/units'
import { getOccupants } from '@/lib/api/occupants'
import { getStoredTenantId } from '@/lib/api/storage'

describe('AddMaintenanceRequestDialog — complaint mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getStoredTenantId).mockReturnValue('tenant-1')
    vi.mocked(createMaintenanceRequest).mockResolvedValue({ id: 'req-1' } as any)
    vi.mocked(getProperties).mockResolvedValue({ data: [{ id: 'prop-1', name: 'Sunset Villa' }] } as any)
    vi.mocked(getMaintainers).mockResolvedValue({ data: [] } as any)
    vi.mocked(getMaintenanceCategories).mockResolvedValue({ data: [] } as any)
    vi.mocked(getUnitsByProperty).mockResolvedValue({ data: [] } as any)
    vi.mocked(getOccupants).mockResolvedValue({ data: [] } as any)
  })

  it('sends issueType=COMPLAINT + complaintCategory and omits repair category when filing a complaint', async () => {
    render(<AddMaintenanceRequestDialog open handleClose={() => {}} onSuccess={() => {}} />)

    // Wait for the form to be ready.
    await screen.findByLabelText(/title/i)

    // Switch to Complaint mode.
    fireEvent.click(screen.getByRole('button', { name: /complaint/i }))

    // Fill the required shared fields.
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Loud neighbours' } })
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Noise every night' } })

    // Property (MUI Select).
    fireEvent.mouseDown(screen.getByLabelText(/property/i))
    fireEvent.click(await screen.findByText('Sunset Villa'))

    // Complaint category (only shown in complaint mode).
    fireEvent.mouseDown(screen.getByLabelText(/complaint category/i))
    fireEvent.click(await screen.findByText('Noise'))

    fireEvent.click(screen.getByRole('button', { name: /add request/i }))

    await waitFor(() => expect(createMaintenanceRequest).toHaveBeenCalled())
    const payload = vi.mocked(createMaintenanceRequest).mock.calls[0][0]
    expect(payload.issueType).toBe('COMPLAINT')
    expect(payload.complaintCategory).toBe('NOISE')
    expect(payload.categoryId).toBeUndefined()
  })
})
