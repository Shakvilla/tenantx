import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/lib/api/documents', () => ({
  createDocument: vi.fn()
}))

vi.mock('@/lib/api/occupants', () => ({
  getOccupants: vi.fn()
}))

vi.mock('@/lib/api/properties', () => ({
  getProperties: vi.fn()
}))

vi.mock('@/lib/api/storage', () => ({
  getStoredTenantId: vi.fn()
}))

vi.mock('@/lib/api/agreements', () => ({
  getAgreements: vi.fn()
}))

import AddDocumentDialog from '@/views/documents/AddDocumentDialog'
import { createDocument } from '@/lib/api/documents'
import { getOccupants } from '@/lib/api/occupants'
import { getProperties } from '@/lib/api/properties'
import { getStoredTenantId } from '@/lib/api/storage'
import { getAgreements } from '@/lib/api/agreements'

describe('AddDocumentDialog — agreement attachment', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // NOTE: vitest.config.ts sets `mockReset: true` / `restoreMocks: true`, which resets
    // every mock's implementation (not just call history) before each test. Because the
    // vi.mock(...) factories above only run once at module-load time, any
    // .mockResolvedValue()/.mockReturnValue() set there gets wiped before the first test
    // body runs. Re-establishing the return values here (after the built-in reset, before
    // the test body) is required for the mocks to actually resolve/return anything.
    vi.mocked(createDocument).mockResolvedValue({ id: 'doc-1' } as any)

    vi.mocked(getOccupants).mockResolvedValue({
      data: [
        { id: 'occ-1', firstName: 'Ama', lastName: 'Mensah', propertyId: 'prop-1', propertyName: 'Sunset', unitId: 'unit-1', unitNo: 'A1' }
      ]
    } as any)

    vi.mocked(getProperties).mockResolvedValue({
      data: [
        { id: 'prop-1', name: 'Sunset', units: [{ id: 'unit-1', unitNo: 'A1' }] }
      ]
    } as any)

    vi.mocked(getStoredTenantId).mockReturnValue('tenant-1')

    vi.mocked(getAgreements).mockResolvedValue([
      { id: 'agr-1', agreementNumber: 'AGR-2026-001', occupantId: 'occ-1' }
    ] as any)
  })

  it('offers the 12-value document-type list and includes agreementId in the payload when selected', async () => {
    render(<AddDocumentDialog open setOpen={() => {}} onSuccess={() => {}} />)

    // Wait for the async occupants/properties load to finish and the form to render.
    // (MUI Select menu items aren't in the DOM until the menu is opened, so we can't
    // wait on the option text itself here — see report for details.)
    await screen.findByLabelText(/document type/i)

    fireEvent.mouseDown(screen.getByLabelText(/document type/i))
    expect(await screen.findByText('Ghana Card')).toBeInTheDocument()
    expect(screen.getByText('Employment Letter')).toBeInTheDocument()
    expect(screen.getByText('Payslip')).toBeInTheDocument()
    expect(screen.getByText('Business Registration')).toBeInTheDocument()
    expect(screen.getByText('Reference')).toBeInTheDocument()
    expect(screen.getByText('Receipt')).toBeInTheDocument()
    expect(screen.getByText('Passport Photo')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Ghana Card'))

    fireEvent.mouseDown(screen.getByLabelText(/^tenant/i))
    fireEvent.click(await screen.findByText('Ama Mensah — Unit A1'))

    // (Same MUI-menu-not-mounted-until-open caveat as above: agreements load
    // asynchronously once the occupant is set, so we open the menu first and let
    // findByText poll for the option rather than checking for it beforehand.)
    fireEvent.mouseDown(screen.getByLabelText(/agreement/i))
    fireEvent.click(await screen.findByText('AGR-2026-001'))

    fireEvent.click(screen.getByRole('button', { name: /save|upload|add/i }))

    await waitFor(() => expect(createDocument).toHaveBeenCalled())
    const payload = vi.mocked(createDocument).mock.calls[0][0]
    expect(payload.documentType).toBe('Ghana Card')
    expect(payload.agreementId).toBe('agr-1')
  })
})
