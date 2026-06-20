// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'

const verticalMenuData = (): VerticalMenuDataType[] => [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'ri-dashboard-line'
  },
  {
    label: 'Properties',
    icon: 'ri-building-line',
    children: [
      {
        label: 'All Properties',
        href: '/properties'
      },
      {
        label: 'All Unit',
        href: '/properties/units'
      }
    ]
  },
  {
    label: 'Occupants',
    icon: 'ri-group-line',
    children: [
      {
        label: 'All Occupants',
        href: '/occupants'
      },
      {
        label: 'Occupant History',
        href: '/occupants/history'
      }
    ]
  },
  {
    label: 'Billing Center',
    icon: 'ri-bill-line',
    children: [
      {
        label: 'All invoices',
        href: '/billing/invoices'
      }
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
      {
        label: 'All Expenses',
        href: '/expenses'
      },
      {
        label: 'Expense Config',
        href: '/expenses/config'
      }
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
      {
        label: 'Categories',
        href: '/maintenance/categories'
      },
      {
        label: 'Maintainers',
        href: '/maintenance/maintainers'
      },
      {
        label: 'Maintenance Request',
        href: '/maintenance/requests'
      },
      {
        label: 'Preventative Schedules',
        href: '/maintenance/preventative-schedules'
      }
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
  // NOTE: Subscription Plans is a platform-admin page — removed from landlord nav.
  // TODO: Re-add to the system admin panel when that is built.
  {
    label: 'Settings',
    icon: 'ri-settings-3-line',
    children: [
      {
        label: 'Notification settings',
        href: '/settings/notification'
      },
      {
        label: 'Company Settings',
        href: '/settings/company'
      },
      {
        label: 'Recurring Invoice Settings',
        href: '/settings/recurring-invoice'
      }
    ]
  }
]

export default verticalMenuData
