/**
 * Admin navigation menu definition.
 * Each item can require one or more permissions from AdminAuthContext.
 * Items without `permissions` are visible to all authenticated admins.
 */

export interface AdminNavItem {
  label: string
  href: string
  icon: string          // Remix Icon class
  permissions?: string[] // ANY of these permissions shows the item
  children?: AdminNavItem[]
}

export const adminNavItems: AdminNavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: 'ri-dashboard-line',
  },
  {
    label: 'Tenants',
    href: '/admin/tenants',
    icon: 'ri-building-2-line',
    permissions: ['platform:tenants:read'],
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: 'ri-group-line',
    permissions: ['platform:users:read'],
  },
  {
    label: 'System Admins',
    href: '/admin/admins',
    icon: 'ri-shield-user-line',
    permissions: ['platform:admins:read'],
  },
  {
    label: 'Roles & Permissions',
    href: '/admin/roles',
    icon: 'ri-shield-keyhole-line',
    permissions: ['platform:roles:read'],
  },
  {
    label: 'Subscription Plans',
    href: '/admin/subscriptions',
    icon: 'ri-price-tag-3-line',
    permissions: ['platform:plans:read'],
  },
  {
    label: 'Billing',
    href: '/admin/invoices',
    icon: 'ri-file-list-3-line',
    permissions: ['platform:billing:read'],
  },
  {
    label: 'Fee Ledger',
    href: '/admin/fee-ledger',
    icon: 'ri-coins-line',
    permissions: ['platform:billing:read'],
  },
  {
    label: 'Announcements',
    href: '/admin/announcements',
    icon: 'ri-megaphone-line',
    permissions: ['platform:announcements:read'],
  },
  {
    label: 'Messaging',
    href: '/admin/messaging',
    icon: 'ri-message-3-line',
    permissions: ['platform:messaging:read'],
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: 'ri-bar-chart-2-line',
    permissions: ['platform:reports:read'],
  },
  {
    label: 'Support',
    href: '/admin/support',
    icon: 'ri-customer-service-2-line',
    permissions: ['platform:support:read'],
  },
  {
    label: 'System Health',
    href: '/admin/system',
    icon: 'ri-heart-pulse-line',
    permissions: ['platform:health:read'],
  },
  {
    label: 'Platform Settings',
    href: '/admin/platform-settings',
    icon: 'ri-settings-3-line',
    permissions: ['platform:settings:read'],
  },
  {
    label: 'Audit Log',
    href: '/admin/audit-log',
    icon: 'ri-file-shield-2-line',
    permissions: ['platform:audit:read'],
  },
  {
    label: 'My Profile',
    href: '/admin/profile',
    icon: 'ri-user-settings-line',
  },
]
