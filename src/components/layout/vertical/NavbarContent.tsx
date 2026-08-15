'use client'

// Third-party Imports
import classnames from 'classnames'

// MUI Imports
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'

// Type Imports
import type { ShortcutsType } from '@components/layout/shared/ShortcutsDropdown'

// Component Imports
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

  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex flex-col is-full relative')}>
      {isRefreshing && (
        <LinearProgress 
          className='absolute block-start-0 inline-start-0 is-full' 
          sx={{ height: 2, zIndex: 1000 }}
        />
      )}
      <div className='flex items-center justify-between gap-4 is-full bs-full'>
        <div className='flex items-center gap-4'>
          <NavToggle />
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <NavSearch />
          </Box>
        </div>
        <div className='flex items-center gap-2'>
          <CreateButton />
          <ShortcutsDropdown shortcuts={shortcuts} />
          <ModeDropdown />
          <NotificationsDropdown />
          <UserDropdown />
        </div>
      </div>
    </div>
  )
}

export default NavbarContent
