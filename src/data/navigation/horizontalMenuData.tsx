// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'

const horizontalMenuData = (): HorizontalMenuDataType[] => [
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
    href: '/occupants',
    icon: 'ri-group-line'
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
    label: 'Reports',
    href: '/reports',
    icon: 'ri-file-chart-line'
  },
  {
    label: 'Agreement',
    href: '/agreement',
    icon: 'ri-file-contract-line'
  },
  {
    label: 'Subscription Plans',
    href: '/subscription-plans',
    icon: 'ri-vip-crown-line'
  },
  {
    label: 'Settings',
    icon: 'ri-settings-3-line',
    children: [
      {
        label: 'Payment settings',
        href: '/settings/payment'
      },
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

export default horizontalMenuData
