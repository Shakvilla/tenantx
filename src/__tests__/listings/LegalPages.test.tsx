import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LegalPageView from '@/views/listings/LegalPageView'

describe('LegalPageView — terms', () => {
  it('renders the Terms of Service title', () => {
    render(<LegalPageView doc='terms' />)
    expect(screen.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeInTheDocument()
  })

  it('uses the platform name in the body', () => {
    render(<LegalPageView doc='terms' />)
    // Without a branding provider the platform name defaults to TenantX
    expect(screen.getAllByText(/TenantX/).length).toBeGreaterThan(0)
  })

  it('links back to the listings index', () => {
    render(<LegalPageView doc='terms' />)
    expect(screen.getByRole('link', { name: /back to listings/i })).toHaveAttribute('href', '/listings')
  })

  it('shows a last-updated date', () => {
    render(<LegalPageView doc='terms' />)
    expect(screen.getByText(/last updated/i)).toBeInTheDocument()
  })
})

describe('LegalPageView — privacy', () => {
  it('renders the Privacy Policy title', () => {
    render(<LegalPageView doc='privacy' />)
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument()
  })

  it('references the Ghana Data Protection Act', () => {
    render(<LegalPageView doc='privacy' />)
    expect(screen.getAllByText(/Data Protection Act, 2012/).length).toBeGreaterThan(0)
  })

  it('describes the viewing-request data it collects', () => {
    render(<LegalPageView doc='privacy' />)
    expect(screen.getAllByText(/phone number/i).length).toBeGreaterThan(0)
  })
})
