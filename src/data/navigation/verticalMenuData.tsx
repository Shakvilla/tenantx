// React Imports
import React from 'react'

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
 *
 * Items with `requiredFeature` show a plan badge (Basic / Pro) when that feature
 * is not included in the tenant's current subscription. Badge injection happens
 * in VerticalMenu.tsx which reads from the SubscriptionContext.
 */

interface NavItem extends VerticalMenuDataType {
  allowedUserTypes?: string[]
  requiredFeature?: string
  children?: NavItem[]
}

/** Maps feature key → nav badge shown when the feature is locked */
export const FEATURE_PLAN_BADGE: Record<string, { label: string; color: 'info' | 'warning' }> = {
  // Basic features → blue badge
  COMMUNICATION:            { label: 'Basic', color: 'info' },
  EXPENSES:                 { label: 'Basic', color: 'info' },
  RENT_REVIEWS:             { label: 'Basic', color: 'info' },
  MAINTENANCE_CONTRACTORS:  { label: 'Basic', color: 'info' },
  PREVENTATIVE_MAINTENANCE: { label: 'Basic', color: 'info' },
  SMS_REMINDERS:            { label: 'Basic', color: 'info' },
  ADVANCED_REPORTS:         { label: 'Basic', color: 'info' },
  // Pro features → gold badge
  LANDLORD_WALLET:          { label: 'Pro', color: 'warning' },
  UTILITIES_MANAGEMENT:     { label: 'Pro', color: 'warning' },
  RENT_COLLECTION:          { label: 'Pro', color: 'warning' },
  AGENT_MANAGEMENT:         { label: 'Pro', color: 'warning' },
}

const allItems: NavItem[] = [
  // ── Always visible ────────────────────────────────────────────
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'ri-dashboard-line'
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: 'ri-notification-2-line'
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
      { label: 'All invoices', href: '/billing/invoices' },
      { label: 'My Payments', href: '/billing/payments', icon: 'ri-money-dollar-circle-line', allowedUserTypes: ['OCCUPANT'] } as NavItem
    ]
  },
  {
    label: 'Documents',
    href: '/documents',
    icon: 'ri-file-text-line'
  },
  {
    label: 'Agreement',
    href: '/agreement',
    icon: 'ri-album-line'
  },

  // ── PRO ───────────────────────────────────────────────────────
  {
    label: 'Wallet',
    href: '/wallet',
    icon: 'ri-wallet-3-line',
    requiredFeature: 'LANDLORD_WALLET'
  },

  // ── BASIC ─────────────────────────────────────────────────────
  {
    label: 'Expenses',
    icon: 'ri-money-dollar-circle-line',
    requiredFeature: 'EXPENSES',
    children: [
      { label: 'All Expenses', href: '/expenses' },
      { label: 'Expense Config', href: '/expenses/config' }
    ]
  },
  {
    label: 'Communication',
    href: '/communication',
    icon: 'ri-message-3-line',
    requiredFeature: 'COMMUNICATION'
  },
  {
    label: 'Maintenance',
    icon: 'ri-tools-line',
    children: [
      { label: 'Categories', href: '/maintenance/categories' },
      { label: 'Maintainers', href: '/maintenance/maintainers', requiredFeature: 'MAINTENANCE_CONTRACTORS' },
      { label: 'Maintenance Request', href: '/maintenance/requests' },
      { label: 'Preventative Schedules', href: '/maintenance/preventative-schedules', requiredFeature: 'PREVENTATIVE_MAINTENANCE' }
    ]
  },

  // ── PRO ───────────────────────────────────────────────────────
  {
    label: 'Utilities',
    href: '/utilities',
    icon: 'ri-plug-line',
    requiredFeature: 'UTILITIES_MANAGEMENT'
  },

  // ── BASIC ─────────────────────────────────────────────────────
  {
    label: 'Rent Reviews',
    href: '/rent-reviews',
    icon: 'ri-percent-line',
    requiredFeature: 'RENT_REVIEWS'
  },

  // BASIC is the minimum to see any report tab — tab-level gates handle the rest
  {
    label: 'Reports',
    href: '/reports',
    icon: 'ri-file-chart-line',
    requiredFeature: 'ADVANCED_REPORTS'
  },

  {
    label: 'Subscription Plans',
    href: '/subscription-plans',
    icon: 'ri-vip-crown-line',
    allowedUserTypes: ['LANDLORD', 'STAFF']
  },
  {
    label: 'Support',
    href: '/support',
    icon: 'ri-customer-service-2-line'
  },

  // ── OCCUPANT only ─────────────────────────────────────────────
  {
    label: 'Inspections',
    href: '/inspections',
    icon: 'ri-survey-line',
    allowedUserTypes: ['OCCUPANT']
  },

  // ── LANDLORD only ─────────────────────────────────────────────
  {
    label: 'Settings',
    icon: 'ri-settings-3-line',
    allowedUserTypes: ['LANDLORD'],
    children: [
      { label: 'Notification settings', href: '/settings/notification', requiredFeature: 'SMS_REMINDERS' },
      { label: 'Company Settings',      href: '/settings/company' },
      { label: 'Recurring Invoice Settings', href: '/settings/recurring-invoice' },
      { label: 'Payment Settings',      href: '/settings/payment', requiredFeature: 'RENT_COLLECTION' },
      { label: 'Security',              href: '/settings/security' }
    ]
  }
]

/**
 * Returns nav items filtered for the given userType, with plan-badge suffixes
 * injected on items whose feature the tenant's subscription doesn't include.
 *
 * @param userType - from AuthContext (LANDLORD | STAFF | OCCUPANT | MAINTAINER)
 * @param features - from SubscriptionContext e.g. { COMMUNICATION: true, LANDLORD_WALLET: false, ... }
 */
const verticalMenuData = (
  userType?: string,
  features: Record<string, boolean> = {}
): VerticalMenuDataType[] => {
  const role = userType || 'LANDLORD'

  const process = (items: NavItem[]): VerticalMenuDataType[] =>
    items
      .filter(item => !item.allowedUserTypes || item.allowedUserTypes.includes(role))
      .map(({ allowedUserTypes: _a, requiredFeature, children, ...item }) => {
        const locked = !!requiredFeature && !features[requiredFeature]
        const badge  = requiredFeature ? FEATURE_PLAN_BADGE[requiredFeature] : undefined

        return {
          ...item,
          // Inject lock icon prefix + plan badge chip when the feature is locked
          ...(locked && badge
            ? {
                prefix: <i className='ri-lock-line' style={{ fontSize: '0.85rem', opacity: 0.45 }} />,
                suffix: {
                  label:   badge.label,
                  color:   badge.color,
                  size:    'small',
                  variant: 'tonal',
                } as any
              }
            : {}),
          // Recurse into children
          ...(children ? { children: process(children as NavItem[]) } : {})
        }
      })

  return process(allItems)
}

export default verticalMenuData
