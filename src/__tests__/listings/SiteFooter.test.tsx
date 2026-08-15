import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SiteFooter from '@/views/listings/components/SiteFooter'

describe('SiteFooter', () => {
  it('shows the current year in the copyright line', () => {
    render(<SiteFooter />)
    const year = new Date().getFullYear()
    expect(screen.getByText(new RegExp(`© ${year} Yiliora · Ghana Property Platform`))).toBeInTheDocument()
  })

  it('links to the listings index', () => {
    render(<SiteFooter />)
    expect(screen.getByRole('link', { name: 'Browse all homes' })).toHaveAttribute('href', '/listings')
  })

  it('links to the terms and privacy pages', () => {
    render(<SiteFooter />)
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/listings/terms')
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/listings/privacy')
  })

  it('has a back-to-top button', () => {
    render(<SiteFooter />)
    expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument()
  })

  it('shows the good-to-know trust notes', () => {
    render(<SiteFooter />)
    expect(screen.getByText('Requesting a viewing is free')).toBeInTheDocument()
    expect(screen.getByText('Every listing has a verified property manager')).toBeInTheDocument()
  })

  it('defaults the right note to the GHS pricing line', () => {
    render(<SiteFooter />)
    expect(screen.getByText('All prices in Ghana Cedis (GHS)')).toBeInTheDocument()
  })

  it('accepts a custom right note', () => {
    render(<SiteFooter rightNote='Listing #ABC12345' />)
    expect(screen.getByText('Listing #ABC12345')).toBeInTheDocument()
    expect(screen.queryByText('All prices in Ghana Cedis (GHS)')).not.toBeInTheDocument()
  })
})
