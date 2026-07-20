import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/lib/api/agreements', () => ({
  updateAgreementStatus: vi.fn().mockResolvedValue({ id: 'agr1', status: 'ACTIVE' })
}))

import MoveInStep from '@/views/onboarding/steps/MoveInStep'
import { updateAgreementStatus } from '@/lib/api/agreements'

describe('MoveInStep', () => {
  beforeEach(() => vi.clearAllMocks())

  it('activates the agreement when "activate now" is selected (the default)', async () => {
    const onFinish = vi.fn()

    render(<MoveInStep agreementId='agr1' occupantName='Kwabena Owusu' unitNo='100' onFinish={onFinish} />)
    fireEvent.click(screen.getByRole('button', { name: /finish/i }))
    await waitFor(() => expect(updateAgreementStatus).toHaveBeenCalledWith('agr1', 'ACTIVE'))
    expect(onFinish).toHaveBeenCalledWith(true)
  })

  it('does not activate when "keep pending" is selected', async () => {
    const onFinish = vi.fn()

    render(<MoveInStep agreementId='agr1' occupantName='Kwabena Owusu' unitNo='100' onFinish={onFinish} />)
    fireEvent.click(screen.getByRole('radio', { name: /keep.*pending/i }))
    fireEvent.click(screen.getByRole('button', { name: /finish/i }))
    await waitFor(() => expect(onFinish).toHaveBeenCalledWith(false))
    expect(updateAgreementStatus).not.toHaveBeenCalled()
  })
})
