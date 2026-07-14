import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CityExploreStrip from '@/views/listings/components/CityExploreStrip'
import { groupByCity } from '@/views/listings/lib/city'
import { makeListing } from './fixtures'

const groups = groupByCity([
  makeListing({ id: '1', propertyAddress: 'Adenta, Accra, Greater Accra', images: ['/img/adenta.jpg'] }),
  makeListing({ id: '2', propertyAddress: 'Adenta, Accra, Greater Accra', images: [] }),
  makeListing({ id: '3', propertyAddress: 'Tamale, Tamale, Northern', images: [] }),
])

describe('CityExploreStrip', () => {
  it('renders one card per group, in order, with label, count, and link', () => {
    render(<CityExploreStrip groups={groups} />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', '/listings/city/adenta-accra')
    expect(links[0]).toHaveTextContent('Adenta, Accra')
    expect(links[0]).toHaveTextContent('2 homes')
    expect(links[1]).toHaveAttribute('href', '/listings/city/tamale')
    expect(links[1]).toHaveTextContent('1 home')
  })

  it('uses the first available photo in the group as the card image', () => {
    render(<CityExploreStrip groups={groups} />)
    const imgs = document.querySelectorAll('img')
    expect(imgs).toHaveLength(1) // Tamale group has no photos → no img
    expect(imgs[0]).toHaveAttribute('src', '/img/adenta.jpg')
  })

  it('renders nothing when there are no groups', () => {
    const { container } = render(<CityExploreStrip groups={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
