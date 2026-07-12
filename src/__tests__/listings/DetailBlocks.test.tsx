import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Highlights from '@/views/listings/components/Highlights'
import LocationMap from '@/views/listings/components/LocationMap'
import InquiryForm from '@/views/listings/components/InquiryForm'
import { makeListing } from './fixtures'

describe('Highlights', () => {
  it('shows availability, bedrooms and amenities rows', () => {
    render(<Highlights listing={makeListing()} />)
    expect(screen.getByText(/Available/)).toBeInTheDocument()
    expect(screen.getByText(/2-bedroom apartment/)).toBeInTheDocument()
    expect(screen.getByText(/3 amenities included/)).toBeInTheDocument()
  })

  it('renders nothing when there is nothing to highlight', () => {
    const bare = makeListing({
      availableFrom: null, bedrooms: null, amenities: [], contactPhone: null,
    })
    const { container } = render(<Highlights listing={bare} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('LocationMap', () => {
  it('embeds a keyless Google Maps iframe for the address', () => {
    render(<LocationMap propertyName='Sunrise Apartments' propertyAddress='East Legon, Accra' />)
    const iframe = screen.getByTitle('Map of Sunrise Apartments')
    expect(iframe).toHaveAttribute('src', expect.stringContaining('output=embed'))
    expect(iframe.getAttribute('src')).toContain(encodeURIComponent('Sunrise Apartments, East Legon, Accra'))
  })

  it('links out to Google Maps', () => {
    render(<LocationMap propertyName='Sunrise Apartments' propertyAddress='East Legon, Accra' />)
    expect(screen.getByRole('link', { name: /open in maps/i })).toHaveAttribute(
      'href',
      expect.stringContaining('google.com/maps/search')
    )
  })
})

describe('InquiryForm', () => {
  it('disables submit until name and phone are filled', () => {
    render(<InquiryForm listing={makeListing()} primaryColour='#7367F0' />)
    const submit = screen.getByRole('button', { name: /request a viewing/i })
    expect(submit).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('Your name *'), { target: { value: 'Ama' } })
    fireEvent.change(screen.getByPlaceholderText('Phone number *'), { target: { value: '0244000000' } })
    expect(submit).toBeEnabled()
  })

  it('prefills the message with the listing title', () => {
    render(<InquiryForm listing={makeListing()} primaryColour='#7367F0' />)
    expect(screen.getByDisplayValue(/Unit 110 — Sunrise Apartments/)).toBeInTheDocument()
  })

  it('shows the error state when the server responds non-2xx', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 500 } as Response)
    render(<InquiryForm listing={makeListing()} primaryColour='#7367F0' />)
    fireEvent.change(screen.getByPlaceholderText('Your name *'), { target: { value: 'Ama' } })
    fireEvent.change(screen.getByPlaceholderText('Phone number *'), { target: { value: '0244000000' } })
    fireEvent.click(screen.getByRole('button', { name: /request a viewing/i }))
    expect(await screen.findByText(/could not send your message/i)).toBeInTheDocument()
    expect(screen.queryByText('Message sent!')).not.toBeInTheDocument()
    fetchMock.mockRestore()
  })

  it('shows the success state when the server responds 2xx', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 201 } as Response)
    render(<InquiryForm listing={makeListing()} primaryColour='#7367F0' />)
    fireEvent.change(screen.getByPlaceholderText('Your name *'), { target: { value: 'Ama' } })
    fireEvent.change(screen.getByPlaceholderText('Phone number *'), { target: { value: '0244000000' } })
    fireEvent.click(screen.getByRole('button', { name: /request a viewing/i }))
    expect(await screen.findByText('Message sent!')).toBeInTheDocument()
    fetchMock.mockRestore()
  })
})
