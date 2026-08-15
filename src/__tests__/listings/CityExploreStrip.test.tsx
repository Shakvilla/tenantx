import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  describe('carousel arrows', () => {
    afterEach(() => vi.restoreAllMocks())

    it('renders both scroll arrows, disabled when nothing overflows', () => {
      render(<CityExploreStrip groups={groups} />)
      // happy-dom has no layout: scrollWidth === clientWidth === 0 → no room to scroll
      expect(screen.getByRole('button', { name: 'Scroll cities left' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Scroll cities right' })).toBeDisabled()
    })

    it('pages the track right and left when the arrows are clicked', () => {
      // Simulate an overflowing track: 300px viewport over 1000px of cards
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300)
      vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(1000)
      const scrollBy = vi.fn()
      HTMLElement.prototype.scrollBy = scrollBy

      render(<CityExploreStrip groups={groups} />)
      const right = screen.getByRole('button', { name: 'Scroll cities right' })
      expect(right).toBeEnabled()
      fireEvent.click(right)
      expect(scrollBy).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' })

      // After "scrolling" into the middle, the left arrow enables too
      const track = document.querySelector('[data-city-track]') as HTMLElement
      vi.spyOn(HTMLElement.prototype, 'scrollLeft', 'get').mockReturnValue(400)
      fireEvent.scroll(track)
      const left = screen.getByRole('button', { name: 'Scroll cities left' })
      expect(left).toBeEnabled()
      fireEvent.click(left)
      expect(scrollBy).toHaveBeenLastCalledWith({ left: -240, behavior: 'smooth' })
    })
  })
})
