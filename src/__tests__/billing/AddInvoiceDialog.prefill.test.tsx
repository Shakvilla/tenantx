import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('@/lib/api/invoices', () => ({
  createInvoice: vi.fn(),
  updateInvoice: vi.fn()
}))

vi.mock('@/lib/api/properties', () => ({
  getProperties: vi.fn()
}))

vi.mock('@/lib/api/units', () => ({
  getAllUnits: vi.fn()
}))

vi.mock('@/lib/api/occupants', () => ({
  getOccupants: vi.fn()
}))

vi.mock('@/lib/api/storage', () => ({
  getStoredTenantId: vi.fn(() => 'tenant-1')
}))

import AddInvoiceDialog from '@/views/billing/AddInvoiceDialog'
import { getProperties } from '@/lib/api/properties'
import { getAllUnits } from '@/lib/api/units'
import { getOccupants } from '@/lib/api/occupants'

const mockProperty = {
  id: 'p1',
  tenantId: 'tenant-1',
  name: 'Sunset Apartments',
  address: { street: '1 Main St', city: 'Accra', country: 'GH' },
  type: 'residential',
  ownership: 'own',
  totalUnits: 1,
  occupiedUnits: 1,
  status: 'active'
}

const mockUnit = {
  id: 'u1',
  tenantId: 'tenant-1',
  propertyId: 'p1',
  unitNo: 'A1',
  type: '1br',
  rent: 1500
}

const mockOccupant = {
  id: 'o1',
  tenantId: 'tenant-1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '0244000000',
  status: 'active',
  unitId: 'u1',
  createdAt: '2026-07-01',
  updatedAt: '2026-07-01'
}

describe('AddInvoiceDialog prefill', () => {
  beforeEach(() => {
    vi.mocked(getProperties).mockResolvedValue({ data: [mockProperty] } as never)
    vi.mocked(getAllUnits).mockResolvedValue({ data: [mockUnit] } as never)
    vi.mocked(getOccupants).mockResolvedValue({ success: true, data: [mockOccupant] } as never)
  })

  it('seeds property, unit, tenant and amount from prefill once reference data loads', async () => {
    render(
      <AddInvoiceDialog
        open
        prefill={{ propertyId: 'p1', unitId: 'u1', occupantId: 'o1', amount: '1500' }}
        handleClose={vi.fn()}
        onSaved={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('1500')).toBeInTheDocument()
    })

    expect(screen.getByText('Sunset Apartments')).toBeInTheDocument()
    expect(screen.getByText('A1')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Jane Doe (jane@example.com)')).toBeInTheDocument()

    // Invoice type should default to Rent when prefilled
    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument()
  })

  it('does not seed from prefill when editing an existing invoice', async () => {
    const editInvoice = {
      id: 'inv-1',
      invoiceNumber: 'INV-001',
      propertyId: 'p1',
      unitId: 'u1',
      occupantId: 'o1',
      amount: 999,
      invoiceType: 'Water',
      status: 'DRAFT',
      description: 'Existing',
      dueDate: '2026-08-01',
      issuedDate: '2026-07-01',
      invoiceMonth: '07/2026',
      balance: 999,
      currency: 'GHS',
      invoiceItems: []
    }

    render(
      <AddInvoiceDialog
        open
        editInvoice={editInvoice as never}
        prefill={{ propertyId: 'p1', unitId: 'u1', occupantId: 'o1', amount: '1500' }}
        handleClose={vi.fn()}
        onSaved={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('999')).toBeInTheDocument()
    })
  })
})
