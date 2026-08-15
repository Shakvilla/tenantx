import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ViewDocumentDialog from '@/views/documents/ViewDocumentDialog'
import type { DocumentType } from '@/types/documents/documentTypes'

const baseDoc: DocumentType = {
  id: 'doc-1',
  documentType: 'Signed Tenancy Agreement',
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

    // Matched on /Agreement/ until "Signed Tenancy Agreement" became a document
    // type — the loose regex then hit the type row and the test failed on a
    // document with no agreement attached. Assert on the row's own label and on
    // the reference format instead, which is what "agreement-related" meant.
    expect(screen.queryByText(/^Agreement:?$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/AGR-\d{4}-\d+/)).not.toBeInTheDocument()
  })
})
