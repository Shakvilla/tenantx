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
    permissions: ['view_tenants', 'manage_tenants'],
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: 'ri-group-line',
    permissions: ['view_tenants', 'manage_tenants'],
  },
  {
    label: 'System Admins',
    href: '/admin/admins',
    icon: 'ri-shield-user-line',
    permissions: ['manage_admins'],
  },
  {
    label: 'Roles & Permissions',
    href: '/admin/roles',
    icon: 'ri-shield-keyhole-line',
    permissions: ['manage_admins'],
  },
  {
    label: 'Subscription Plans',
    href: '/admin/subscriptions',
    icon: 'ri-price-tag-3-line',
    permissions: ['manage_tenants'],
  },
  {
    label: 'Billing',
    href: '/admin/invoices',
    icon: 'ri-file-list-3-line',
    permissions: ['view_tenants', 'manage_tenants'],
  },
  {
    label: 'Fee Ledger',
    href: '/admin/fee-ledger',
    icon: 'ri-coins-line',
    permissions: ['view_tenants', 'manage_tenants'],
  },
  {
    label: 'Announcements',
    href: '/admin/announcements',
    icon: 'ri-megaphone-line',
    permissions: ['manage_tenants'],
  },
  {
    label: 'Messaging',
    href: '/admin/messaging',
    icon: 'ri-message-3-line',
    permissions: ['manage_tenants'],
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: 'ri-bar-chart-2-line',
    permissions: ['view_tenants', 'manage_tenants'],
  },
  {
    label: 'Support',
    href: '/admin/support',
    icon: 'ri-customer-service-2-line',
    permissions: ['view_tenants', 'manage_tenants'],
  },
  {
    label: 'System Health',
    href: '/admin/system',
    icon: 'ri-heart-pulse-line',
    permissions: ['view_tenants'],
  },
  {
    label: 'Platform Settings',
    href: '/admin/platform-settings',
    icon: 'ri-settings-3-line',
    permissions: ['manage_admins'],
  },
  {
    label: 'Audit Log',
    href: '/admin/audit-log',
    icon: 'ri-file-shield-2-line',
    permissions: ['manage_admins'],
  },
  {
    label: 'My Profile',
    href: '/admin/profile',
    icon: 'ri-user-settings-line',
  },
]
