import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/api/maintenance', () => ({
  getComments: vi.fn(),
  addComment: vi.fn(),
  deleteComment: vi.fn(),
  getParts: vi.fn(),
  addPart: vi.fn(),
  deletePart: vi.fn(),
  getMaintenanceCategories: vi.fn(),
  getMaintainers: vi.fn(),
  assignMaintainerToRequest: vi.fn(),
  updateMaintenanceRequestStatus: vi.fn()
}))
vi.mock('@/lib/api/units', () => ({ getUnitById: vi.fn() }))
vi.mock('@/lib/api/storage', () => ({ getStoredTenantId: vi.fn() }))

import ViewMaintenanceRequestDialog from '@/views/maintenance/requests/ViewMaintenanceRequestDialog'
import { getComments, getParts, getMaintenanceCategories, getMaintainers } from '@/lib/api/maintenance'
import { getStoredTenantId } from '@/lib/api/storage'

const complaint = {
  id: 'req-1',
  requestNumber: 'CMP-20260713-ABCD1234',
  title: 'Loud neighbours',
  description: 'Noise every night',
  priority: 'medium',
  status: 'pending',
  propertyId: 'prop-1',
  issueType: 'COMPLAINT',
  complaintCategory: 'NOISE',
  createdAt: '2026-07-13T00:00:00Z'
} as any

describe('ViewMaintenanceRequestDialog — complaint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getStoredTenantId).mockReturnValue('tenant-1')
    vi.mocked(getComments).mockResolvedValue([])
    vi.mocked(getParts).mockResolvedValue([])
    vi.mocked(getMaintenanceCategories).mockResolvedValue([])
    vi.mocked(getMaintainers).mockResolvedValue({ data: [] } as any)
  })

  it('shows the complaint category and hides the maintainer assignment card', () => {
    render(<ViewMaintenanceRequestDialog open setOpen={() => {}} request={complaint} onEdit={() => {}} />)

    // Exact-match strings avoid ambiguity with "Complaint Category" (label) and
    // "Noise every night" (description), which also contain these substrings.
    expect(screen.getByText('Complaint', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('Noise', { exact: true })).toBeInTheDocument()
    // The maintainer assignment card must not render for a complaint.
    expect(screen.queryByText(/assign.*maintainer|maintainer assignment/i)).not.toBeInTheDocument()
  })

  it('hides repair-only rows for a complaint even when stale repair fields are present', () => {
    // A request switched from Repair to Complaint on edit keeps its repair
    // fields in the DB (the null-guarded PATCH can't clear them by omission).
    // The View must gate those rows on issueType, not on field presence.
    const switchedComplaint = {
      ...complaint,
      categoryId: 'cat-1',
      estimatedCost: 500,
      billableTo: 'occupant',
      permissionToEnter: true,
      entryInstructions: 'Ring the bell',
      targetResolutionDate: '2026-07-20T00:00:00Z'
    } as any

    render(<ViewMaintenanceRequestDialog open setOpen={() => {}} request={switchedComplaint} onEdit={() => {}} />)

    // Still a complaint with its category…
    expect(screen.getByText('Complaint', { exact: true })).toBeInTheDocument()
    // …but none of the stale repair-only rows may render.
    expect(screen.queryByText('Category')).not.toBeInTheDocument()
    expect(screen.queryByText('Estimated Cost')).not.toBeInTheDocument()
    expect(screen.queryByText('Billable To')).not.toBeInTheDocument()
    expect(screen.queryByText('Permission to Enter')).not.toBeInTheDocument()
    expect(screen.queryByText('Target Resolution')).not.toBeInTheDocument()
  })
})
