import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ListingsIndexView from '@/views/listings/ListingsIndexView'
import { makeListing } from './fixtures'

beforeEach(() => window.localStorage.clear())

const listings = [
  makeListing({ id: 'a', propertyAddress: 'East Legon, Accra', propertyName: 'Sunrise', bedrooms: 2, rent: 1500 }),
  makeListing({ id: 'b', propertyAddress: 'Ahodwo, Kumasi', propertyName: 'Palm Court', bedrooms: 1, rent: 900 }),
  makeListing({ id: 'c', propertyAddress: 'Tamale Central, Tamale', propertyName: 'Chandiba', bedrooms: 2, rent: 3000, status: 'INACTIVE' }),
]

describe('ListingsIndexView', () => {
  it('renders the page heading', () => {
    render(<ListingsIndexView listings={listings} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Homes available in Ghana')
  })

  it('renders only ACTIVE listings', () => {
    render(<ListingsIndexView listings={listings} />)
    expect(screen.getByText('East Legon, Accra')).toBeInTheDocument()
    expect(screen.getByText('Ahodwo, Kumasi')).toBeInTheDocument()
    expect(screen.queryByText('Tamale Central, Tamale')).not.toBeInTheDocument()
  })

  it('search filters by location text', () => {
    render(<ListingsIndexView listings={listings} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'kumasi' } })
    expect(screen.queryByText('East Legon, Accra')).not.toBeInTheDocument()
    expect(screen.getByText('Ahodwo, Kumasi')).toBeInTheDocument()
  })

  it('bedroom chip filters the grid', () => {
    render(<ListingsIndexView listings={listings} />)
    fireEvent.click(screen.getByRole('button', { name: '1 bed' }))
    expect(screen.queryByText('East Legon, Accra')).not.toBeInTheDocument()
    expect(screen.getByText('Ahodwo, Kumasi')).toBeInTheDocument()
  })

  it('shows the no-exact-matches empty state and clears it', () => {
    render(<ListingsIndexView listings={listings} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz-nowhere' } })
    expect(screen.getByText('No exact matches')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }))
    expect(screen.getByText('East Legon, Accra')).toBeInTheDocument()
  })

  it('shows the no-listings empty state when the API returned nothing', () => {
    render(<ListingsIndexView listings={[]} />)
    expect(screen.getByText('No listings yet')).toBeInTheDocument()
  })
})
