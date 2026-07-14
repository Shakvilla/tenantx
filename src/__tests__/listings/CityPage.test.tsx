import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { makeListing } from './fixtures'

vi.mock('@/lib/api/listings-public-client', () => ({
  getPublicListings: vi.fn(),
}))

import { getPublicListings } from '@/lib/api/listings-public-client'
import CityListingsPage, { generateMetadata } from '@/app/listings/city/[slug]/page'

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

beforeEach(() => {
  vi.mocked(getPublicListings).mockReset()
  window.localStorage.clear()
})

describe('CityListingsPage', () => {
  it('renders the scoped city view for a known slug', async () => {
    vi.mocked(getPublicListings).mockResolvedValue([
      makeListing({ id: 'a', propertyAddress: 'Adenta, Accra, Greater Accra', propertyName: 'Adenta One' }),
      makeListing({ id: 'b', propertyAddress: 'Tamale, Tamale, Northern', propertyName: 'Tamale One' }),
    ])
    render(await CityListingsPage(params('adenta-accra')))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Homes available in Adenta, Accra - Ghana')
    expect(screen.getByText('Adenta One')).toBeInTheDocument()
    expect(screen.queryByText('Tamale One')).not.toBeInTheDocument()
  })

  it('renders the empty state (not 404) when the city exists but has no ACTIVE homes', async () => {
    vi.mocked(getPublicListings).mockResolvedValue([
      makeListing({ id: 'a', propertyAddress: 'Adenta, Accra, Greater Accra', status: 'INACTIVE' }),
    ])
    render(await CityListingsPage(params('adenta-accra')))
    expect(screen.getByText('No homes currently available in Adenta, Accra.')).toBeInTheDocument()
  })

  it('404s for a slug that never matched any listing', async () => {
    vi.mocked(getPublicListings).mockResolvedValue([
      makeListing({ id: 'a', propertyAddress: 'Adenta, Accra, Greater Accra' }),
    ])
    await expect(CityListingsPage(params('kumasi'))).rejects.toThrow() // notFound() throws
  })

  it('generateMetadata titles the page with the exact heading pattern', async () => {
    vi.mocked(getPublicListings).mockResolvedValue([
      makeListing({ id: 'a', propertyAddress: 'Adenta, Accra, Greater Accra' }),
    ])
    const meta = await generateMetadata(params('adenta-accra'))
    expect(meta.title).toBe('Homes available in Adenta, Accra - Ghana')
  })

  it('generateMetadata falls back gracefully for unknown slugs and API failures', async () => {
    vi.mocked(getPublicListings).mockRejectedValue(new Error('down'))
    const meta = await generateMetadata(params('adenta-accra'))
    expect(meta.title).toBe('Listings')
  })
})
