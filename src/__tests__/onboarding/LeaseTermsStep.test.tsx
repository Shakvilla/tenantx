import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/api/agreements', () => ({
  createAgreement: vi.fn().mockResolvedValue({ id: 'agr1' })
}))

import LeaseTermsStep from '@/views/onboarding/steps/LeaseTermsStep'
import { createAgreement } from '@/lib/api/agreements'

describe('LeaseTermsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createAgreement).mockResolvedValue({ id: 'agr1' } as any)
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
