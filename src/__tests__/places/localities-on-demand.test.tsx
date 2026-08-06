import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import PropertyStep from '@/views/onboarding/steps/PropertyStep'

vi.mock('@/lib/api/reference', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/api/reference')>()),
  getCities: vi.fn(async () => ['Accra', 'Osu', 'Labone'])
}))

vi.mock('@/contexts/ReferenceDataContext', () => ({
  useReferenceData: () => ({
    ref: {
      propertyTypes: [{ value: 'house', label: 'House', description: '' }],
      regions: [
        {
          value: 'greater-accra',
          label: 'Greater Accra',
          districts: [{ value: 'accra-metro', label: 'Accra Metropolitan', region: 'greater-accra' }]
        }
      ]
    },
    getDistricts: (r: string) =>
      r === 'greater-accra' ? [{ value: 'accra-metro', label: 'Accra Metropolitan', region: 'greater-accra' }] : []
  })
}))

import { getCities } from '@/lib/api/reference'

describe('PropertyStep localities', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not fetch localities before a district is chosen', () => {
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)
    expect(getCities).not.toHaveBeenCalled()
  })

  it('fetches the chosen district localities and offers them', async () => {
    render(<PropertyStep tenantId='t1' entityIds={{}} onComplete={vi.fn()} onSkip={vi.fn()} />)

    fireEvent.mouseDown(screen.getByLabelText(/region/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Greater Accra' }))
    fireEvent.mouseDown(screen.getByLabelText(/district/i))
    fireEvent.click(await screen.findByRole('option', { name: 'Accra Metropolitan' }))

    await waitFor(() => expect(getCities).toHaveBeenCalledWith('accra-metro'))
    fireEvent.mouseDown(screen.getByLabelText(/city/i))
    expect(await screen.findByRole('option', { name: 'Osu' })).toBeTruthy()
  })
})
