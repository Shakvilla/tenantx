'use client'

// React Imports
import type { ReactNode } from 'react'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

type BannerAreaProps = {
  children: ReactNode
}

/**
 * Wraps the dashboard banners so they respect the fixed sidebar's offset.
 * Without this, banners render full-width and overlap the sidebar.
 */
const BannerArea = ({ children }: BannerAreaProps) => {
  const { width, isCollapsed, collapsedWidth, isBreakpointReached } = useVerticalNav()

  const sidebarWidth = isCollapsed ? collapsedWidth : width
  const offset = isBreakpointReached ? 0 : sidebarWidth

  return (
    <div style={{ marginInlineStart: offset, transition: 'margin-inline-start 250ms ease-in-out' }}>
      {children}
    </div>
  )
}

export default BannerArea
