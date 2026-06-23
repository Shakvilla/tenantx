// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'

/**
 * Landlord-side vertical navigation.
 *
 * `userType` comes from the backend UserType enum: LANDLORD | STAFF | MAINTAINER | OCCUPANT
 * - LANDLORD: sees all items including Settings
 * - STAFF:    sees all items EXCEPT Settings (cannot change company/payment config)
 * - Others:   same as STAFF for safety (OCCUPANT + MAINTAINER belong on the mobile app)
 *
 * Items without `allowedUserTypes` are visible to everyone.
 * Items WITH `allowedUserTypes` are only shown to users whose userType is in that list.
 */

interface NavItem extends VerticalMenuDataType {
  allowedUserTypes?: string[]
  children?: NavItem[]
}

const allItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'ri-dashboard-line'
  },
  {
    label: 'Properties',
    icon: 'ri-building-line',
    children: [
      { label: 'All Properties', href: '/properties' },
      { label: 'All Unit', href: '/properties/units' }
    ]
  },
  {
    label: 'Occupants',
    icon: 'ri-group-line',
    children: [
      { label: 'All Occupants', href: '/occupants' },
      { label: 'Occupant History', href: '/occupants/history' }
    ]
  },
  {
    label: 'Billing Center',
    icon: 'ri-bill-line',
    children: [
      { label: 'All invoices', href: '/billing/invoices' }
    ]
  },
  {
    label: 'Wallet',
    href: '/wallet',
    icon: 'ri-wallet-3-line'
  },
  {
    label: 'Expenses',
    icon: 'ri-money-dollar-circle-line',
    children: [
      { label: 'All Expenses', href: '/expenses' },
      { label: 'Expense Config', href: '/expenses/config' }
    ]
  },
  {
    label: 'Documents',
    href: '/documents',
    icon: 'ri-file-text-line'
  },
  {
    label: 'Communication',
    href: '/communication',
    icon: 'ri-message-3-line'
  },
  {
    label: 'Maintenance',
    icon: 'ri-tools-line',
    children: [
      { label: 'Categories', href: '/maintenance/categories' },
      { label: 'Maintainers', href: '/maintenance/maintainers' },
      { label: 'Maintenance Request', href: '/maintenance/requests' },
      { label: 'Preventative Schedules', href: '/maintenance/preventative-schedules' }
    ]
  },
  {
    label: 'Utilities',
    href: '/utilities',
    icon: 'ri-plug-line'
  },
  {
    label: 'Rent Reviews',
    href: '/rent-reviews',
    icon: 'ri-percent-line'
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: 'ri-file-chart-line'
  },
  {
    label: 'Agreement',
    href: '/agreement',
    icon: 'ri-album-line'
  },
  // ── Settings — LANDLORD only ───────────────────────────────────────────────
  {
    label: 'Settings',
    icon: 'ri-settings-3-line',
    allowedUserTypes: ['LANDLORD'],
    children: [
      { label: 'Notification settings', href: '/settings/notification' },
      { label: 'Company Settings', href: '/settings/company' },
      { label: 'Recurring Invoice Settings', href: '/settings/recurring-invoice' },
      { label: 'Payment Settings', href: '/settings/payment' }
    ]
  }
]

/**
 * Returns the nav items filtered for the given userType.
 * Pass '' or undefined if userType is not yet known (defaults to showing everything).
 */
const verticalMenuData = (userType?: string): VerticalMenuDataType[] => {
  if (!userType || userType === 'LANDLORD') {
    // Landlords (and unknown/default) see everything
    return allItems.map(({ allowedUserTypes: _a, ...item }) => item) as VerticalMenuDataType[]
  }

  // Other roles: filter out items restricted to specific userTypes
  return allItems
    .filter(item => !item.allowedUserTypes || item.allowedUserTypes.includes(userType))
    .map(({ allowedUserTypes: _a, ...item }) => item) as VerticalMenuDataType[]
}

export default verticalMenuData
