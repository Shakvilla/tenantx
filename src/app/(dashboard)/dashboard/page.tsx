'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import { DashboardSummaryProvider } from '@views/dashboards/DashboardSummaryContext'
import DashboardStatsCards from '@views/dashboards/DashboardStatsCards'
import RentCollectedCard from '@views/dashboards/RentCollectedCard'
import PendingPaymentCard from '@views/dashboards/PendingPaymentCard'
import ExpensesOverviewCard from '@views/dashboards/ExpensesOverviewCard'
import MaintenanceRequestsTable from '@views/dashboards/MaintenanceRequestsTable'
import RecentActivity from '@views/dashboards/RecentActivity'
import RentsExpiringSoonCard from '@views/dashboards/RentsExpiringSoonCard'
import ReservedUnitsCard from '@views/dashboards/ReservedUnitsCard'
import TenantsTable from '@views/dashboards/TenantsTable'

// DASHBOARD-P5-01 (2026-08-20 dashboard audit): the old full-page DashboardSkeleton was
// rendered ABOVE the real grid (both trees in the DOM at once) and dismissed on the FIRST of
// eight fetches — the page then assembled itself in 7 visible collapse-and-expand steps, with
// +360px/+400px shifts. Every card now renders its own skeleton inside a container whose
// height is reserved up front, so nothing collapses and nothing double-mounts. The tile data
// itself arrives as ONE /dashboard/summary request via DashboardSummaryProvider (handoff #2)
// instead of 7–8 independent fetches.
const CHART_CARD_MIN_HEIGHT = 220

const DashboardPage = () => {
  return (
    <DashboardSummaryProvider>
      <Grid container spacing={6}>
        {/* Row 1: money first. The landlord who field-tested this opens the app to find out
            what came in and what is outstanding; the portfolio counts are the last thing he
            reads, and they used to sit above the cedis. Rent collected and pending lead the
            row, then the two operational cards. Four md-3 cells, so the row closes cleanly;
            every card is height:100% and the row stretches to the tallest. Heights are
            reserved so data arrival never shifts layout. */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ minHeight: CHART_CARD_MIN_HEIGHT }}>
          <RentCollectedCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ minHeight: CHART_CARD_MIN_HEIGHT }}>
          <PendingPaymentCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ minHeight: CHART_CARD_MIN_HEIGHT }}>
          <ReservedUnitsCard />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ minHeight: CHART_CARD_MIN_HEIGHT }}>
          <RentsExpiringSoonCard />
        </Grid>

        {/* Row 2: Portfolio tiles — four across, one full 12-column row */}
        <DashboardStatsCards />

        {/* Row 3: two half-width panels. Expenses used to sit here alone (six empty columns);
            Recent Activity partners it instead — its entries are long sentences and read
            better at half width than in the old quarter-width rail. */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ minHeight: 360 }}>
          <ExpensesOverviewCard />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ minHeight: 360 }}>
          <RecentActivity />
        </Grid>

        {/* Row 4: Maintenance Requests — a wide table, so it takes the full row */}
        <Grid size={{ xs: 12 }} sx={{ minHeight: 360 }}>
          <MaintenanceRequestsTable />
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
