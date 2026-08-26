import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import ViewAgreementDialog from '@/views/agreement/ViewAgreementDialog'
import type { Agreement } from '@/lib/api/agreements'

/**
 * The dialog used to close with "This agreement is legally binding and
 * enforceable" on every agreement it was given — including AGR-2026-001, which
 * the onboarding wizard had created moments earlier with no signature date, no
 * witness and no document attached. A landlord who believes that sentence stops
 * chasing the signature.
 */

const unexecuted: Agreement = {
  id: 'agr-1',
  agreementNumber: 'AGR-2026-001',
  type: 'LEASE',
  status: 'ACTIVE',
  occupantId: 'occ-1',
  occupantName: 'Akosua Boateng',
  propertyId: 'prop-1',
  propertyName: 'Adenta Compound',
  unitId: 'unit-1',
  unitNo: 'Room 1',
  startDate: '2026-08-23',
  endDate: '2028-08-22',
  signedDate: null,
  rent: 600,
  securityDeposit: null,
  lateFee: null,
  totalAmount: 14400,
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
  createdAt: '2026-08-23T00:00:00Z',
  updatedAt: null,
  // Lease facts added by feat/occupant-lease-facts; null here because this fixture is about
  // whether the agreement is executed, not about its terms.
  rentDueDay: null,
  maxOccupants: null
}

const executed: Agreement = {
  ...unexecuted,
  signedDate: '2026-08-23',
  witnessName: 'Yaw Boateng',
  documentUrl: 'https://ik.imagekit.io/x/AGR-2026-001.pdf'
}

describe('ViewAgreementDialog — enforceability claim', () => {
  it('does not call an unsigned, unwitnessed agreement binding', () => {
    render(<ViewAgreementDialog open handleClose={vi.fn()} agreement={unexecuted} />)

    expect(screen.queryByText(/legally binding and enforceable/i)).toBeNull()
    expect(screen.getByText(/Not fully executed/i)).toBeTruthy()
    expect(
      screen.getByText(/the date it was signed, a witness and a copy of the signed agreement/i)
    ).toBeTruthy()
  })

  it('offers a route to complete it rather than only naming the problem', async () => {
    const onEdit = vi.fn()

    render(<ViewAgreementDialog open handleClose={vi.fn()} agreement={unexecuted} onEdit={onEdit} />)

    const { default: userEvent } = await import('@testing-library/user-event')

    await userEvent.click(screen.getByRole('button', { name: /complete it/i }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('states what was executed once all three are on the record', () => {
    render(<ViewAgreementDialog open handleClose={vi.fn()} agreement={executed} />)

    expect(screen.queryByText(/Not fully executed/i)).toBeNull()
    expect(screen.getByText(/witnessed by Yaw Boateng/i)).toBeTruthy()
    expect(screen.getByText(/copy of the signed agreement attached/i)).toBeTruthy()
  })
})
