import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/api/inspections', () => ({
  inspectionsApi: {
    getById: vi.fn()
  }
}))

import ViewInspectionDialog from '@/views/properties/view/ViewInspectionDialog'
import { inspectionsApi } from '@/lib/api/inspections'
import type { InspectionResponse } from '@/types/inspection'

const baseResponse: InspectionResponse = {
  id: 'insp-1', unitId: 'unit-1', propertyId: 'prop-1', unitNo: 'A1', propertyName: 'Sunset',
  type: 'MOVE_IN', status: 'COMPLETED', inspectionDate: '2026-07-12', inspectorName: 'Kwame',
  inspectorNotes: null, tenantAcknowledgement: null, signedOffDate: null, pdfUrl: null,
  items: [], createdAt: '2026-07-12T00:00:00Z', updatedAt: null,
  electricityMeterId: null, electricityMeterNumber: null, electricityReading: null,
  waterMeterId: null, waterMeterNumber: null, waterReading: null
}

describe('ViewInspectionDialog — meter readings display', () => {
  it('shows readings when present', async () => {
    vi.mocked(inspectionsApi.getById).mockResolvedValue({
      ...baseResponse,
      electricityMeterNumber: 'ELEC-001', electricityReading: 4213.5,
      waterMeterNumber: 'WATER-001', waterReading: 102
    })

    render(<ViewInspectionDialog open inspectionId='insp-1' onClose={() => {}} />)

    expect(await screen.findByText(/4213\.5/)).toBeInTheDocument()
    expect(screen.getByText(/ELEC-001/)).toBeInTheDocument()
    expect(screen.getByText(/102/)).toBeInTheDocument()
    expect(screen.getByText(/WATER-001/)).toBeInTheDocument()
  })

  it('shows nothing when no readings are present', async () => {
    vi.mocked(inspectionsApi.getById).mockResolvedValue(baseResponse)

    render(<ViewInspectionDialog open inspectionId='insp-1' onClose={() => {}} />)

    await screen.findByText('Sunset') // wait for data to load
    expect(screen.queryByText(/Electricity/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Water Reading/)).not.toBeInTheDocument()
  })
})
