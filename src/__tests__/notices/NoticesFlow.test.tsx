import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/lib/api/notices', () => ({
  noticesApi: {
    issue: vi.fn(),
    listByOccupant: vi.fn(),
    listMine: vi.fn(),
    acknowledge: vi.fn(),
  },
}))

import NoticesTab from '@/views/occupants/view/NoticesTab'
import OccupantNoticesView from '@/views/notices/OccupantNoticesView'
import { noticesApi } from '@/lib/api/notices'

describe('NoticesTab — issue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(noticesApi.listByOccupant).mockResolvedValue([])
    vi.mocked(noticesApi.issue).mockResolvedValue({ id: 'ntc-1', status: 'SENT' } as any)
  })

  it('submits the issue payload with occupant, title, body and default channel', async () => {
    render(<NoticesTab occupantId='occ-1' />)

    // wait for the (empty) history to load, then open the dialog
    await screen.findByText(/no notices yet/i)
    fireEvent.click(screen.getAllByRole('button', { name: /issue notice/i })[0])

    fireEvent.change(await screen.findByLabelText(/title/i), { target: { value: 'Notice to vacate' } })
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Please vacate by month end.' } })

    fireEvent.click(screen.getByRole('button', { name: /send notice/i }))

    await waitFor(() => expect(noticesApi.issue).toHaveBeenCalled())
    const [payload] = vi.mocked(noticesApi.issue).mock.calls[0]
    expect(payload.occupantId).toBe('occ-1')
    expect(payload.type).toBe('GENERAL')
    expect(payload.title).toBe('Notice to vacate')
    expect(payload.body).toBe('Please vacate by month end.')
    expect(payload.deliveryMethods).toContain('IN_APP')
  })

  it('blocks submit when title/body are empty', async () => {
    render(<NoticesTab occupantId='occ-1' />)
    await screen.findByText(/no notices yet/i)
    fireEvent.click(screen.getAllByRole('button', { name: /issue notice/i })[0])

    fireEvent.click(await screen.findByRole('button', { name: /send notice/i }))

    await screen.findAllByText(/required/i)
    expect(noticesApi.issue).not.toHaveBeenCalled()
  })
})

describe('OccupantNoticesView — acknowledge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(noticesApi.listMine).mockResolvedValue([
      { id: 'ntc-1', occupantId: 'occ-1', type: 'TERMINATION', title: 'Notice to vacate',
        deliveryMethod: 'IN_APP', status: 'SENT', sourceType: 'MANUAL', issuedByName: 'K',
        issuedAt: '2026-07-14T00:00:00Z', acknowledgedAt: null },
    ] as any)
    vi.mocked(noticesApi.acknowledge).mockResolvedValue({ id: 'ntc-1', status: 'ACKNOWLEDGED', acknowledgedAt: '2026-07-14T01:00:00Z' } as any)
  })

  it('acknowledges a notice and reflects the new status', async () => {
    render(<OccupantNoticesView />)

    const ackBtn = await screen.findByRole('button', { name: /acknowledge/i })
    fireEvent.click(ackBtn)

    await waitFor(() => expect(noticesApi.acknowledge).toHaveBeenCalledWith('ntc-1'))
    await screen.findByText(/acknowledged/i)
  })
})
