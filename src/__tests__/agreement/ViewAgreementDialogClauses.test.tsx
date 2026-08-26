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
  rentDueDay: null,
  maxOccupants: null,
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
      rentDueDay: 1,
      maxOccupants: 2,
      earlyTerminationAllowed: false,
      witnessName: 'Kwame Witness'
    }

    render(<ViewAgreementDialog open handleClose={() => {}} agreement={agreement} />)

    expect(screen.getByText(/subletting/i)).toBeInTheDocument()
    expect(screen.getByText(/notice period/i)).toBeInTheDocument()
    expect(screen.getByText('30 days')).toBeInTheDocument()
    expect(screen.getByText(/rent due day/i)).toBeInTheDocument()
    expect(screen.getByText('1st of the month')).toBeInTheDocument()
    expect(screen.getByText(/occupants allowed/i)).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getAllByText(/witness/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Kwame Witness')).toBeInTheDocument()
  })

  it('does not render the witness label when all clause fields are absent', () => {
    render(<ViewAgreementDialog open handleClose={() => {}} agreement={baseAgreement} />)

    // Scoped to the Witness field label. A bare /witness/i now also matches the
    // "not fully executed" notice, which names a missing witness on purpose —
    // that notice is the subject of ViewAgreementDialogExecution.test.tsx.
    expect(screen.queryByText(/^witness$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/notice period/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/rent due day/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/occupants allowed/i)).not.toBeInTheDocument()
  })

  it('opens the clause section for an agreement whose only recorded fact is a new one', () => {
    // The section guard lists every clause field; a new field left out of it would
    // leave the value invisible for an agreement that records nothing else.
    render(
      <ViewAgreementDialog
        open
        handleClose={() => {}}
        agreement={{ ...baseAgreement, rentDueDay: 15 }}
      />
    )

    expect(screen.getByText(/rent due day/i)).toBeInTheDocument()
    expect(screen.getByText('15th of the month')).toBeInTheDocument()
  })

  it('renders the ordinal suffix correctly across the awkward days', () => {
    const cases: Array<[number, string]> = [
      [1, '1st of the month'],
      [2, '2nd of the month'],
      [3, '3rd of the month'],
      [4, '4th of the month'],
      [11, '11th of the month'],
      [12, '12th of the month'],
      [13, '13th of the month'],
      [21, '21st of the month'],
      [22, '22nd of the month'],
      [23, '23rd of the month'],
      [31, '31st of the month']
    ]

    for (const [day, expected] of cases) {
      const { unmount } = render(
        <ViewAgreementDialog
          open
          handleClose={() => {}}
          agreement={{ ...baseAgreement, rentDueDay: day }}
        />
      )

      expect(screen.getByText(expected)).toBeInTheDocument()
      unmount()
    }
  })
})
