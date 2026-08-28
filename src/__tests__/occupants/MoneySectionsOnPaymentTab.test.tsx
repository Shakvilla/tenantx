import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

/**
 * The advance and the caution fee belong on the tab about money.
 *
 * They were correct and they looked right — but they lived on **Home Details**, which is where
 * a landlord looks for the property. He found them by accident and said so. This pins which tab
 * hosts them, because that is the whole of the finding: nothing about the panels themselves
 * changed, only where a person has to look.
 *
 * The panels are stubbed deliberately. The question here is placement, not their internals,
 * which have their own tests.
 */

vi.mock('@/views/tenants/view/AdvanceRentSection', () => ({
  default: () => <div>advance-rent-panel</div>
}))
vi.mock('@/views/tenants/view/CautionFeeSection', () => ({
  default: () => <div>caution-fee-panel</div>
}))
vi.mock('@/lib/api/payments', () => ({
  paymentsApi: { getByOccupant: vi.fn(async () => []) }
}))
vi.mock('@/lib/api/storage', () => ({ getStoredTenantId: () => 'tenant-1' }))

import PaymentHistoryTab from '@/views/tenants/view/PaymentHistoryTab'
import HomeDetailsTab from '@/views/tenants/view/HomeDetailsTab'

const occupant = {
  id: 'occ-1',
  name: 'Akosua Boateng',
  unitId: 'unit-1',
  propertyId: 'prop-1',
  costPerMonth: 'GHS 600',
  securityDeposit: 'GHS 600'
} as any

describe('where a landlord finds the advance and the caution fee', () => {
  it('shows both on Payment History', () => {
    render(
      <PaymentHistoryTab
        occupantId={occupant.id}
        occupantName={occupant.name}
        unitId={occupant.unitId}
        propertyId={occupant.propertyId}
      />
    )

    expect(screen.getByText('advance-rent-panel')).toBeTruthy()
    expect(screen.getByText('caution-fee-panel')).toBeTruthy()
  })

  it('no longer shows them on Home Details, but says where they went', () => {
    render(<HomeDetailsTab tenantData={occupant} />)

    expect(screen.queryByText('advance-rent-panel')).toBeNull()
    expect(screen.queryByText('caution-fee-panel')).toBeNull()

    // Anyone who learned the old location is told, rather than left hunting.
    expect(screen.getByText(/Payment History/i)).toBeTruthy()
  })

  it('calls the lease figure something that cannot be mistaken for the fee being held', () => {
    render(<HomeDetailsTab tenantData={occupant} />)

    // Two names for one fee is why GHS 600 was entered twice.
    expect(screen.getByLabelText(/deposit stated on the lease/i)).toBeTruthy()
    expect(screen.queryByLabelText(/^security deposit$/i)).toBeNull()
  })
})
