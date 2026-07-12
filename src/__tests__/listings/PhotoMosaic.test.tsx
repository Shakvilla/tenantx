import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PhotoMosaic from '@/views/listings/components/PhotoMosaic'

const images = ['/a.jpg', '/b.jpg', '/c.jpg', '/d.jpg', '/e.jpg', '/f.jpg']

describe('PhotoMosaic', () => {
  it('renders a no-photos placeholder for empty images', () => {
    render(<PhotoMosaic images={[]} title='Test home' />)
    expect(screen.getByText('No photos available')).toBeInTheDocument()
  })

  it('shows at most 5 tiles plus a Show all photos button', () => {
    render(<PhotoMosaic images={images} title='Test home' />)
    expect(screen.getAllByRole('img')).toHaveLength(5)
    expect(screen.getByRole('button', { name: /show all photos/i })).toBeInTheDocument()
  })

  it('opens the lightbox from the Show all button and closes with Escape', () => {
    render(<PhotoMosaic images={images} title='Test home' />)
    fireEvent.click(screen.getByRole('button', { name: /show all photos/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('1 / 6')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('arrow keys navigate with wrap-around', () => {
    render(<PhotoMosaic images={images} title='Test home' />)
    fireEvent.click(screen.getByRole('button', { name: /show all photos/i }))
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('6 / 6')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('1 / 6')).toBeInTheDocument()
  })

  it('single image renders full-width without the Show all button', () => {
    render(<PhotoMosaic images={['/only.jpg']} title='Test home' />)
    expect(screen.getAllByRole('img')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /show all photos/i })).not.toBeInTheDocument()
  })
})
