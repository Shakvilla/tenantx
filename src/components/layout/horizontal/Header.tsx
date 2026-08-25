'use client'

// MUI Imports
import LinearProgress from '@mui/material/LinearProgress'

// Context Imports
import { useAuth } from '@/contexts/AuthContext'

// Component Imports
import Navigation from './Navigation'
import NavbarContent from './NavbarContent'
import Navbar from '@layouts/components/horizontal/Navbar'
import LayoutHeader from '@layouts/components/horizontal/Header'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'
import useRouteChangePending from '@/hooks/useRouteChangePending'

const Header = () => {
  // Hooks
  const { isBreakpointReached } = useHorizontalNav()
  const { isRefreshing } = useAuth()

  // Same silence on the horizontal layout — see the vertical navbar.
  const navigating = useRouteChangePending()

  return (
    <div className='relative'>
      {(isRefreshing || navigating) && (
        <LinearProgress 
          className='absolute block-start-0 inline-start-0 is-full' 
          sx={{ height: 2, zIndex: 1000 }}
        />
      )}
      <LayoutHeader>
        <Navbar>
          <NavbarContent />
        </Navbar>
        {!isBreakpointReached && <Navigation />}
      </LayoutHeader>
      {isBreakpointReached && <Navigation />}
    </div>
  )
}

export default Header
