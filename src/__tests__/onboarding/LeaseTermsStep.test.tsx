import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/api/agreements', () => ({
  createAgreement: vi.fn().mockResolvedValue({ id: 'agr1' })
}))

vi.mock('@/lib/api/cautionFees', () => ({
  cautionFeesApi: { create: vi.fn().mockResolvedValue({ id: 'cf1' }) }
}))

import LeaseTermsStep from '@/views/onboarding/steps/LeaseTermsStep'
import { createAgreement } from '@/lib/api/agreements'
import { cautionFeesApi } from '@/lib/api/cautionFees'

describe('LeaseTermsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createAgreement).mockResolvedValue({ id: 'agr1' } as any)
    vi.mocked(cautionFeesApi.create).mockResolvedValue({ id: 'cf1' } as any)
  })

  const renderStep = (onComplete = vi.fn()) => {
    render(
      <LeaseTermsStep
        entityIds={{ occupantId: 'o1', propertyId: 'p1', unitId: 'u1' }}
        defaultRent={1500}
        defaultStartDate='2026-07-20'
        onComplete={onComplete}
      />
    )

    return onComplete
  }

  /**
   * The agreement's securityDeposit is a TERM of the tenancy. The caution_fees ledger is the
   * MONEY — what is held, deducted, refunded or forfeited at move-out. Onboarding used to write
   * only the term, so nothing in the product could answer "how much of my tenants' money am I
   * holding?" even though the ledger was fully built.
   */
  it('records the caution fee as money held, not just a lease term', async () => {
    const onComplete = renderStep()

    fireEvent.change(screen.getByLabelText(/caution fee/i), { target: { value: '600' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => expect(cautionFeesApi.create).toHaveBeenCalled())
    expect(vi.mocked(cautionFeesApi.create).mock.calls[0][0]).toMatchObject({
      occupantId: 'o1',
      unitId: 'u1',
      propertyId: 'p1',
      amount: 600
    })
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith({ agreementId: 'agr1' }))
  })

  it('does not touch the ledger when no caution fee was collected', async () => {
    const onComplete = renderStep()

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => expect(onComplete).toHaveBeenCalled())
    expect(cautionFeesApi.create).not.toHaveBeenCalled()
  })

  /**
   * A caution fee that silently failed to record is money that goes missing at move-out. The
   * lease is good and must not be discarded, but the landlord has to be told — so the step
   * stops and says so rather than advancing as though nothing happened.
   */
  it('tells the landlord when the caution fee could not be recorded, and does not advance silently', async () => {
    vi.mocked(cautionFeesApi.create).mockRejectedValue(new Error('ledger unavailable'))

    const onComplete = renderStep()

    fireEvent.change(screen.getByLabelText(/caution fee/i), { target: { value: '600' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText(/caution fee was not recorded/i)).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()

    // The tenancy is real, so the landlord can still proceed — deliberately, and knowingly.
    fireEvent.click(screen.getByRole('button', { name: /continue anyway/i }))
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith({ agreementId: 'agr1' }))
  })

  it('pre-fills rent and start date from the carried context', () => {
    render(
      <LeaseTermsStep
        entityIds={{ occupantId: 'o1', propertyId: 'p1', unitId: 'u1' }}
        defaultRent={1500}
        defaultStartDate='2026-07-20'
        onComplete={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/rent/i)).toHaveValue(1500)
    expect(screen.getByLabelText(/start date/i)).toHaveValue('2026-07-20')
  })

  it('creates the agreement with the carried ids and reports agreementId', async () => {
    const onComplete = vi.fn()

    render(
      <LeaseTermsStep
        entityIds={{ occupantId: 'o1', propertyId: 'p1', unitId: 'u1' }}
        defaultRent={1500}
        defaultStartDate='2026-07-20'
        onComplete={onComplete}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => expect(createAgreement).toHaveBeenCalled())
    expect(createAgreement).toHaveBeenCalledWith(
      expect.objectContaining({ occupantId: 'o1', propertyId: 'p1', unitId: 'u1', rent: 1500, type: 'LEASE' })
    )
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith({ agreementId: 'agr1' }))
  })
})
