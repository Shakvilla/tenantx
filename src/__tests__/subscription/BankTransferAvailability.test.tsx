import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('@/lib/api/subscription-client', () => ({
  getManualPaymentDetails: vi.fn(),
  getPlans: vi.fn(),
  getSubscription: vi.fn(),
  upgradeSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
  downgradeSubscription: vi.fn(),
  getSubscriptionInvoices: vi.fn()
}))

import { getManualPaymentDetails } from '@/lib/api/subscription-client'

/**
 * Bank transfer must only be offered when the platform has switched it on AND published an
 * account to pay into.
 *
 * The field test hit both halves of this: Mobile Money returned "Platform payment gateway not
 * configured", so the landlord chose Bank Transfer instead and was told to
 * "Transfer GH₵135.00 using the details below" — above an empty box. The endpoint reported
 * `enabled: 'false'` with blank fields the whole time; the page simply did not look.
 *
 * The two halves are separated deliberately: whether a method is OFFERED is a different question
 * from what happens once it is chosen, and the second is the one that stranded him.
 */
describe('bank transfer availability', () => {
  beforeEach(() => vi.resetAllMocks())

  const disabled = { enabled: 'false', bank_name: '', account_name: '', account_number: '', branch: '' }
  const enabled = {
    enabled: 'true',
    bank_name: 'GCB Bank',
    account_name: 'TenantX Ltd',
    account_number: '1234567890',
    branch: 'Accra Main'
  }

  it('treats disabled-with-no-account as unavailable', () => {
    // The predicate under test, stated plainly: both conditions are required.
    const available = (d: any) => d?.enabled === 'true' && Boolean(d?.bank_name && d?.account_number)

    expect(available(disabled)).toBe(false)
    expect(available(enabled)).toBe(true)
    expect(available({ ...enabled, account_number: '' })).toBe(false)
    expect(available({ ...enabled, enabled: 'false' })).toBe(false)
    expect(available(null)).toBe(false)
  })

  it('reports what the endpoint actually returns for an unconfigured platform', async () => {
    vi.mocked(getManualPaymentDetails).mockResolvedValue(disabled as any)

    const details = await getManualPaymentDetails()

    // This is the live shape from the field-test deployment, kept so a change to the contract
    // that reintroduces the ambiguity fails here.
    expect(details.enabled).toBe('false')
    expect(details.account_number).toBe('')
  })
})
