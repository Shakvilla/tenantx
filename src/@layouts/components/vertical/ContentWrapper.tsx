'use client'

// React Imports
import type { ReactNode } from 'react'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledContentWrapper from '@layouts/styles/vertical/StyledContentWrapper'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import classnames from 'classnames'

type ContentWrapperProps = {
  children: ReactNode
}

const ContentWrapper = ({ children }: ContentWrapperProps) => {
  const { width, isCollapsed, collapsedWidth, isBreakpointReached } = useVerticalNav()

  // Calculate the effective sidebar width — use collapsedWidth when collapsed (and not at mobile breakpoint)
  const sidebarWidth = isCollapsed ? collapsedWidth : width

  return (
    <StyledContentWrapper
      sidebarWidth={isBreakpointReached ? 0 : sidebarWidth}
      className={classnames(verticalLayoutClasses.contentWrapper, 'flex flex-col min-is-0 is-full')}
    >
      {children}
    </StyledContentWrapper>
  )
}

export default ContentWrapper
