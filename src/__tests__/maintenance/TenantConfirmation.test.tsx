import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/lib/api/maintenance', () => ({
  getComments: vi.fn(),
  addComment: vi.fn(),
  getParts: vi.fn(),
  getMaintenanceCategories: vi.fn(),
  getMaintainers: vi.fn(),
  assignMaintainerToRequest: vi.fn(),
  updateMaintenanceRequestStatus: vi.fn(),
  confirmMaintenanceRequest: vi.fn(),
  disputeMaintenanceRequest: vi.fn(),
}))
vi.mock('@/lib/api/units', () => ({ getUnitById: vi.fn() }))
vi.mock('@/lib/api/storage', () => ({ getStoredTenantId: vi.fn(() => 't-1') }))

const OCCUPANT_ID = 'occ-1'
let mockUser: any = { id: OCCUPANT_ID, userType: 'OCCUPANT' }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }))

import ViewMaintenanceRequestDialog from '@/views/maintenance/requests/ViewMaintenanceRequestDialog'
import {
  getComments, getParts, getMaintenanceCategories, getMaintainers,
  confirmMaintenanceRequest, disputeMaintenanceRequest,
} from '@/lib/api/maintenance'
import { getUnitById } from '@/lib/api/units'

const completedRequest: any = {
  id: 'req-1', requestNumber: 'REQ-2026-001', title: 'Leaking tap', description: 'Kitchen tap drips',
  priority: 'medium', status: 'completed', propertyId: 'p-1', unitId: 'u-1', occupantId: OCCUPANT_ID,
  issueType: 'REPAIR', tenantConfirmed: false, completedDate: '2026-07-14T00:00:00Z', images: [],
}

describe('ViewMaintenanceRequestDialog — tenant confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = { id: OCCUPANT_ID, userType: 'OCCUPANT' }
    vi.mocked(getComments).mockResolvedValue([] as any)
    vi.mocked(getParts).mockResolvedValue([] as any)
    vi.mocked(getMaintenanceCategories).mockResolvedValue([] as any)
    vi.mocked(getMaintainers).mockResolvedValue({ data: [] } as any)
    vi.mocked(getUnitById).mockResolvedValue({ data: { unitNo: 'A1' } } as any)
    vi.mocked(confirmMaintenanceRequest).mockResolvedValue({ ...completedRequest, status: 'closed', tenantConfirmed: true } as any)
    vi.mocked(disputeMaintenanceRequest).mockResolvedValue({ ...completedRequest, status: 'in_progress', reopenReason: 'Still dripping' } as any)
  })

  it('lets the owning occupant confirm a completed repair', async () => {
    render(<ViewMaintenanceRequestDialog open setOpen={() => {}} request={completedRequest} onEdit={() => {}} />)

    fireEvent.click(await screen.findByRole('button', { name: /confirm fixed/i }))

    await waitFor(() => expect(confirmMaintenanceRequest).toHaveBeenCalledWith('req-1'))
    // status chip flips to the closed label
    await screen.findByText('Closed')
  })

  it('lets the owning occupant dispute with a reason', async () => {
    render(<ViewMaintenanceRequestDialog open setOpen={() => {}} request={completedRequest} onEdit={() => {}} />)

    fireEvent.click(await screen.findByRole('button', { name: /not fixed/i }))
    fireEvent.change(await screen.findByLabelText(/what is still wrong/i), { target: { value: 'Still dripping' } })
    fireEvent.click(screen.getByRole('button', { name: /reopen request/i }))

    await waitFor(() => expect(disputeMaintenanceRequest).toHaveBeenCalledWith('req-1', 'Still dripping'))
  })

  it('does not offer confirm/dispute to a landlord', async () => {
    mockUser = { id: 'landlord-1', userType: 'LANDLORD' }
    render(<ViewMaintenanceRequestDialog open setOpen={() => {}} request={completedRequest} onEdit={() => {}} />)

    await screen.findByText('REQ-2026-001')
    expect(screen.queryByRole('button', { name: /confirm fixed/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /not fixed/i })).toBeNull()
  })

  it('does not offer confirm/dispute once the request is closed', async () => {
    render(
      <ViewMaintenanceRequestDialog
        open setOpen={() => {}} onEdit={() => {}}
        request={{ ...completedRequest, status: 'closed', tenantConfirmed: true }}
      />
    )

    await screen.findByText('REQ-2026-001')
    expect(screen.queryByRole('button', { name: /confirm fixed/i })).toBeNull()
  })
})
