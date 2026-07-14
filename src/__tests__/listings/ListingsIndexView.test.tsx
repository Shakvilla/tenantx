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
    expect(screen.getAllByText('East Legon, Accra').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ahodwo, Kumasi').length).toBeGreaterThan(0)
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
    expect(screen.getAllByText('East Legon, Accra').length).toBeGreaterThan(0)
  })

  it('shows the no-listings empty state when the API returned nothing', () => {
    render(<ListingsIndexView listings={[]} />)
    expect(screen.getByText('No listings yet')).toBeInTheDocument()
  })

  const cityListings = [
    makeListing({ id: 'ad1', propertyAddress: 'Adenta, Accra, Greater Accra', propertyName: 'Adenta One', rent: 1000 }),
    makeListing({ id: 'ad2', propertyAddress: 'Adenta, Accra, Greater Accra', propertyName: 'Adenta Two', rent: 1200 }),
    makeListing({ id: 'ac1', propertyAddress: 'Accra, Accra, Greater Accra', propertyName: 'Central One', rent: 2000 }),
    makeListing({ id: 'tm1', propertyAddress: 'Tamale, Tamale, Northern', propertyName: 'Tamale One', rent: 800, bedrooms: 1 }),
  ]

  it('unfiltered: segments the feed into ranked city sections with the exact heading pattern', () => {
    render(<ListingsIndexView listings={cityListings} />)
    const sections = screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)
    expect(sections).toContain('Explore by city')
    // Ranked: Adenta (2) before the two 1-listing cities (alphabetical tie-break)
    const cityHeadings = sections.filter(t => t?.startsWith('Homes available in'))
    expect(cityHeadings).toEqual([
      'Homes available in Adenta, Accra - Ghana',
      'Homes available in Accra - Ghana',
      'Homes available in Tamale - Ghana',
    ])
  })

  it('unfiltered: explore strip links to the city routes', () => {
    render(<ListingsIndexView listings={cityListings} />)
    const strip = screen.getByRole('region', { name: 'Explore by city' })
    expect(strip.querySelector('a[href="/listings/city/adenta-accra"]')).toBeTruthy()
  })

  it('picking a location collapses to a flat filtered grid', () => {
    render(<ListingsIndexView listings={cityListings} />)
    fireEvent.change(screen.getByLabelText('Filter by location'), { target: { value: 'tamale' } })
    expect(screen.queryByText('Explore by city')).not.toBeInTheDocument()
    expect(screen.queryByText('Homes available in Adenta, Accra - Ghana')).not.toBeInTheDocument()
    expect(screen.getByText(/Tamale One/)).toBeInTheDocument()
    expect(screen.queryByText(/Adenta One/)).not.toBeInTheDocument()
  })

  it('any other filter also collapses the segmented view', () => {
    render(<ListingsIndexView listings={cityListings} />)
    fireEvent.click(screen.getByRole('button', { name: '1 bed' }))
    expect(screen.queryByText('Explore by city')).not.toBeInTheDocument()
    expect(screen.getByText(/Tamale One/)).toBeInTheDocument()
  })

  it('clear-all restores the segmented view and resets the location filter', () => {
    render(<ListingsIndexView listings={cityListings} />)
    fireEvent.change(screen.getByLabelText('Filter by location'), { target: { value: 'tamale' } })
    fireEvent.click(screen.getByText('Clear all'))
    expect(screen.getByText('Explore by city')).toBeInTheDocument()
    expect(screen.getByLabelText('Filter by location')).toHaveValue('')
  })

  it('falls back to the flat grid when only unparseable addresses exist', () => {
    render(<ListingsIndexView listings={[makeListing({ id: 'x', propertyAddress: '', propertyName: 'Mystery Home' })]} />)
    expect(screen.queryByText('Explore by city')).not.toBeInTheDocument()
    expect(screen.getByText(/Mystery Home/)).toBeInTheDocument()
  })

  describe('cityScope (dedicated city page)', () => {
    it('renders the scoped heading, breadcrumb, and only that city\'s listings', () => {
      render(<ListingsIndexView listings={cityListings} cityScope={{ slug: 'adenta-accra', label: 'Adenta, Accra' }} />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Homes available in Adenta, Accra - Ghana')
      expect(screen.getByRole('link', { name: /All listings/ })).toHaveAttribute('href', '/listings')
      expect(screen.getByText(/Adenta One/)).toBeInTheDocument()
      expect(screen.queryByText(/Tamale One/)).not.toBeInTheDocument()
      expect(screen.queryByText('Explore by city')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Filter by location')).not.toBeInTheDocument()
    })

    it('filters still work within the scope', () => {
      render(<ListingsIndexView listings={cityListings} cityScope={{ slug: 'adenta-accra', label: 'Adenta, Accra' }} />)
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Adenta Two' } })
      expect(screen.getByText(/Adenta Two/)).toBeInTheDocument()
      expect(screen.queryByText(/Adenta One/)).not.toBeInTheDocument()
    })

    it('shows the city-specific empty state when the city has no ACTIVE homes', () => {
      const inactive = [makeListing({ id: 'ad1', propertyAddress: 'Adenta, Accra, Greater Accra', status: 'INACTIVE' })]
      render(<ListingsIndexView listings={inactive} cityScope={{ slug: 'adenta-accra', label: 'Adenta, Accra' }} />)
      expect(screen.getByText('No homes currently available in Adenta, Accra.')).toBeInTheDocument()
    })
  })
})
