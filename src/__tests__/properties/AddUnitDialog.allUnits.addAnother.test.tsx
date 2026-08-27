import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

/**
 * The OTHER add-unit dialog.
 *
 * There are two. `views/properties/view/AddUnitDialog` opens from a property's own
 * page and already carries details forward. This one opens from "All Unit" and from
 * the units table, and it additionally asks WHICH property — which made re-picking
 * the same property from the same dropdown the most repeated action of the lot.
 *
 * The first fix went into the other file only, and a landlord adding a compound from
 * "All Unit" still got a blank form every time: twelve interactions per room, eight
 * rooms, nothing remembered in between. Two components, one behaviour — a test per
 * component is the only thing that keeps them honest.
 */

vi.mock('@/lib/api/storage', () => ({ getStoredTenantId: () => 'tenant-1' }))

vi.mock('@/lib/api/units', () => ({
  createUnit: vi.fn(),
  updateUnit: vi.fn(),
  uploadUnitImages: vi.fn()
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

import AddUnitDialog from '@/views/properties/AddUnitDialog'
import { createUnit } from '@/lib/api/units'

const properties = [
  { id: 'p1', name: 'Adenta Compound' },
  { id: 'p2', name: 'Madina Compound' }
] as any

const openDialog = (handleClose = vi.fn()) => {
  render(<AddUnitDialog open handleClose={handleClose} properties={properties} />)

  return handleClose
}

const typeUnitNumber = (value: string) =>
  fireEvent.change(screen.getByPlaceholderText('e.g., Unit 101'), { target: { value } })

describe('AddUnitDialog (All Unit) — adding a compound room by room', () => {
  beforeEach(() => {
    // mockReset in vitest.config wipes factory implementations; set it here.
    vi.mocked(createUnit).mockResolvedValue({ success: true, data: { id: 'u1' } } as any)
  })

  it('defaults status to available, because a room being added has nobody in it', () => {
    openDialog()

    // Status used to start blank and then reject the form with "This field is
    // required" on the one answer that was never in doubt.
    expect(screen.getByText('Available')).toBeTruthy()
  })

  it('keeps the property and the rent when "add another" is ticked', async () => {
    const handleClose = openDialog()

    typeUnitNumber('Room 1')
    fireEvent.change(screen.getByPlaceholderText('e.g., 1200'), { target: { value: '600' } })
    fireEvent.mouseDown(screen.getByLabelText(/property/i))
    fireEvent.click(await screen.findByText('Adenta Compound'))
    fireEvent.click(screen.getByRole('checkbox', { name: /add another room/i }))
    fireEvent.click(screen.getByRole('button', { name: /^add unit$/i }))

    await waitFor(() => expect(createUnit).toHaveBeenCalledTimes(1))

    // Says what happened — the dialog standing still must not read as a failed save.
    expect(await screen.findByText(/Room 1 added/i)).toBeTruthy()
    expect(handleClose).not.toHaveBeenCalled()

    // Only the number is cleared.
    expect((screen.getByPlaceholderText('e.g., Unit 101') as HTMLInputElement).value).toBe('')
    expect((screen.getByPlaceholderText('e.g., 1200') as HTMLInputElement).value).toBe('600')

    // So the second room costs one field, and lands on the same property.
    typeUnitNumber('Room 2')
    fireEvent.click(screen.getByRole('button', { name: /^add unit$/i }))

    await waitFor(() => expect(createUnit).toHaveBeenCalledTimes(2))

    const [, propertyId, payload] = vi.mocked(createUnit).mock.calls[1] as any

    expect(propertyId).toBe('p1')
    expect(payload.unitNo).toBe('Room 2')
    expect(Number(payload.rent)).toBe(600)
  })

  it('closes on save when "add another" is left unticked, as before', async () => {
    const handleClose = openDialog()

    typeUnitNumber('Room 1')
    fireEvent.change(screen.getByPlaceholderText('e.g., 1200'), { target: { value: '600' } })
    fireEvent.mouseDown(screen.getByLabelText(/property/i))
    fireEvent.click(await screen.findByText('Adenta Compound'))
    fireEvent.click(screen.getByRole('button', { name: /^add unit$/i }))

    await waitFor(() => expect(handleClose).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(/Room 1 added/i)).toBeNull()
  })
})
