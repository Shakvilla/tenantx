import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

/**
 * Adding a compound one room at a time.
 *
 * A Ghanaian compound house is eight rooms that are identical except for their
 * number — same type, same rent, same size. The dialog used to reset to blank
 * defaults on every open, so eight rooms meant choosing the type and typing the
 * rent eight times, and closing and reopening the dialog in between: roughly
 * fifty-five actions for one small compound. Landlords with forty units do not
 * do that twice.
 *
 * What this pins:
 *   - with "Add another room" ticked, saving keeps the dialog open and carries
 *     the shared details forward, clearing only the unit number;
 *   - with it unticked, the dialog closes exactly as it always did.
 */

vi.mock('@/lib/api/storage', () => ({ getStoredTenantId: () => 'tenant-1' }))

vi.mock('@/lib/api/units', () => ({
  createUnit: vi.fn(),
  updateUnit: vi.fn()
}))

vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({
    // The context now also carries what the platform allows; single-currency by
    // default, which is what these tests assume.
    policy: { multiCurrencyEnabled: false, baseCurrency: 'GHS' },
    ref: {
      unitTypes: [
        { value: 'single_room', label: 'Single Room' },
        { value: '1br', label: '1 Bedroom' }
      ],
      rentFrequencies: [{ value: 'monthly', label: 'Monthly' }],
      unitStatuses: [{ value: 'available', label: 'Available' }],
      amenities: []
    }
  })
}))

import AddUnitDialog from '@/views/properties/view/AddUnitDialog'
import { createUnit } from '@/lib/api/units'

const fillRoom = (unitNo: string, rent?: string) => {
  fireEvent.change(screen.getByLabelText(/unit number/i), { target: { value: unitNo } })

  if (rent !== undefined) {
    fireEvent.change(screen.getByLabelText(/^Rent \(GHS\)/), { target: { value: rent } })
  }
}

describe('AddUnitDialog — adding several rooms in a row', () => {
  beforeEach(() => {
    // mockReset in vitest.config wipes factory implementations, so set it here.
    vi.mocked(createUnit).mockResolvedValue({ success: true, data: { id: 'u1' } } as any)
  })

  it('keeps the dialog open and carries the rent forward when "add another" is ticked', async () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()

    render(<AddUnitDialog open onClose={onClose} propertyId='p1' onSuccess={onSuccess} />)

    fillRoom('Room 1', '600')
    fireEvent.click(screen.getByRole('checkbox', { name: /add another room/i }))
    fireEvent.click(screen.getByRole('button', { name: /^add unit$/i }))

    await waitFor(() => expect(createUnit).toHaveBeenCalledTimes(1))

    // It says what just happened — the dialog staying put must not read as "nothing happened".
    expect(await screen.findByText(/Room 1 added/i)).toBeTruthy()
    expect(onClose).not.toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalledTimes(1)

    // Unit number cleared, rent kept.
    expect((screen.getByLabelText(/unit number/i) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/^Rent \(GHS\)/) as HTMLInputElement).value).toBe('600')

    // The second room therefore costs one field, not the whole form.
    fillRoom('Room 2')
    fireEvent.click(screen.getByRole('button', { name: /^add unit$/i }))

    await waitFor(() => expect(createUnit).toHaveBeenCalledTimes(2))

    const second = vi.mocked(createUnit).mock.calls[1][2] as any

    expect(second.unitNo).toBe('Room 2')
    expect(Number(second.rent)).toBe(600)
  })

  it('closes on save when "add another" is left unticked, as before', async () => {
    const onClose = vi.fn()

    render(<AddUnitDialog open onClose={onClose} propertyId='p1' onSuccess={vi.fn()} />)

    fillRoom('Room 1', '600')
    fireEvent.click(screen.getByRole('button', { name: /^add unit$/i }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(/Room 1 added/i)).toBeNull()
  })
})
