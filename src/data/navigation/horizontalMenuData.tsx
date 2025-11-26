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
      },
      {
        label: 'Own Property',
        href: '/properties/own'
      },
      {
        label: 'Lease Property',
        href: '/properties/lease'
      }
    ]
  },
  {
    label: 'Tenants',
    icon: 'ri-group-line',
    children: [
      {
        label: 'All Tenants',
        href: '/tenants/all'
      },
      {
        label: 'Tenant History',
        href: '/tenants/history'
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
      },
      {
        label: 'Recurring Invoice setting',
        href: '/billing/recurring-settings'
      }
    ]
  },
  {
    label: 'Expenses',
    href: '/expenses',
    icon: 'ri-money-dollar-circle-line'
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
        label: 'Maintainers',
        href: '/maintenance/maintainers'
      },
      {
        label: 'Maintenance Request',
        href: '/maintenance/requests'
      }
    ]
  },
  {
    label: 'Report',
    icon: 'ri-file-chart-line',
    children: [
      {
        label: 'Tenants',
        href: '/reports/tenants'
      },
      {
        label: 'Expenses',
        href: '/reports/expenses'
      },
      {
        label: 'Earning',
        href: '/reports/earning'
  },
  {
        label: 'Maintenance',
        href: '/reports/maintenance'
      }
    ]
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
      }
    ]
  }
]

export default horizontalMenuData
