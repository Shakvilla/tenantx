import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/lib/api/agreements', () => ({
  getAgreements: vi.fn(),
  deleteAgreement: vi.fn(),
  updateAgreementStatus: vi.fn(),
  exportAgreementsCsv: vi.fn(),
  renewAgreement: vi.fn(),
  terminateAgreement: vi.fn(),
  getAgreementStats: vi.fn(),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { userType: 'LANDLORD' }, tenant: { id: 't-1' } }),
}))

// Not under test, and it needs a MUI ThemeProvider (useMediaQuery reads theme.breakpoints).
vi.mock('@/views/agreement/AgreementsStatsCard', () => ({ default: () => null }))

import AgreementsListTable from '@/views/agreement/AgreementsListTable'
import { getAgreements, renewAgreement, terminateAgreement } from '@/lib/api/agreements'

const base = {
  id: 'agr-1', agreementNumber: 'AGR-2026-001', type: 'LEASE', status: 'ACTIVE',
  occupantId: 'occ-1', occupantName: 'Ama Mensah', propertyId: 'p-1', propertyName: 'Palm Court',
  unitId: 'u-1', unitNo: 'A1', startDate: '2025-08-01', endDate: '2026-07-31', signedDate: null,
  rent: 1200, securityDeposit: null, lateFee: null, totalAmount: null, currency: 'GHS',
  paymentFrequency: 'MONTHLY', duration: null, terms: null, conditions: null, renewalOptions: null,
  documentUrl: null, sublettingAllowed: null, petsAllowed: null, noiseRestrictionsApply: null,
  noticePeriodDays: null, earlyTerminationAllowed: null, witnessName: null,
  previousAgreementId: null, renewalDecision: null, renewalDecidedAt: null, renewalNotes: null,
  createdAt: '2025-08-01T00:00:00Z', updatedAt: null,
}

/** RowActions renders each action as an inline icon button — find it by its icon class. */
function clickAction(container: HTMLElement, iconClass: string) {
  const btn = container.querySelector(`.${iconClass}`)?.closest('button')
  if (!btn) throw new Error(`Action button not found for icon .${iconClass}`)
  fireEvent.click(btn)
}

const RENEW_ICON = 'ri-restart-line'
const TERMINATE_ICON = 'ri-close-circle-line'

describe('AgreementsListTable — renewal workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAgreements).mockResolvedValue([{ ...base }] as any)
    vi.mocked(renewAgreement).mockResolvedValue({ ...base, id: 'agr-2', agreementNumber: 'AGR-2026-005', status: 'PENDING', previousAgreementId: 'agr-1' } as any)
    vi.mocked(terminateAgreement).mockResolvedValue({ ...base, status: 'TERMINATED', renewalDecision: 'TERMINATED' } as any)
  })

  it('renews an agreement with the chosen end date', async () => {
    const { container } = render(<AgreementsListTable />)
    await screen.findByText('AGR-2026-001')

    clickAction(container, RENEW_ICON)

    fireEvent.change(await screen.findByLabelText(/new end date/i), { target: { value: '2027-07-31' } })
    fireEvent.click(screen.getByRole('button', { name: /^renew$/i }))

    await waitFor(() => expect(renewAgreement).toHaveBeenCalled())
    const [id, payload] = vi.mocked(renewAgreement).mock.calls[0]
    expect(id).toBe('agr-1')
    expect(payload.endDate).toBe('2027-07-31')
  })

  it('terminates an agreement with notes', async () => {
    const { container } = render(<AgreementsListTable />)
    await screen.findByText('AGR-2026-001')

    clickAction(container, TERMINATE_ICON)

    fireEvent.change(await screen.findByLabelText(/reason/i), { target: { value: 'Tenant relocating' } })
    fireEvent.click(screen.getByRole('button', { name: /^terminate$/i }))

    await waitFor(() => expect(terminateAgreement).toHaveBeenCalledWith('agr-1', 'Tenant relocating'))
  })

  it('hides Renew/Terminate once a decision is recorded', async () => {
    vi.mocked(getAgreements).mockResolvedValue([{ ...base, renewalDecision: 'RENEWED' }] as any)
    const { container } = render(<AgreementsListTable />)
    await screen.findByText('AGR-2026-001')

    // The decision chip is shown...
    expect(screen.getAllByText('Renewed').length).toBeGreaterThan(0)

    // ...and the lifecycle actions are gone.
    expect(container.querySelector(`.${RENEW_ICON}`)).toBeNull()
    expect(container.querySelector(`.${TERMINATE_ICON}`)).toBeNull()
  })
})
