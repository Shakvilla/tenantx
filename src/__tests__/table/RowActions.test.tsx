import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

import RowActions from '@/components/table/RowActions'

const opt = (text: string, onClick: () => void) => ({ text, icon: 'ri-eye-line', menuItemProps: { onClick } })

describe('RowActions overflow', () => {
  it('renders actions inline when there are 2 or fewer', () => {
    render(<RowActions options={[opt('View', vi.fn()), opt('Edit', vi.fn())]} />)

    // no overflow trigger present
    expect(screen.queryByLabelText(/more actions/i)).not.toBeInTheDocument()
  })

  it('collapses into a menu when there are more than 2, and fires the hidden action', () => {
    const onUpdate = vi.fn()

    render(
      <RowActions
        options={[opt('View', vi.fn()), opt('Edit', vi.fn()), opt('Update Status', onUpdate), opt('Delete', vi.fn())]}
      />
    )
    const trigger = screen.getByLabelText(/more actions/i)

    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('Update Status'))
    expect(onUpdate).toHaveBeenCalled()
  })
})
