// MUI Imports
'use client'
import { useState, useEffect } from 'react'

import Grid from '@mui/material/Grid2'

// Component Imports
import PageBanner from '@/components/banner/PageBanner'
import DashboardSkeleton from '@views/dashboards/DashboardSkeleton'
import DashboardStatsCards from '@views/dashboards/DashboardStatsCards'
import RentCollectedCard from '@views/dashboards/RentCollectedCard'
import PendingPaymentCard from '@views/dashboards/PendingPaymentCard'
import ExpensesOverviewCard from '@views/dashboards/ExpensesOverviewCard'
import MaintenanceRequestsTable from '@views/dashboards/MaintenanceRequestsTable'
import RecentActivity from '@views/dashboards/RecentActivity'
import RentsExpiringSoonCard from '@views/dashboards/RentsExpiringSoonCard'
import TenantsTable from '@views/dashboards/TenantsTable'
import { useAuth } from '@/contexts/AuthContext'

const DashboardPage = () => {
  const { tenant } = useAuth()

  // Full-screen skeleton is shown until the primary stats fetch resolves (via
  // DashboardStatsCards' onLoaded). Safety timeout guarantees it can't get stuck.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 8000)
    return () => clearTimeout(t)
  }, [])

  // Use tenant name or fallback to default
  const welcomeTitle = tenant?.name ? `Welcome to ${tenant.name}` : ''

  return (
    <>
      {loading && <DashboardSkeleton />}
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
      <DashboardStatsCards onLoaded={() => setLoading(false)} />

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

      {/* Row 4: Rents Expiring Soon */}
      <Grid size={{ xs: 12, md: 4 }}>
        <RentsExpiringSoonCard />
      </Grid>

      {/* Row 5: Occupants Table */}
      {/* Extra bottom margin on mobile reserves room below the last widget so the
          floating scroll-to-top button never ends up sitting on top of this card's
          own pagination controls once the page is scrolled all the way down. */}
      <Grid size={{ xs: 12 }} sx={{ mb: { xs: 40, md: 0 } }}>
        <TenantsTable />
      </Grid>
      </Grid>
    </>
  )
}

export default DashboardPage
