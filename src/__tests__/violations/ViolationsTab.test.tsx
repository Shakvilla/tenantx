import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/lib/api/violations', () => ({
  violationsApi: {
    create: vi.fn(),
    listByOccupant: vi.fn(),
    warn: vi.fn(),
    assessFine: vi.fn(),
    setFineStatus: vi.fn(),
    resolve: vi.fn(),
    escalate: vi.fn(),
    delete: vi.fn(),
  },
}))

import ViolationsTab from '@/views/occupants/view/ViolationsTab'
import { violationsApi } from '@/lib/api/violations'

const openViolation = {
  id: 'v-1', occupantId: 'occ-1', category: 'NOISE', severity: 'MEDIUM',
  title: 'Loud music', status: 'OPEN', fineAmount: null, fineStatus: 'NONE',
  reportedAt: '2026-07-14T00:00:00Z',
}

describe('ViolationsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(violationsApi.listByOccupant).mockResolvedValue([])
    vi.mocked(violationsApi.create).mockResolvedValue({ ...openViolation } as any)
    vi.mocked(violationsApi.warn).mockResolvedValue({ ...openViolation, status: 'WARNING_ISSUED', warningIssuedAt: '2026-07-14T01:00:00Z' } as any)
  })

  it('logs a violation with the chosen category and title', async () => {
    render(<ViolationsTab occupantId='occ-1' />)

    await screen.findByText(/no violations recorded/i)
    fireEvent.click(screen.getByRole('button', { name: /log violation/i }))

    fireEvent.change(await screen.findByLabelText(/title/i), { target: { value: 'Loud music' } })
    fireEvent.click(screen.getAllByRole('button', { name: /log violation/i }).pop()!)

    await waitFor(() => expect(violationsApi.create).toHaveBeenCalled())
    const [payload] = vi.mocked(violationsApi.create).mock.calls[0]
    expect(payload.occupantId).toBe('occ-1')
    expect(payload.category).toBe('NOISE')
    expect(payload.title).toBe('Loud music')
  })

  it('issues a warning and reflects the new status', async () => {
    vi.mocked(violationsApi.listByOccupant).mockResolvedValue([{ ...openViolation }] as any)
    render(<ViolationsTab occupantId='occ-1' />)

    const warnBtn = await screen.findByRole('button', { name: /warn/i })
    fireEvent.click(warnBtn)

    await waitFor(() => expect(violationsApi.warn).toHaveBeenCalledWith('v-1'))
    await screen.findByText(/warning issued/i)
  })
})
