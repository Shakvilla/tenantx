// MUI Imports
'use client'
import Grid from '@mui/material/Grid2'

// Component Imports
import PageBanner from '@/components/banner/PageBanner'
import DashboardStatsCards from '@views/dashboards/DashboardStatsCards'
import RentCollectedCard from '@views/dashboards/RentCollectedCard'
import PendingPaymentCard from '@views/dashboards/PendingPaymentCard'
import ExpensesOverviewCard from '@views/dashboards/ExpensesOverviewCard'
import MaintenanceRequestsTable from '@views/dashboards/MaintenanceRequestsTable'
import RecentActivity from '@views/dashboards/RecentActivity'
import TenantsTable from '@views/dashboards/TenantsTable'
import { useAuth } from '@/contexts/AuthContext'

const DashboardPage = () => {
  const { tenant } = useAuth()

  // Use tenant name or fallback to default
  const welcomeTitle = tenant?.name ? `Welcome to ${tenant.name}` : ''

  return (
    <Grid container spacing={6}>
      {/* Banner */}
      <Grid size={{ xs: 12 }}>
        <PageBanner
          title={welcomeTitle}
          description='Manage your properties, tenants, and finances all in one place. Get insights into your rental business with real-time analytics and comprehensive reporting.'
          icon='ri-dashboard-line'
        />
      </Grid>

      {/* Row 1: Summary Cards (live from API) */}
      <DashboardStatsCards />

      {/* Row 2: Financial Cards with Charts */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <RentCollectedCard />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <PendingPaymentCard />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ExpensesOverviewCard />
      </Grid>

      {/* Row 3: Maintenance Requests and Recent Activity */}
      <Grid size={{ xs: 12, md: 8 }}>
        <MaintenanceRequestsTable />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <RecentActivity />
      </Grid>

      {/* Row 4: Occupants Table */}
      <Grid size={{ xs: 12 }}>
        <TenantsTable />
      </Grid>
    </Grid>
  )
}

export default DashboardPage
