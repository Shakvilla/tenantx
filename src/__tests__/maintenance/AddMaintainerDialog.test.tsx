import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import type * as MaintenanceApi from '@/lib/api/maintenance'

vi.mock('@/lib/api/maintenance', async importOriginal => {
  const actual = await importOriginal<typeof MaintenanceApi>()

  return { ...actual, createMaintainer: vi.fn(), updateMaintainer: vi.fn() }
})

import { createMaintainer, updateMaintainer } from '@/lib/api/maintenance'
import AddMaintainerDialog from '@/views/maintenance/maintainers/AddMaintainerDialog'

const marketplaceToggle = () => screen.getByRole('checkbox', { name: /list in the maintainer marketplace/i })
const submit = () => fireEvent.click(screen.getByRole('button', { name: /^(add|save|update)/i }))

function renderDialog(props: Partial<Parameters<typeof AddMaintainerDialog>[0]> = {}) {
  render(
    <AddMaintainerDialog open handleClose={vi.fn()} onSuccess={vi.fn()} mode='add' {...props} />
  )
}

/** Fills only what validation requires, so each test can assert on one field. */
function fillRequired() {
  // Anchored — /name/i also matches "Company Name".
  fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'Kofi Plumbing' } })
}

describe('AddMaintainerDialog — marketplace opt-in', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createMaintainer).mockResolvedValue({} as never)
    vi.mocked(updateMaintainer).mockResolvedValue({} as never)
  })

  it('defaults to off, so a plain create never publishes a contractor', async () => {
    // Listing exposes a third party's name and phone to occupants of every
    // landlord on the platform. It must be an act, not a default.
    renderDialog()
    expect(marketplaceToggle()).not.toBeChecked()

    fillRequired()
    submit()

    await waitFor(() => expect(createMaintainer).toHaveBeenCalled())
    expect(vi.mocked(createMaintainer).mock.calls[0][0]).toMatchObject({ listedInMarketplace: false })
  })

  it('sends the opt-in on create when the landlord turns it on', async () => {
    renderDialog()
    fillRequired()
    fireEvent.click(marketplaceToggle())
    submit()

    await waitFor(() => expect(createMaintainer).toHaveBeenCalled())
    expect(vi.mocked(createMaintainer).mock.calls[0][0]).toMatchObject({ listedInMarketplace: true })
  })

  it('hydrates from an already-listed maintainer in edit mode', async () => {
    renderDialog({
      mode: 'edit',
      editData: { id: 'm-1', name: 'Kofi Plumbing', listedInMarketplace: true } as never
    })

    await waitFor(() => expect(marketplaceToggle()).toBeChecked())
  })

  it('sends the withdrawal on update when the landlord turns it off', async () => {
    renderDialog({
      mode: 'edit',
      editData: { id: 'm-1', name: 'Kofi Plumbing', listedInMarketplace: true } as never
    })

    await waitFor(() => expect(marketplaceToggle()).toBeChecked())
    fireEvent.click(marketplaceToggle())
    submit()

    await waitFor(() => expect(updateMaintainer).toHaveBeenCalled())
    expect(vi.mocked(updateMaintainer).mock.calls[0][1]).toMatchObject({ listedInMarketplace: false })
  })

  it('sends a lowercase status, matching what the marketplace filters on', async () => {
    // The status dropdown used to send 'ACTIVE'. The marketplace compared
    // against 'active', so every maintainer added from this dialog was opted
    // in, active, and invisible. The backend normalises now; this pins the
    // dialog so it stops being the source of the mismatch.
    renderDialog({
      mode: 'edit',
      editData: { id: 'm-1', name: 'Kofi Plumbing', status: 'inactive' } as never
    })

    // Pick Active from the dropdown, so what is asserted is the option's own
    // value rather than whatever editData happened to hydrate.
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /status/i }))
    fireEvent.click(screen.getByRole('option', { name: 'Active' }))

    submit()

    await waitFor(() => expect(updateMaintainer).toHaveBeenCalled())
    expect(vi.mocked(updateMaintainer).mock.calls[0][1].status).toBe('active')
  })
})
