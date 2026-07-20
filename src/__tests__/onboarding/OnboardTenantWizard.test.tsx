import { render, screen, act, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/lib/api/storage', () => ({ getStoredTenantId: () => 't1' }))

// keep child steps light — the shell test only checks open/close + step 1 mounts
vi.mock('@/views/onboarding/steps/TenantHomeStep', () => ({
  default: () => <div>tenant-home-step</div>,
  __esModule: true
}))

import OnboardTenantWizard from '@/views/onboarding/OnboardTenantWizard'

describe('OnboardTenantWizard', () => {
  it('is closed until the open event fires, then shows step 1', () => {
    render(<OnboardTenantWizard />)
    expect(screen.queryByText('tenant-home-step')).not.toBeInTheDocument()
    act(() => {
      window.dispatchEvent(new CustomEvent('onboard-tenant:open'))
    })
    expect(screen.getByText('tenant-home-step')).toBeInTheDocument()
    expect(screen.getByText(/onboard a tenant/i)).toBeInTheDocument()
  })
})

describe('OnboardTenantWizard — regression coverage', () => {
  const realisticResult = {
    ids: { occupantId: 'occ1', propertyId: 'p1', unitId: 'u1', unitNo: '100' },
    rent: 1500,
    moveInDate: '2026-07-20',
    occupantName: 'Test Tenant'
  }

  it('shows the confirm-close guard once an occupant has been created, and "Leave" closes the wizard', async () => {
    vi.resetModules()

    vi.doMock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
    vi.doMock('@/lib/api/storage', () => ({ getStoredTenantId: () => 't1' }))
    vi.doMock('@/views/onboarding/steps/TenantHomeStep', () => ({
      default: ({ onComplete }: any) => (
        <button onClick={() => onComplete(realisticResult)}>complete-home-step</button>
      ),
      __esModule: true
    }))
    vi.doMock('@/views/onboarding/steps/LeaseTermsStep', () => ({
      default: () => <div>lease-terms-step</div>,
      __esModule: true
    }))

    const { default: Wizard } = await import('@/views/onboarding/OnboardTenantWizard')

    render(<Wizard />)
    act(() => {
      window.dispatchEvent(new CustomEvent('onboard-tenant:open'))
    })

    // Occupant is created via the (mocked) home step's onComplete callback.
    fireEvent.click(screen.getByText('complete-home-step'))

    // Now trigger the dialog close — since an occupant exists, it should ask for confirmation.
    fireEvent.click(screen.getByLabelText('close onboarding'))
    expect(screen.getByText(/leave onboarding\?/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /leave/i }))
    expect(screen.queryByText(/onboard a tenant/i)).not.toBeInTheDocument()
  })

  it('threads the carried context into step 2 (Lease terms) after the home step completes', async () => {
    vi.resetModules()

    vi.doMock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
    vi.doMock('@/lib/api/storage', () => ({ getStoredTenantId: () => 't1' }))
    vi.doMock('@/views/onboarding/steps/TenantHomeStep', () => ({
      default: ({ onComplete }: any) => (
        <button onClick={() => onComplete(realisticResult)}>complete-home-step</button>
      ),
      __esModule: true
    }))
    vi.doMock('@/views/onboarding/steps/LeaseTermsStep', () => ({
      default: ({ defaultRent }: any) => <div>lease-terms-step: {defaultRent}</div>,
      __esModule: true
    }))
    vi.doMock('@/views/onboarding/steps/MoveInStep', () => ({
      default: () => <div>move-in-step</div>,
      __esModule: true
    }))

    const { default: Wizard } = await import('@/views/onboarding/OnboardTenantWizard')

    render(<Wizard />)
    act(() => {
      window.dispatchEvent(new CustomEvent('onboard-tenant:open'))
    })

    fireEvent.click(screen.getByText('complete-home-step'))

    // Step advanced away from step 0 (home step is gone) and into step 1 (Lease terms),
    // with the carried rent (1500) threaded through as `defaultRent`.
    expect(screen.queryByText('complete-home-step')).not.toBeInTheDocument()
    expect(screen.getByText(/lease-terms-step/)).toBeInTheDocument()
    expect(screen.getByText('1500', { exact: false })).toBeInTheDocument()
  })
})
