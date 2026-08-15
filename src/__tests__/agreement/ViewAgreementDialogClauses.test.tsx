import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import ViewAgreementDialog from '@/views/agreement/ViewAgreementDialog'
import type { Agreement } from '@/lib/api/agreements'

const baseAgreement: Agreement = {
  id: 'agr-1',
  agreementNumber: 'AGR-2026-001',
  type: 'LEASE',
  status: 'ACTIVE',
  occupantId: 'occ-1',
  occupantName: 'Ama Mensah',
  propertyId: 'prop-1',
  propertyName: 'Sunset Villa',
  unitId: 'unit-1',
  unitNo: 'A1',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  signedDate: null,
  rent: null,
  securityDeposit: null,
  lateFee: null,
  totalAmount: null,
  currency: 'GHS',
  paymentFrequency: 'MONTHLY',
  duration: null,
  terms: null,
  conditions: null,
  renewalOptions: null,
  documentUrl: null,
  sublettingAllowed: null,
  petsAllowed: null,
  noiseRestrictionsApply: null,
  noticePeriodDays: null,
  earlyTerminationAllowed: null,
  witnessName: null,
  previousAgreementId: null,
  renewalDecision: null,
  renewalDecidedAt: null,
  renewalNotes: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null
}

describe('ViewAgreementDialog — structured clauses + witness', () => {
  it('renders the clause values and witness when present', () => {
    const agreement: Agreement = {
      ...baseAgreement,
      sublettingAllowed: true,
      petsAllowed: false,
      noiseRestrictionsApply: true,
      noticePeriodDays: 30,
      earlyTerminationAllowed: false,
      witnessName: 'Kwame Witness'
    }

    render(<ViewAgreementDialog open handleClose={() => {}} agreement={agreement} />)

    expect(screen.getByText(/subletting/i)).toBeInTheDocument()
    expect(screen.getByText(/notice period/i)).toBeInTheDocument()
    expect(screen.getByText('30 days')).toBeInTheDocument()
    expect(screen.getAllByText(/witness/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Kwame Witness')).toBeInTheDocument()
  })

  it('does not render the witness label when all clause fields are absent', () => {
    render(<ViewAgreementDialog open handleClose={() => {}} agreement={baseAgreement} />)

    expect(screen.queryAllByText(/witness/i)).toHaveLength(0)
    expect(screen.queryByText(/notice period/i)).not.toBeInTheDocument()
  })
})
