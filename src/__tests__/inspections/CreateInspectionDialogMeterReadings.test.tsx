import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/lib/api/inspections', () => ({
  inspectionsApi: {
    create: vi.fn(),
    complete: vi.fn(),
    getByUnit: vi.fn()
  },
  uploadInspectionPhotos: vi.fn()
}))

vi.mock('@/lib/api/storage', () => ({
  getStoredTenantId: vi.fn()
}))

vi.mock('@/lib/api/utilities', () => ({
  utilitiesApi: {
    getMetersByProperty: vi.fn()
  }
}))

import CreateInspectionDialog from '@/views/properties/view/CreateInspectionDialog'
import { inspectionsApi } from '@/lib/api/inspections'
import { getStoredTenantId } from '@/lib/api/storage'
import { utilitiesApi } from '@/lib/api/utilities'

describe('CreateInspectionDialog — meter readings', () => {
  // vitest.config.ts sets `mockReset: true`, which resets mock implementations
  // (including factory-level .mockResolvedValue calls) before every test — even
  // the first one. Re-arm return values here rather than at module-mock time.
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(inspectionsApi.create).mockResolvedValue({ id: 'insp-1' } as any)
    vi.mocked(inspectionsApi.complete).mockResolvedValue({ id: 'insp-1' } as any)
    vi.mocked(inspectionsApi.getByUnit).mockResolvedValue([{ id: 'insp-1' }] as any)
    vi.mocked(getStoredTenantId).mockReturnValue('tenant-1')
    vi.mocked(utilitiesApi.getMetersByProperty).mockResolvedValue([
      { id: 'meter-elec-1', propertyId: 'prop-1', propertyName: null, meterNumber: 'ELEC-001',
        utilityType: 'ELECTRICITY', meterType: 'POSTPAID', paymentResponsibility: 'LANDLORD',
        splitMethod: 'EQUAL', notes: null, unitCount: 1, units: [], createdAt: '2026-01-01', updatedAt: null },
      { id: 'meter-water-1', propertyId: 'prop-1', propertyName: null, meterNumber: 'WATER-001',
        utilityType: 'WATER', meterType: 'POSTPAID', paymentResponsibility: 'LANDLORD',
        splitMethod: 'EQUAL', notes: null, unitCount: 1, units: [], createdAt: '2026-01-01', updatedAt: null }
    ] as any)
  })

  it('includes meter readings in the complete() payload when entered', async () => {
    render(
      <CreateInspectionDialog
        open
        unitId='unit-1'
        propertyId='prop-1'
        unitNo='A1'
        propertyName='Sunset Apartments'
        onClose={() => {}}
        onCreated={() => {}}
      />
    )

    // Step 1 requires Inspector Name before handleNext1 will call create() and advance
    fireEvent.change(screen.getByLabelText(/inspector name/i), { target: { value: 'Kwame Mensah' } })

    // Step 1 → Step 2 (Room Checklist)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => expect(inspectionsApi.create).toHaveBeenCalled())

    // Rate at least one item — Complete Inspection is disabled with zero rated items
    fireEvent.click((await screen.findAllByRole('button', { name: 'Good' }))[0])

    // Step 2 → Step 3 (Finalise)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    await screen.findByText(/meter readings/i)

    fireEvent.change(screen.getByLabelText(/electricity reading/i), { target: { value: '4213.5' } })
    fireEvent.change(screen.getByLabelText(/water reading/i), { target: { value: '102' } })

    fireEvent.click(screen.getByRole('button', { name: /complete/i }))

    await waitFor(() => expect(inspectionsApi.complete).toHaveBeenCalled())
    const [, payload] = vi.mocked(inspectionsApi.complete).mock.calls[0]
    expect(payload.electricityReading).toBe(4213.5)
    expect(payload.waterReading).toBe(102)
  })

  it('submits the selected ROUTINE inspection type in the create() payload', async () => {
    render(
      <CreateInspectionDialog
        open
        unitId='unit-1'
        propertyId='prop-1'
        unitNo='A1'
        propertyName='Sunset Apartments'
        onClose={() => {}}
        onCreated={() => {}}
      />
    )

    // Open the Inspection Type select and pick "Routine"
    fireEvent.mouseDown(screen.getByLabelText(/inspection type/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Routine' }))

    fireEvent.change(screen.getByLabelText(/inspector name/i), { target: { value: 'Kwame Mensah' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    await waitFor(() => expect(inspectionsApi.create).toHaveBeenCalled())
    const [payload] = vi.mocked(inspectionsApi.create).mock.calls[0]
    expect(payload.type).toBe('ROUTINE')
  })
})
