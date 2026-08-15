import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ListingCard from '@/views/listings/components/ListingCard'
import { makeListing } from './fixtures'

describe('ListingCard', () => {
  it('links to the listing detail page', () => {
    render(<ListingCard listing={makeListing()} saved={false} onToggleSave={() => {}} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/listings/listing-1')
  })

  it('leads with the location line (Airbnb convention)', () => {
    render(<ListingCard listing={makeListing()} saved={false} onToggleSave={() => {}} />)
    expect(screen.getByText('East Legon, Accra, Greater Accra')).toBeInTheDocument()
  })

  it('shows property, beds/baths and monthly price', () => {
    render(<ListingCard listing={makeListing()} saved={false} onToggleSave={() => {}} />)
    expect(screen.getByText(/Sunrise Apartments/)).toBeInTheDocument()
    expect(screen.getByText(/2 beds · 1 bath/)).toBeInTheDocument()
    expect(screen.getByText('GH₵ 1,500')).toBeInTheDocument()
    expect(screen.getByText('/ month')).toBeInTheDocument()
  })

  it('shows the New badge for listings under 15 days old', () => {
    render(<ListingCard listing={makeListing()} saved={false} onToggleSave={() => {}} />)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('hides the New badge for old listings', () => {
    render(
      <ListingCard listing={makeListing({ createdAt: '2025-01-01T00:00:00Z' })} saved={false} onToggleSave={() => {}} />
    )
    expect(screen.queryByText('New')).not.toBeInTheDocument()
  })

  it('save button calls onToggleSave without navigating', () => {
    const onToggle = vi.fn()
    render(<ListingCard listing={makeListing()} saved={false} onToggleSave={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('save button reflects saved state', () => {
    render(<ListingCard listing={makeListing()} saved={true} onToggleSave={() => {}} />)
    expect(screen.getByRole('button', { name: 'Remove from saved' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders a no-photo placeholder when there are no images', () => {
    render(<ListingCard listing={makeListing({ images: [] })} saved={false} onToggleSave={() => {}} />)
    expect(screen.getByText('No photo')).toBeInTheDocument()
  })
})
