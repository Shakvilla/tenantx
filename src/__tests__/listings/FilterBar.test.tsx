import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FilterBar from '@/views/listings/components/FilterBar'
import SearchPill from '@/views/listings/components/SearchPill'

const baseProps = {
  bedFilter: null,
  onBedFilter: vi.fn(),
  maxPrice: null,
  onMaxPrice: vi.fn(),
  maxRent: 10000,
  sort: 'newest' as const,
  onSort: vi.fn(),
  hasFilters: false,
  onClearAll: vi.fn(),
  brandColour: '#7367F0',
}

describe('FilterBar', () => {
  it('renders all five bedroom chips', () => {
    render(<FilterBar {...baseProps} />)
    for (const label of ['Any type', 'Studio', '1 bed', '2 beds', '3+ beds']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('clicking a chip reports the bedroom value', () => {
    const onBedFilter = vi.fn()
    render(<FilterBar {...baseProps} onBedFilter={onBedFilter} />)
    fireEvent.click(screen.getByRole('button', { name: '2 beds' }))
    expect(onBedFilter).toHaveBeenCalledWith(2)
  })

  it('price chip opens the slider panel', () => {
    render(<FilterBar {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /price/i }))
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('sort select reports changes', () => {
    const onSort = vi.fn()
    render(<FilterBar {...baseProps} onSort={onSort} />)
    fireEvent.change(screen.getByLabelText('Sort listings'), { target: { value: 'price_asc' } })
    expect(onSort).toHaveBeenCalledWith('price_asc')
  })

  it('Clear all appears only when filters are active', () => {
    const { rerender } = render(<FilterBar {...baseProps} />)
    expect(screen.queryByText('Clear all')).not.toBeInTheDocument()
    rerender(<FilterBar {...baseProps} hasFilters={true} />)
    expect(screen.getByText('Clear all')).toBeInTheDocument()
  })
})

describe('SearchPill', () => {
  it('reports typed text', () => {
    const onChange = vi.fn()
    render(<SearchPill value='' onChange={onChange} brandColour='#7367F0' />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'accra' } })
    expect(onChange).toHaveBeenCalledWith('accra')
  })

  it('shows a clear button only when there is text', () => {
    const onChange = vi.fn()
    const { rerender } = render(<SearchPill value='' onChange={onChange} brandColour='#7367F0' />)
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
    rerender(<SearchPill value='accra' onChange={onChange} brandColour='#7367F0' />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onChange).toHaveBeenCalledWith('')
  })
})
