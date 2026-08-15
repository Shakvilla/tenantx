import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BookingCard from '@/views/listings/components/BookingCard'
import MobileBookingBar from '@/views/listings/components/MobileBookingBar'
import SimilarListings from '@/views/listings/components/SimilarListings'
import { makeListing } from './fixtures'

describe('BookingCard', () => {
  it('shows price, WhatsApp link and viewing CTA', () => {
    render(<BookingCard listing={makeListing()} primaryColour='#7367F0' onRequestViewing={() => {}} />)
    expect(screen.getByText('GH₵ 1,500')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /whatsapp agent/i })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me/+233244123456')
    )
    expect(screen.getByRole('button', { name: /request a viewing/i })).toBeInTheDocument()
  })

  it('fires onRequestViewing', () => {
    const cb = vi.fn()
    render(<BookingCard listing={makeListing()} primaryColour='#7367F0' onRequestViewing={cb} />)
    fireEvent.click(screen.getByRole('button', { name: /request a viewing/i }))
    expect(cb).toHaveBeenCalledOnce()
  })

  it('omits WhatsApp/call when there is no phone', () => {
    render(
      <BookingCard listing={makeListing({ contactPhone: null })} primaryColour='#7367F0' onRequestViewing={() => {}} />
    )
    expect(screen.queryByRole('link', { name: /whatsapp/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /call agent/i })).not.toBeInTheDocument()
  })
})

describe('MobileBookingBar', () => {
  it('shows the monthly price and CTA', () => {
    const cb = vi.fn()
    render(<MobileBookingBar listing={makeListing()} primaryColour='#7367F0' onRequestViewing={cb} />)
    expect(screen.getByText('GH₵ 1,500')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /request a viewing/i }))
    expect(cb).toHaveBeenCalledOnce()
  })
})

describe('SimilarListings', () => {
  const current = makeListing({ id: 'current', propertyAddress: 'East Legon, Accra' })

  it('renders matched cards under the heading', () => {
    const other = makeListing({ id: 'other', propertyAddress: 'Adjiringanor, Accra', propertyName: 'Palm Court' })
    render(<SimilarListings all={[current, other]} current={current} isSaved={() => false} onToggleSave={() => {}} />)
    expect(screen.getByText('More homes you might like')).toBeInTheDocument()
    expect(screen.getByText('Adjiringanor, Accra')).toBeInTheDocument()
  })

  it('renders nothing when there are no matches', () => {
    const { container } = render(
      <SimilarListings all={[current]} current={current} isSaved={() => false} onToggleSave={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
