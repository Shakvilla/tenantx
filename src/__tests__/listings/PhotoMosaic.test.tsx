import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
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

  it('clicking the photo counter does not close the lightbox', () => {
    render(<PhotoMosaic images={images} title='Test home' />)
    fireEvent.click(screen.getByRole('button', { name: /show all photos/i }))
    fireEvent.click(screen.getByText('1 / 6'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('locks body scroll while the lightbox is open and restores it on close', () => {
    render(<PhotoMosaic images={images} title='Test home' />)
    fireEvent.click(screen.getByRole('button', { name: /show all photos/i }))
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.body.style.overflow).toBe('')
  })

  it('moves focus into the dialog on open and restores it to the trigger on close', () => {
    render(<PhotoMosaic images={images} title='Test home' />)
    const trigger = screen.getByRole('button', { name: /show all photos/i })
    trigger.focus()
    fireEvent.click(trigger)
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.activeElement).toBe(trigger)
  })

  it('traps Tab focus within the dialog, wrapping at both ends', () => {
    render(<PhotoMosaic images={images} title='Test home' />)
    fireEvent.click(screen.getByRole('button', { name: /show all photos/i }))
    const dialog = screen.getByRole('dialog')
    const buttons = within(dialog).getAllByRole('button')
    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    last.focus()
    fireEvent.keyDown(window, { key: 'Tab' })
    expect(document.activeElement).toBe(first)
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })

  it('single image renders full-width without the Show all button', () => {
    render(<PhotoMosaic images={['/only.jpg']} title='Test home' />)
    expect(screen.getAllByRole('img')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /show all photos/i })).not.toBeInTheDocument()
  })
})
