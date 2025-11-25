'use client'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { ShortcutsType } from '@components/layout/shared/ShortcutsDropdown'
import type { NotificationsType } from '@components/layout/shared/NotificationsDropdown'

// Component Imports
import NavToggle from './NavToggle'
import NavSearch from '@components/layout/shared/NavSearch'
import CreateButton from '@components/layout/shared/CreateButton'
import ShortcutsDropdown from '@components/layout/shared/ShortcutsDropdown'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import NotificationsDropdown from '@components/layout/shared/NotificationsDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'

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
    url: '/properties/all',
    icon: 'ri-building-line',
    title: 'Properties',
    subtitle: 'Manage Properties'
  },
  {
    url: '/tenants/all',
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

const notifications: NotificationsType[] = [
  {
    avatarImage: '/images/avatars/2.png',
    title: 'New Maintenance Request',
    subtitle: 'Maintenance request submitted for Room A-101',
    time: '1h ago',
    read: false
  },
  {
    title: 'Payment Received',
    subtitle: 'Payment of €1,200 received from Jordan Stevenson',
    time: '3h ago',
    read: false
  },
  {
    avatarImage: '/images/avatars/3.png',
    title: 'Lease Agreement Signed',
    subtitle: 'New lease agreement signed for Property B-205',
    time: '5h ago',
    read: true
  },
  {
    avatarIcon: 'ri-alert-line',
    avatarColor: 'warning',
    title: 'Overdue Payment',
    subtitle: 'Payment overdue for Room C-301',
    time: '1 day ago',
    read: true
  }
]

const NavbarContent = () => {
  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-4'>
        <NavToggle />
        <NavSearch />
      </div>
      <div className='flex items-center gap-2'>
        <CreateButton />
        <ShortcutsDropdown shortcuts={shortcuts} />
        <ModeDropdown />
        <NotificationsDropdown notifications={notifications} />
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
