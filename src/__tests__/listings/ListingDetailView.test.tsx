import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ListingDetailView from '@/views/listings/ListingDetailView'
import { makeListing } from './fixtures'

describe('ListingDetailView', () => {
  it('renders title, address and availability pill', () => {
    render(<ListingDetailView listing={makeListing()} allListings={[]} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Unit 110 — Sunrise Apartments')
    // Address renders in both the title row and the LocationMap section further down the page.
    expect(screen.getAllByText('East Legon, Accra, Greater Accra').length).toBeGreaterThan(0)
    expect(screen.getByText('Available')).toBeInTheDocument()
  })

  it('renders amenities section and map iframe', () => {
    render(<ListingDetailView listing={makeListing()} allListings={[]} />)
    expect(screen.getByText('What this place offers')).toBeInTheDocument()
    expect(screen.getByText("Where you'll be")).toBeInTheDocument()
    expect(screen.getByTitle('Map of Sunrise Apartments')).toBeInTheDocument()
  })

  it('renders share and save actions in the title row', () => {
    render(<ListingDetailView listing={makeListing()} allListings={[]} />)
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('renders similar listings when matches exist', () => {
    const other = makeListing({ id: 'other', propertyAddress: 'Adjiringanor, Accra', propertyName: 'Palm Court' })
    render(<ListingDetailView listing={makeListing()} allListings={[makeListing(), other]} />)
    expect(screen.getByText('More homes you might like')).toBeInTheDocument()
  })

  it('shows the unavailable state for inactive listings and hides booking CTAs', () => {
    render(<ListingDetailView listing={makeListing({ status: 'INACTIVE' })} allListings={[]} />)
    expect(screen.getByText('This unit is no longer available for rent.')).toBeInTheDocument()
    // Rendered once for the desktop sidebar and once for the mobile-only card (responsive
    // visibility is CSS-driven and not evaluated in this jsdom/happy-dom test environment).
    expect(screen.getAllByText('Unit unavailable').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /request a viewing/i })).not.toBeInTheDocument()
  })

  it('works without allListings (prop optional)', () => {
    render(<ListingDetailView listing={makeListing()} />)
    expect(screen.queryByText('More homes you might like')).not.toBeInTheDocument()
  })
})
