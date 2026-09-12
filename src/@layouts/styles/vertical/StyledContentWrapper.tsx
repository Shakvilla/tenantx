'use client'

// Third-party Imports
import styled from '@emotion/styled'

// Util Imports
import { commonLayoutClasses, verticalLayoutClasses } from '@layouts/utils/layoutClasses'

type StyledContentWrapperProps = {
  sidebarWidth?: number
}

const StyledContentWrapper = styled.div<StyledContentWrapperProps>`
  ${({ sidebarWidth }) =>
    sidebarWidth &&
    `
    margin-inline-start: ${sidebarWidth}px;
    transition: margin-inline-start 250ms ease-in-out;
  `}

  &:has(.${verticalLayoutClasses.content}>.${commonLayoutClasses.contentHeightFixed}) {
    max-block-size: 100dvh;
  }
`

export default StyledContentWrapper
