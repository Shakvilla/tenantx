import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

/**
 * "Other (type manually)" has to actually reveal a box to type in.
 *
 * The flag for it was DERIVED from the form — "no config id, but an item name". Choosing Other
 * clears both, which is what choosing it means, so the derived value fell straight back to
 * "nothing selected": the name field never rendered and the dropdown snapped back to "Select an
 * item". Since Expense Item is required and a new landlord has no configured items, that made
 * recording an expense impossible on a fresh account. It was reported on three separate visits,
 * and in between we added helper text pointing landlords at the broken control.
 */

vi.mock('@/lib/api/storage', () => ({ getStoredTenantId: () => 'tenant-1' }))
vi.mock('@/lib/api/properties', () => ({ getProperties: vi.fn(async () => ({ success: true, data: [] })) }))
vi.mock('@/lib/api/units', () => ({ getAllUnits: vi.fn(async () => ({ success: true, data: [] })) }))

vi.mock('@/lib/api/expenses', () => ({
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  getExpenseConfigs: vi.fn()
}))

import AddExpenseDrawer from '@/views/expenses/all-expenses/AddExpenseDrawer'
import { getExpenseConfigs } from '@/lib/api/expenses'

const openDrawer = () =>
  render(<AddExpenseDrawer open handleClose={vi.fn()} onSaved={vi.fn()} />)

/** The Expense Item Select. Looked up by its label id — the text "Expense Item" appears on
 *  more than one node, and with an empty list so does "Other (type manually)". */
const itemSelect = () =>
  screen.getAllByRole('combobox').find(el => el.getAttribute('aria-labelledby') === 'config-label')!

const chooseOther = async () => {
  fireEvent.mouseDown(itemSelect())
  // Scoped to the option: the empty-list helper text names "Other (type manually)" too.
  fireEvent.click(await screen.findByRole('option', { name: /other \(type manually\)/i }))
}

describe('AddExpenseDrawer — "Other (type manually)"', () => {
  beforeEach(() => {
    // A new landlord: no expense items configured, which is the case that was unusable.
    vi.mocked(getExpenseConfigs).mockResolvedValue([] as any)
  })

  it('reveals a name field, and keeps it there while the landlord types', async () => {
    openDrawer()

    await waitFor(() => expect(itemSelect()).toBeTruthy())
    await chooseOther()

    const name = await screen.findByLabelText(/expense name/i)

    fireEvent.change(name, { target: { value: 'Electrical repairs' } })

    // The field survives its own onChange — the derived flag used to drop it on the first
    // keystroke, which is what "I typed and nothing appeared" was.
    expect(await screen.findByLabelText(/expense name/i)).toBeTruthy()
    expect((screen.getByLabelText(/expense name/i) as HTMLInputElement).value).toBe('Electrical repairs')
  })

  it('keeps the dropdown showing Other rather than snapping back', async () => {
    openDrawer()

    await waitFor(() => expect(itemSelect()).toBeTruthy())
    await chooseOther()

    // The Select renders its chosen value into the combobox itself.
    expect(itemSelect().textContent).toMatch(/other/i)
  })

  it('hides the name field again when a configured item is chosen instead', async () => {
    vi.mocked(getExpenseConfigs).mockResolvedValue([
      { id: 'c1', item: 'Plumbing repairs', category: 'MAINTENANCE' }
    ] as any)

    openDrawer()

    await waitFor(() => expect(itemSelect()).toBeTruthy())
    await chooseOther()
    expect(await screen.findByLabelText(/expense name/i)).toBeTruthy()

    fireEvent.mouseDown(itemSelect())
    // The option's accessible name carries the category line too, hence the regex.
    fireEvent.click(await screen.findByRole('option', { name: /Plumbing repairs/ }))

    await waitFor(() => expect(screen.queryByLabelText(/expense name/i)).toBeNull())
  })
})
