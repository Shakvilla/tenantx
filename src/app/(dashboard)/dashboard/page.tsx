// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import DashboardMetricCard from '@views/dashboards/DashboardMetricCard'
import FinancialMetricCard from '@views/dashboards/FinancialMetricCard'
import RevenueGeneration from '@views/dashboards/RevenueGeneration'
import TopContributors from '@views/dashboards/TopContributors'
import DailyAgentRevenue from '@views/dashboards/DailyAgentRevenue'
import CustomersOverviewCard from '@views/dashboards/CustomersOverviewCard'

const DashboardPage = () => {
  return (
    <Grid container spacing={6}>
      {/* Row 1: Customer breakdown (wider), New customers, Agents */}
      <Grid size={{ xs: 12, sm: 8, md: 6 }}>
        <CustomersOverviewCard
          title='Total Customers'
          summary={{
            total: 33,
            trend: {
              value: 18,
              isPositive: true
            }
          }}
          kpis={[
            {
              label: 'Total Customers',
              value: 33,
              icon: 'ri-group-line',
              iconColor: 'primary'
            },
            {
              label: 'Male Customers',
              value: 21,
              icon: 'ri-user-line',
              iconColor: 'info'
            },
            {
              label: 'Female Customers',
              value: 12,
              icon: 'ri-user-3-line',
              iconColor: 'warning'
            },
            {
              label: 'Active Customers',
              value: 31,
              icon: 'ri-user-check-line',
              iconColor: 'success'
            },
            {
              label: 'Inactive Accounts',
              value: 28,
              icon: 'ri-user-unfollow-line',
              iconColor: 'error'
            }
          ]}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4, md: 3 }}>
        <DashboardMetricCard
          title='New Customers'
          stats={[
            { label: 'View Customers created Today', value: 0 },
            { label: "Customers Birthday", value: 0 }
          ]}
          icon='ri-user-add-line'
          iconColor='success'
          actionButton={{
            label: 'View Customers created Today'
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 4, md: 3 }}>
        <DashboardMetricCard
          title='Agents'
          stats={[
            { label: 'Number of Agents', value: 14 }
          ]}
          icon='ri-user-star-line'
          iconColor='warning'
        />
      </Grid>

      {/* Row 2: Daily financials (4 columns) */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FinancialMetricCard title='Revenue Collected Today' amount={0} icon='ri-money-dollar-circle-line' iconColor='success' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FinancialMetricCard title="Withdrawals Made Today" amount={90} icon='ri-arrow-down-circle-line' iconColor='error' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FinancialMetricCard title="Today's Balance" amount={-90} icon='ri-wallet-line' iconColor='info' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FinancialMetricCard title='Total Commission Generated' amount={110} icon='ri-percent-line' iconColor='warning' />
      </Grid>

      {/* Row 3: Monthly financials (4 columns) */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FinancialMetricCard title='Total Transactions This Month' amount={48.5} icon='ri-exchange-line' iconColor='primary' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FinancialMetricCard title='Total Withdrawals This Month' amount={95} icon='ri-arrow-down-circle-line' iconColor='error' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FinancialMetricCard title='Total Balance Available This Month' amount={-46.5} icon='ri-wallet-3-line' iconColor='info' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <DashboardMetricCard
          title='Pending Withdrawal Approvals'
          stats={[
            { label: 'Pending Withdrawal Approvals', value: 40 }
          ]}
          icon='ri-time-line'
          iconColor='warning'
        />
      </Grid>

      {/* Row 4: Overall financials (4 columns) */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FinancialMetricCard title='Total Deposits' amount={89809.85} icon='ri-arrow-up-circle-line' iconColor='success' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FinancialMetricCard title='Total Withdrawals' amount={5080.9} icon='ri-arrow-down-circle-line' iconColor='error' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FinancialMetricCard title='Total Balance Available' amount={84508.95} icon='ri-wallet-3-line' iconColor='primary' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <DashboardMetricCard
          title='Pending Deposit Approvals'
          stats={[
            { label: 'Pending Deposit Approvals', value: 89 }
          ]}
          icon='ri-time-line'
          iconColor='info'
        />
      </Grid>

      {/* Row 6: Two panels side-by-side */}
      <Grid size={{ xs: 12, md: 6 }}>
        <RevenueGeneration />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TopContributors />
      </Grid>

      {/* Row 7: Full-width card */}
      <Grid size={{ xs: 12 }}>
        <DailyAgentRevenue />
      </Grid>
    </Grid>
  )
}

export default DashboardPage
