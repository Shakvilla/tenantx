import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

/**
 * Feedback while a page is loading.
 *
 * Pressing a menu item produced nothing at all until the destination painted,
 * so on a slow connection people press it again and conclude the menu needs two
 * presses. What this pins is that the pending state turns on for a real in-app
 * link, turns off once the route actually changes, and stays off for the cases
 * that are not navigations — modified clicks, external links, and the page you
 * are already on.
 */

let pathname = '/dashboard'

vi.mock('next/navigation', () => ({ usePathname: () => pathname }))

import useRouteChangePending from '@/hooks/useRouteChangePending'

const Probe = () => <span data-testid='state'>{useRouteChangePending() ? 'pending' : 'idle'}</span>

const state = () => screen.getByTestId('state').textContent

const clickAnchor = (href: string, init: MouseEventInit = {}) => {
  const a = document.createElement('a')

  a.setAttribute('href', href)
  document.body.appendChild(a)
  act(() => {
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0, ...init }))
  })
}

describe('useRouteChangePending', () => {
  beforeEach(() => {
    pathname = '/dashboard'
    window.history.replaceState({}, '', '/dashboard')
  })

  it('goes pending on an in-app link and clears when the route changes', () => {
    const { rerender } = render(<Probe />)

    expect(state()).toBe('idle')

    clickAnchor('/reports')
    expect(state()).toBe('pending')

    // The destination rendered.
    pathname = '/reports'
    act(() => { rerender(<Probe />) })
    expect(state()).toBe('idle')
  })

  it('ignores clicks that are not in-app navigations', () => {
    render(<Probe />)

    clickAnchor('https://example.com')          // leaves the app
    expect(state()).toBe('idle')

    clickAnchor('/dashboard')                    // already here
    expect(state()).toBe('idle')

    clickAnchor('/reports', { metaKey: true })   // opens a new tab
    expect(state()).toBe('idle')
  })

  it('gives up rather than spinning forever if the navigation never lands', () => {
    vi.useFakeTimers()

    try {
      render(<Probe />)
      clickAnchor('/reports')
      expect(state()).toBe('pending')

      act(() => { vi.advanceTimersByTime(15_000) })
      expect(state()).toBe('idle')
    } finally {
      vi.useRealTimers()
    }
  })
})
