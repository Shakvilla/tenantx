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

/**
 * RowActions shows actions inline only while there are two or fewer, and
 * collapses the rest behind a "⋯" trigger (INLINE_LIMIT). A landlord row here
 * carries six — View, Edit, Update Status, Renew, Terminate, Delete — so every
 * action lives in the overflow menu and none of their icons is in the DOM until
 * it is opened.
 *
 * These helpers query `screen`, not `container`: MUI renders the menu in a
 * portal, outside the tree `render` hands back.
 */
function openRowMenu(container: HTMLElement) {
  const trigger = container.querySelector<HTMLButtonElement>('button[aria-label="more actions"]')

  if (!trigger) throw new Error('Row overflow menu trigger not found')
  fireEvent.click(trigger)
}

function clickAction(container: HTMLElement, name: RegExp) {
  openRowMenu(container)
  fireEvent.click(screen.getByRole('menuitem', { name }))
}

const RENEW = /^Renew$/
const TERMINATE = /^Terminate$/

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

    clickAction(container, RENEW)

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

    clickAction(container, TERMINATE)

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
    openRowMenu(container)

    // Positive control first. This assertion used to query the closed menu's
    // icons, so it passed whether or not the actions were conditioned on the
    // decision at all — proving a sibling action IS listed is what makes the
    // two absences below mean something.
    expect(screen.getByRole('menuitem', { name: /^Update Status$/ })).toBeInTheDocument()

    expect(screen.queryByRole('menuitem', { name: RENEW })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: TERMINATE })).toBeNull()
  })
})
