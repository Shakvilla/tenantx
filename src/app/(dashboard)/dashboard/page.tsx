'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import PageBanner from '@/components/banner/PageBanner'
import { DashboardSummaryProvider } from '@views/dashboards/DashboardSummaryContext'
import DashboardStatsCards from '@views/dashboards/DashboardStatsCards'
import RentCollectedCard from '@views/dashboards/RentCollectedCard'
import PendingPaymentCard from '@views/dashboards/PendingPaymentCard'
import ExpensesOverviewCard from '@views/dashboards/ExpensesOverviewCard'
import MaintenanceRequestsTable from '@views/dashboards/MaintenanceRequestsTable'
import RecentActivity from '@views/dashboards/RecentActivity'
import RentsExpiringSoonCard from '@views/dashboards/RentsExpiringSoonCard'
import TenantsTable from '@views/dashboards/TenantsTable'
import { useAuth } from '@/contexts/AuthContext'

// DASHBOARD-P5-01 (2026-08-20 dashboard audit): the old full-page DashboardSkeleton was
// rendered ABOVE the real grid (both trees in the DOM at once) and dismissed on the FIRST of
// eight fetches — the page then assembled itself in 7 visible collapse-and-expand steps, with
// +360px/+400px shifts. Every card now renders its own skeleton inside a container whose
// height is reserved up front, so nothing collapses and nothing double-mounts. The tile data
// itself arrives as ONE /dashboard/summary request via DashboardSummaryProvider (handoff #2)
// instead of 7–8 independent fetches.
const CHART_CARD_MIN_HEIGHT = 220

const DashboardPage = () => {
  const { tenant } = useAuth()

  // Use tenant name or fallback to default
  const welcomeTitle = tenant?.name ? `Welcome to ${tenant.name}` : ''

  return (
    <DashboardSummaryProvider>
      <Grid container spacing={6}>
        {/* Banner */}
        <Grid size={{ xs: 12 }}>
          <PageBanner
            title={welcomeTitle}
            description='Manage your properties, tenants, and finances all in one place. Get insights into your rental business with real-time analytics and comprehensive reporting.'
            icon='ri-dashboard-line'
          />
        </Grid>

        {/* Row 1: Summary Cards (from the shared summary fetch) */}
        <DashboardStatsCards />

        {/* Row 2: Financial Cards with Charts — heights reserved so data arrival never shifts layout */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ minHeight: CHART_CARD_MIN_HEIGHT }}>
          <RentCollectedCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ minHeight: CHART_CARD_MIN_HEIGHT }}>
          <PendingPaymentCard />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ minHeight: CHART_CARD_MIN_HEIGHT }}>
          <ExpensesOverviewCard />
        </Grid>

        {/* Row 3: Maintenance Requests and Recent Activity */}
        <Grid size={{ xs: 12, md: 8 }} sx={{ minHeight: 360 }}>
          <MaintenanceRequestsTable />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }} sx={{ minHeight: 360 }}>
          <RecentActivity />
        </Grid>

        {/* Row 4: Rents Expiring Soon */}
        <Grid size={{ xs: 12, md: 4 }}>
          <RentsExpiringSoonCard />
        </Grid>

        {/* Row 5: Occupants Table */}
        {/* Extra bottom margin on mobile reserves room below the last widget so the
            floating scroll-to-top button never ends up sitting on top of this card's
            own pagination controls once the page is scrolled all the way down. */}
        <Grid size={{ xs: 12 }} sx={{ mb: { xs: 40, md: 0 }, minHeight: 400 }}>
          <TenantsTable />
        </Grid>
      </Grid>
    </DashboardSummaryProvider>
  )
}

export default DashboardPage
