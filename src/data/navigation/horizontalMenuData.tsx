// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'

const horizontalMenuData = (): HorizontalMenuDataType[] => [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'ri-dashboard-line'
  },
  {
    label: 'Members',
    icon: 'ri-group-line',
    children: [
      {
        label: 'Add Members',
        href: '/members/add'
      },
      {
        label: 'Customers',
        href: '/members/customers'
      },
      {
        label: 'Agents',
        href: '/members/agents'
      }
    ]
  },
  {
    label: 'Accounts',
    icon: 'ri-wallet-line',
    children: [
      {
        label: 'Add Account',
        href: '/accounts/add'
      }
    ]
  },
  {
    label: 'Transactions',
    icon: 'ri-exchange-line',
    children: [
      {
        label: 'Deposits',
        href: '/transactions/deposits'
      },
      {
        label: 'Withdrawals',
        href: '/transactions/withdrawals'
      }
    ]
  },
  {
    label: 'Expenses',
    icon: 'ri-money-dollar-circle-line',
    children: [
      {
        label: 'All Expenses',
        href: '/expenses/all'
      },
      {
        label: 'Expense Config',
        href: '/expenses/config'
      }
    ]
  },
  {
    label: 'Approvals',
    icon: 'ri-checkbox-circle-line',
    children: [
      {
        label: 'Commissions',
        href: '/approvals/commissions'
      },
      {
        label: 'Received',
        href: '/approvals/received'
      },
      {
        label: 'Withdrawals',
        href: '/approvals/withdrawals'
      }
    ]
  },
  {
    label: 'Reports',
    icon: 'ri-file-chart-line',
    children: [
      {
        label: 'Mobilised Funds',
        href: '/reports/mobilised-funds'
      },
      {
        label: 'Withdrawals',
        href: '/reports/withdrawals'
      },
      {
        label: 'Customer Ranking',
        href: '/reports/customer-ranking'
      },
      {
        label: 'Customer Filter',
        href: '/reports/customer-filter'
      },
      {
        label: 'Income Statement',
        href: '/reports/income-statement'
      },
      {
        label: 'Reconciliation History',
        href: '/reports/reconciliation-history'
      },
      {
        label: 'Trial Balance',
        href: '/reports/trial-balance'
      },
      {
        label: 'Monthly Balance',
        href: '/reports/monthly-balance'
      },
      {
        label: 'Agent Mobilization',
        href: '/reports/agent-mobilization'
      },
      {
        label: 'Customers and Balance Ranking',
        href: '/reports/customers-balance-ranking'
      },
      {
        label: 'Dormant Accounts',
        href: '/reports/dormant-accounts'
      },
      {
        label: 'Agents Commissions',
        href: '/reports/agents-commissions'
      }
    ]
  },
  {
    label: 'Bank Logs',
    icon: 'ri-bank-line',
    children: [
      {
        label: 'All Transactions',
        href: '/bank-logs/all-transactions'
      },
      {
        label: 'Transactions Configs',
        href: '/bank-logs/transactions-configs'
      }
    ]
  },
  {
    label: 'Other Income',
    icon: 'ri-money-cny-circle-line',
    children: [
      {
        label: 'All Transactions',
        href: '/other-income/all-transactions'
      },
      {
        label: 'All Income Configs',
        href: '/other-income/all-income-configs'
      }
    ]
  },
  {
    label: 'SIF',
    icon: 'ri-funds-line',
    children: [
      {
        label: 'All Contribution',
        href: '/sif/all-contribution'
      }
    ]
  },
  {
    label: 'Settings',
    icon: 'ri-settings-3-line',
    children: [
      {
        label: 'Contribution Frequency',
        href: '/settings/contribution-frequency'
      },
      {
        label: 'Expense and Income Config',
        href: '/settings/expense-income-config'
      },
      {
        label: 'User Profile',
        href: '/settings/user-profile'
      },
      {
        label: 'User Registration',
        href: '/settings/user-registration'
      },
      {
        label: 'SMS Configs',
        href: '/settings/sms-configs'
      },
      {
        label: 'Accounts Status',
        href: '/settings/accounts-status'
      },
      {
        label: 'Permission',
        href: '/settings/permission'
      },
      {
        label: 'System Configs',
        href: '/settings/system-configs'
      }
    ]
  }
]

export default horizontalMenuData
