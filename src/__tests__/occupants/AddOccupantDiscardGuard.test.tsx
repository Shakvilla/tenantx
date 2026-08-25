import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

/**
 * Escape must not throw away typing.
 *
 * Pressing Escape inside an open Select correctly closes only the dropdown. A
 * second Escape then closed the whole Add Occupant form and discarded a
 * part-filled record without a word — while the onboarding wizard two screens
 * away confirms before discarding. The same key did opposite things depending
 * on which form you were in, and one of them lost work.
 */

vi.mock('@/lib/api/storage', () => ({ getStoredTenantId: () => 'tenant-1' }))

vi.mock('@/lib/api/occupants', () => ({
  createOccupant: vi.fn(),
  updateOccupant: vi.fn(),
  getOccupantByEmail: vi.fn(async () => null)
}))

vi.mock('@/lib/api/units', () => ({
  getUnitsByProperty: vi.fn(async () => ({ success: true, data: [] }))
}))

import AddOccupantDialog from '@/views/occupants/AddOccupantDialog'

const properties = [{ id: 'p1', name: 'Adenta Compound' }] as any

const openDialog = () =>
  render(<AddOccupantDialog open handleClose={handleClose} properties={properties} />)

let handleClose: ReturnType<typeof vi.fn>

describe('AddOccupantDialog — discarding a part-filled form', () => {
  beforeEach(() => {
    handleClose = vi.fn()
  })

  it('closes straight away when nothing has been typed', async () => {
    openDialog()

    const { default: userEvent } = await import('@testing-library/user-event')

    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }))

    expect(handleClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/discard what you have entered/i)).toBeNull()
  })

  it('asks before throwing away a part-filled form', async () => {
    openDialog()

    const { default: userEvent } = await import('@testing-library/user-event')

    await userEvent.type(screen.getByLabelText(/first name/i), 'Akosua')
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }))

    // Nothing closed yet — the form is still there behind the question.
    expect(await screen.findByText(/discard what you have entered/i)).toBeTruthy()
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('keeps the typing when the landlord says keep editing', async () => {
    openDialog()

    const { default: userEvent } = await import('@testing-library/user-event')

    await userEvent.type(screen.getByLabelText(/first name/i), 'Akosua')
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    await userEvent.click(await screen.findByRole('button', { name: /keep editing/i }))

    expect(handleClose).not.toHaveBeenCalled()
    expect((screen.getByLabelText(/first name/i) as HTMLInputElement).value).toBe('Akosua')
  })

  it('closes once the landlord confirms', async () => {
    openDialog()

    const { default: userEvent } = await import('@testing-library/user-event')

    await userEvent.type(screen.getByLabelText(/first name/i), 'Akosua')
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    await userEvent.click(await screen.findByRole('button', { name: /^discard$/i }))

    await waitFor(() => expect(handleClose).toHaveBeenCalledTimes(1))
  })
})
