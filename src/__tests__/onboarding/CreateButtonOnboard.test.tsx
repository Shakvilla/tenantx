import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

vi.mock('@core/hooks/useSettings', () => ({ useSettings: () => ({ settings: { skin: 'default' } }) }))
vi.mock('@mui/material/useMediaQuery', () => ({ default: () => false }))

import CreateButton from '@/components/layout/shared/CreateButton'

describe('CreateButton — Onboard a Tenant', () => {
  it('dispatches onboard-tenant:open when the item is clicked', () => {
    const spy = vi.fn()

    window.addEventListener('onboard-tenant:open', spy)
    render(<CreateButton />)
    fireEvent.click(screen.getByRole('button', { name: /create/i }))
    fireEvent.click(screen.getByText(/onboard a tenant/i))
    expect(spy).toHaveBeenCalled()
    window.removeEventListener('onboard-tenant:open', spy)
  })
})
