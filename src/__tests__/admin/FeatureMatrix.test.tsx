import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import FeatureMatrix from '@/views/admin/plans/FeatureMatrix'
import type { GrantableFeature } from '@/lib/api/subscription-plans-admin'

const feature = (key: string): GrantableFeature => ({
  key,
  label: key.replaceAll('_', ' '),
  note: null
})

describe('FeatureMatrix', () => {
  it('offers only the keys the API accepts', () => {
    render(
      <FeatureMatrix value={['EXPENSES']} available={[feature('EXPENSES'), feature('ADVANCE_RENT')]} onChange={vi.fn()} />
    )

    expect(screen.getByRole('checkbox', { name: /EXPENSES/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /ADVANCE_RENT/ })).not.toBeChecked()

    // The server refuses a non-ANNOTATION key with a 422, so offering one here
    // would be a checkbox that cannot be saved.
    expect(screen.queryByRole('checkbox', { name: /SMS_REMINDERS/ })).not.toBeInTheDocument()
  })

  it('explains why some capabilities are absent rather than silently omitting them', () => {
    render(<FeatureMatrix value={[]} available={[feature('EXPENSES')]} onChange={vi.fn()} />)

    expect(screen.getByText(/governed elsewhere/i)).toBeInTheDocument()
  })

  it('adds a key when checked and removes it when unchecked', () => {
    const onChange = vi.fn()

    render(
      <FeatureMatrix value={['EXPENSES']} available={[feature('EXPENSES'), feature('ADVANCE_RENT')]} onChange={onChange} />
    )

    fireEvent.click(screen.getByRole('checkbox', { name: /ADVANCE_RENT/ }))
    expect(onChange).toHaveBeenCalledWith(['EXPENSES', 'ADVANCE_RENT'])

    onChange.mockClear()
    fireEvent.click(screen.getByRole('checkbox', { name: /EXPENSES/ }))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
