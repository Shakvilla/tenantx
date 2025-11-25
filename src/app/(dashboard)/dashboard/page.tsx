// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import PageBanner from '@/components/banner/PageBanner'
import PropertyStatsCard from '@/components/card-statistics/PropertyStatsCard'
import RentCollectedCard from '@views/dashboards/RentCollectedCard'
import PendingPaymentCard from '@views/dashboards/PendingPaymentCard'
import ExpensesOverviewCard from '@views/dashboards/ExpensesOverviewCard'
import MaintenanceRequestsTable from '@views/dashboards/MaintenanceRequestsTable'
import RecentActivity from '@views/dashboards/RecentActivity'
import TenantsTable from '@views/dashboards/TenantsTable'

const DashboardPage = () => {
  return (
    <Grid container spacing={6}>
      {/* Banner */}
      <Grid size={{ xs: 12 }}>
        <PageBanner
          title='Welcome to TenantX'
          description='Manage your properties, tenants, and finances all in one place. Get insights into your rental business with real-time analytics and comprehensive reporting.'
          icon='ri-dashboard-line'
        />
      </Grid>

      {/* Row 1: Summary Cards */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <PropertyStatsCard
          title='Total Properties'
          value='210'
          description='Total Number of properties managed'
          icon='ri-building-line'
          iconColor='success'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <PropertyStatsCard
          title='Total Tenants'
          value='530'
          description='Total Number of tenants'
          icon='ri-group-line'
          iconColor='warning'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <PropertyStatsCard
          title='Occupied Units'
          value='300'
          description='Total number of occupied units'
          icon='ri-layout-grid-line'
          iconColor='info'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <PropertyStatsCard
          title='Vacant Units'
          value='140'
          description='Total number of vacant units'
          icon='ri-home-line'
          iconColor='error'
        />
      </Grid>

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

      {/* Row 4: Tenants Table */}
      <Grid size={{ xs: 12 }}>
        <TenantsTable />
      </Grid>
    </Grid>
  )
}

export default DashboardPage
