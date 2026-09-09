'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import classnames from 'classnames'

// MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'

// Type Imports
import type { ShortcutsType } from '@components/layout/shared/ShortcutsDropdown'

// Component Imports
import useRouteChangePending from '@/hooks/useRouteChangePending'
import NavToggle from './NavToggle'
import NavSearch from '@components/layout/shared/NavSearch'
import CreateButton from '@components/layout/shared/CreateButton'
import ShortcutsDropdown from '@components/layout/shared/ShortcutsDropdown'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import NotificationsDropdown from '@components/layout/shared/NotificationsDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Context Imports
import { useAuth } from '@/contexts/AuthContext'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

// Vars
const shortcuts: ShortcutsType[] = [
  {
    url: '/dashboard',
    icon: 'ri-dashboard-line',
    title: 'Dashboard',
    subtitle: 'Overview'
  },
  {
    url: '/properties',
    icon: 'ri-building-line',
    title: 'Properties',
    subtitle: 'Manage Properties'
  },
  {
    url: '/tenants',
    icon: 'ri-group-line',
    title: 'Tenants',
    subtitle: 'Manage Tenants'
  },
  {
    url: '/billing/invoices',
    icon: 'ri-bill-line',
    title: 'Billing',
    subtitle: 'Invoices'
  },
  {
    url: '/expenses',
    icon: 'ri-money-dollar-circle-line',
    title: 'Expenses',
    subtitle: 'Track Expenses'
  },
  {
    url: '/settings/company',
    icon: 'ri-settings-3-line',
    title: 'Settings',
    subtitle: 'Company Settings'
  }
]

const NavbarContent = () => {
  const { isRefreshing } = useAuth()

  // Pressing a menu item used to produce nothing until the next page painted.
  const navigating = useRouteChangePending()

  // Mobile alternative to the hidden desktop search box: an icon in the navbar
  // that expands a full-width search field underneath the row.
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex flex-col is-full relative')}>
      {(isRefreshing || navigating) && (
        <LinearProgress 
          className='absolute block-start-0 inline-start-0 is-full' 
          sx={{ height: 2, zIndex: 1000 }}
        />
      )}
      <div className='flex items-center justify-between gap-2 sm:gap-4 is-full bs-full'>
        <div className='flex items-center gap-1 sm:gap-3'>
          <NavToggle />
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <NavSearch />
          </Box>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <IconButton
              className='text-textPrimary'
              onClick={() => setMobileSearchOpen(prev => !prev)}
              aria-label={mobileSearchOpen ? 'Close search' : 'Search'}
            >
              <i className={mobileSearchOpen ? 'ri-close-line' : 'ri-search-line'} />
            </IconButton>
          </Box>
        </div>
        <div className='flex items-center gap-1 sm:gap-2'>
          <CreateButton />
          <ShortcutsDropdown shortcuts={shortcuts} />
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <ModeDropdown />
          </Box>
          <NotificationsDropdown />
          <UserDropdown />
        </div>
      </div>
      {mobileSearchOpen && (
        <Box className='pt-2' sx={{ display: { xs: 'block', md: 'none' } }}>
          <NavSearch />
        </Box>
      )}
    </div>
  )
}

export default NavbarContent
