'use client'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { ShortcutsType } from '@components/layout/shared/ShortcutsDropdown'

// Component Imports
import NavToggle from './NavToggle'
import Logo from '@components/layout/shared/Logo'
import NavSearch from '@components/layout/shared/NavSearch'
import CreateButton from '@components/layout/shared/CreateButton'
import ShortcutsDropdown from '@components/layout/shared/ShortcutsDropdown'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import NotificationsDropdown from '@components/layout/shared/NotificationsDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'

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
  // Hooks
  const { isBreakpointReached } = useHorizontalNav()

  return (
    <div
      className={classnames(horizontalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}
    >
      <div className='flex items-center gap-4'>
        <NavToggle />
        {/* Hide Logo on Smaller screens */}
        {!isBreakpointReached && <Logo />}
        <NavSearch />
      </div>
      <div className='flex items-center gap-2'>
        <CreateButton />
        <ShortcutsDropdown shortcuts={shortcuts} />
        <ModeDropdown />
        <NotificationsDropdown />
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
