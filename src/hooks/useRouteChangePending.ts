'use client'

import { useEffect, useRef, useState } from 'react'

import { usePathname } from 'next/navigation'

/**
 * True while a navigation started from a link is still in flight.
 *
 * The App Router gives no pending state for `<Link>` navigations on Next 15.1
 * (`useLinkStatus` arrived in 15.3), and the app rendered nothing at all between
 * the press and the new page painting. On a mid-range phone on mobile data that
 * silence lasts long enough that people press the item a second time and report
 * that "menu items need two presses" — the first press worked, it just never
 * said so.
 *
 * Detection is a capture-phase listener on internal anchors, cleared when the
 * pathname actually changes. A timeout backstops it so a cancelled or blocked
 * navigation can never leave the bar running forever.
 */
const STUCK_AFTER_MS = 15_000

export const useRouteChangePending = (): boolean => {
  const pathname = usePathname()
  const [pending, setPending] = useState(false)

  // Read inside the listener without re-registering it on every route change.
  const pathnameRef = useRef(pathname)

  pathnameRef.current = pathname

  // The destination rendered — whatever we were waiting for is over.
  useEffect(() => {
    setPending(false)
  }, [pathname])

  useEffect(() => {
    if (!pending) return

    const timer = setTimeout(() => setPending(false), STUCK_AFTER_MS)

    return () => clearTimeout(timer)
  }, [pending])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Anything the browser will not handle as a plain in-app navigation:
      // modified clicks open a new tab, and a prevented event is somebody
      // else's to deal with.
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = (event.target as HTMLElement | null)?.closest?.('a') as HTMLAnchorElement | null

      if (!anchor || (anchor.target && anchor.target !== '_self')) return

      const href = anchor.getAttribute('href')

      // Same-page links and anything leaving the app are not route changes.
      if (!href || !href.startsWith('/') || href.startsWith('//')) return
      if (href.split('?')[0].split('#')[0] === pathnameRef.current) return

      setPending(true)
    }

    // Capture, so a handler that stops propagation cannot hide the navigation.
    document.addEventListener('click', onClick, true)

    // Back/forward resolves immediately enough that showing a bar would only flicker.
    const onPopState = () => setPending(false)

    window.addEventListener('popstate', onPopState)

    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  return pending
}

export default useRouteChangePending
