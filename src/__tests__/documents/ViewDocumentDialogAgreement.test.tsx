import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ViewDocumentDialog from '@/views/documents/ViewDocumentDialog'
import type { DocumentType } from '@/types/documents/documentTypes'

const baseDoc: DocumentType = {
  id: 'doc-1',
  documentType: 'Ghana Card',
  status: 'pending',
  propertyName: 'Sunset Apartments',
  unitNo: 'A1',
  tenantName: 'Ama Mensah'
}

describe('ViewDocumentDialog — agreement display', () => {
  it('shows the agreement number when present', () => {
    render(
      <ViewDocumentDialog
        open
        handleClose={() => {}}
        document={{ ...baseDoc, agreementNumber: 'AGR-2026-001' }}
      />
    )

    expect(screen.getByText('AGR-2026-001')).toBeInTheDocument()
  })

  it('shows nothing agreement-related when absent', () => {
    render(<ViewDocumentDialog open handleClose={() => {}} document={baseDoc} />)

    expect(screen.queryByText(/Agreement/)).not.toBeInTheDocument()
  })
})
