import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import TenantHomeStep from '@/views/onboarding/steps/TenantHomeStep'
import { getProperties } from '@/lib/api/properties'
import { getAllUnits } from '@/lib/api/units'
import { createOccupant, getOccupantByEmail } from '@/lib/api/occupants'

vi.mock('@/lib/api/properties')
vi.mock('@/lib/api/units')
vi.mock('@/lib/api/occupants')

const setup = (onExit = vi.fn()) => {
  const onComplete = vi.fn()

  render(<TenantHomeStep tenantId='t1' onComplete={onComplete} onExit={onExit} />)

  return { onComplete, onExit }
}

describe('TenantHomeStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getProperties).mockResolvedValue({ success: true, data: [{ id: 'p1', name: 'Xorla House 2' }] } as any)
    vi.mocked(getAllUnits).mockResolvedValue({ success: true, data: [{ id: 'u1', unitNo: '100', rent: 1500 }] } as any)
    vi.mocked(createOccupant).mockResolvedValue({ id: 'occ1' } as any)
    vi.mocked(getOccupantByEmail).mockResolvedValue(null)
  })

  it('loads vacant units after a property is chosen', async () => {
    setup()
    fireEvent.mouseDown(screen.getByLabelText(/property/i))
    fireEvent.click(await screen.findByText('Xorla House 2'))
    await waitFor(() =>
      expect(getAllUnits).toHaveBeenCalledWith('t1', expect.objectContaining({ propertyId: 'p1', status: 'available' }))
    )
  })

  it('creates the occupant and reports rent + name on continue', async () => {
    const { onComplete } = setup()

    fireEvent.mouseDown(screen.getByLabelText(/property/i))
    fireEvent.click(await screen.findByText('Xorla House 2'))
    fireEvent.mouseDown(await screen.findByLabelText(/unit/i))
    fireEvent.click(await screen.findByText('100'))
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Kwabena' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Owusu' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'k@example.com' } })
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '0244123456' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => expect(createOccupant).toHaveBeenCalled())
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        ids: expect.objectContaining({ occupantId: 'occ1', propertyId: 'p1', unitId: 'u1', unitNo: '100' }),
        rent: 1500,
        occupantName: 'Kwabena Owusu'
      })
    )
  })

  it('shows an add-property message and disables the form when there are no properties', async () => {
    vi.mocked(getProperties).mockResolvedValue({ success: true, data: [] } as any)
    const { onExit } = setup()

    // message appears once properties finish loading
    expect(await screen.findByText(/add a property and a unit/i)).toBeInTheDocument()

    // Continue is disabled and the tenant fields are disabled
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    expect(screen.getByLabelText(/first name/i)).toBeDisabled()

    // the action link exits the wizard to the Add Property page
    fireEvent.click(screen.getByRole('button', { name: /add a property/i }))
    expect(onExit).toHaveBeenCalledWith('/properties?create=1')
  })

  it('shows an add-unit message and disables downstream fields when the property has no available units', async () => {
    vi.mocked(getAllUnits).mockResolvedValue({ success: true, data: [] } as any)
    const { onExit } = setup()

    fireEvent.mouseDown(screen.getByLabelText(/property/i))
    fireEvent.click(await screen.findByText('Xorla House 2'))

    expect(await screen.findByText(/no available units/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    expect(screen.getByLabelText(/first name/i)).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /add a unit/i }))
    expect(onExit).toHaveBeenCalledWith('/properties/units')
  })

  it('reuses an existing occupant instead of creating a duplicate', async () => {
    vi.mocked(getOccupantByEmail).mockResolvedValue({
      id: 'occ-existing',
      firstName: 'Irfan',
      lastName: 'Saha',
      email: 'x@e.com',
      phone: '024',
      unitNo: '99',
      propertyName: 'Xorla House 2',
      status: 'active'
    } as any)

    const { onComplete } = setup()

    fireEvent.mouseDown(screen.getByLabelText(/property/i))
    fireEvent.click(await screen.findByText('Xorla House 2'))
    fireEvent.mouseDown(await screen.findByLabelText(/unit/i))
    fireEvent.click(await screen.findByText('100'))
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Irfan' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Saha' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'x@e.com' } })
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '024' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText(/already an occupant/i)).toBeInTheDocument()
    expect(createOccupant).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /assign to unit 100/i }))

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        ids: expect.objectContaining({ occupantId: 'occ-existing', unitId: 'u1' }),
        occupantName: 'Irfan Saha'
      })
    )
  })

  it("'Use a different email' clears the existing-occupant panel", async () => {
    vi.mocked(getOccupantByEmail).mockResolvedValue({
      id: 'occ-existing',
      firstName: 'Irfan',
      lastName: 'Saha',
      email: 'x@e.com',
      phone: '024',
      unitNo: '99',
      propertyName: 'Xorla House 2',
      status: 'active'
    } as any)

    setup()

    fireEvent.mouseDown(screen.getByLabelText(/property/i))
    fireEvent.click(await screen.findByText('Xorla House 2'))
    fireEvent.mouseDown(await screen.findByLabelText(/unit/i))
    fireEvent.click(await screen.findByText('100'))
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Irfan' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Saha' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'x@e.com' } })
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '024' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText(/already an occupant/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /different email/i }))

    expect(screen.queryByText(/already an occupant/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^continue$/i })).toBeInTheDocument()
  })
})
