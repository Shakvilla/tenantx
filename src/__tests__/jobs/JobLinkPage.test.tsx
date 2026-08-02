import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import type * as DirectJobsClient from '@/lib/api/direct-jobs-public-client'

vi.mock('@/lib/api/direct-jobs-public-client', async importOriginal => {
  const actual = await importOriginal<typeof DirectJobsClient>()

  return {
    ...actual,
    getJob: vi.fn(),
    acceptJob: vi.fn(),
    declineJob: vi.fn()
  }
})

import { getJob, acceptJob, declineJob, DirectJobRequestError } from '@/lib/api/direct-jobs-public-client'
import JobLinkPage from '@/views/jobs/JobLinkPage'

const TOKEN = 'aRhR0IlZECvVwD6TtrHsm3tsrTA5lPtL-9r8wEmE_X0'

const sentJob = {
  category: 'Plumbing',
  description: 'Leaking tap under the sink',
  preferredTiming: 'Weekday mornings',
  city: 'Accra',
  region: 'Greater Accra',
  status: 'SENT' as const
}

describe('JobLinkPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the job details and both action buttons for a SENT job', async () => {
    vi.mocked(getJob).mockResolvedValue(sentJob)

    render(<JobLinkPage token={TOKEN} />)

    await waitFor(() => expect(screen.getByText('Leaking tap under the sink')).toBeInTheDocument())
    expect(screen.getByText('Weekday mornings')).toBeInTheDocument()
    expect(screen.getByText('Accra')).toBeInTheDocument()
    expect(screen.getByText('Greater Accra')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument()
  })

  it('shows the invalid-link copy for a 404 and renders no action buttons', async () => {
    vi.mocked(getJob).mockRejectedValue(
      new DirectJobRequestError(404, 'This job request link is no longer valid', 'JOB_REQUEST_NOT_FOUND')
    )

    render(<JobLinkPage token={TOKEN} />)

    await waitFor(() =>
      expect(screen.getByText('This job request link is no longer valid.')).toBeInTheDocument()
    )
    expect(screen.getByText('It may have already been answered, or it may have expired.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /decline/i })).not.toBeInTheDocument()
  })

  it('renders the answered state with no buttons for a non-SENT status', async () => {
    vi.mocked(getJob).mockResolvedValue({ ...sentJob, status: 'ACCEPTED' })

    render(<JobLinkPage token={TOKEN} />)

    await waitFor(() => expect(screen.getByText(/tenant will be in touch/i)).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /decline/i })).not.toBeInTheDocument()
  })

  it('accepts the job with a single call and shows the accepted copy', async () => {
    vi.mocked(getJob).mockResolvedValue(sentJob)
    vi.mocked(acceptJob).mockResolvedValue({ ...sentJob, status: 'ACCEPTED' })

    render(<JobLinkPage token={TOKEN} />)

    await waitFor(() => expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /accept/i }))

    await waitFor(() =>
      expect(screen.getByText(/thanks — the tenant has been told you accepted/i)).toBeInTheDocument()
    )
    expect(screen.getByText(/arrange the work/i)).toBeInTheDocument()
    expect(acceptJob).toHaveBeenCalledTimes(1)
    expect(acceptJob).toHaveBeenCalledWith(TOKEN)
  })

  it('posts a typed decline reason, and posts no reason key when the field is left empty', async () => {
    vi.mocked(getJob).mockResolvedValue(sentJob)
    vi.mocked(declineJob).mockResolvedValue({ ...sentJob, status: 'DECLINED' })

    const { unmount } = render(<JobLinkPage token={TOKEN} />)

    await waitFor(() => expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Fully booked this week' } })
    fireEvent.click(screen.getByRole('button', { name: /decline/i }))

    await waitFor(() => expect(declineJob).toHaveBeenCalledTimes(1))
    expect(declineJob).toHaveBeenCalledWith(TOKEN, 'Fully booked this week')
    unmount()

    vi.clearAllMocks()
    vi.mocked(getJob).mockResolvedValue(sentJob)
    vi.mocked(declineJob).mockResolvedValue({ ...sentJob, status: 'DECLINED' })

    render(<JobLinkPage token={TOKEN} />)
    await waitFor(() => expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /decline/i }))

    await waitFor(() => expect(declineJob).toHaveBeenCalledTimes(1))
    expect(declineJob).toHaveBeenCalledWith(TOKEN, undefined)
  })

  it('never renders the token anywhere on the page, even though the description legitimately names the tenant', async () => {
    vi.mocked(getJob).mockResolvedValue({
      ...sentJob,
      description: 'Ask for Ama at 12 Nii Bonne Street'
    })

    render(<JobLinkPage token={TOKEN} />)

    await waitFor(() => expect(screen.getByText(/ask for ama/i)).toBeInTheDocument())

    // The description's name/address IS part of the API response and should render.
    expect(screen.getByText('Ask for Ama at 12 Nii Bonne Street')).toBeInTheDocument()

    // But the token itself — which is not part of DirectJobDto.PublicView — must
    // never appear anywhere in the rendered page or in the document title.
    expect(document.body.textContent).not.toContain(TOKEN)
    expect(document.title).not.toContain(TOKEN)
  })
})
