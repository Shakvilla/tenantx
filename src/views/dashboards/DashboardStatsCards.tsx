'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Skeleton from '@mui/material/Skeleton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// Component Imports
import PropertyStatsCard from '@/components/card-statistics/PropertyStatsCard'

// Data: one shared /dashboard/summary fetch instead of two stats calls of its own
// (2026-08-20 dashboard audit, handoff #2).
import { useDashboardSummary } from '@views/dashboards/DashboardSummaryContext'

const DashboardStatsCards = () => {
  const { summary, loading } = useDashboardSummary()

  const stats = {
    totalProperties: summary?.properties?.totalProperties ?? 0,
    totalOccupants: summary?.occupants?.total ?? 0,
    occupiedUnits: summary?.properties?.occupiedUnits ?? 0,

    // Read directly rather than as totalUnits - occupiedUnits: that subtraction
    // counted units under maintenance and units awaiting move-in as vacant.
    vacantUnits: summary?.properties?.vacantUnits ?? 0
  }

  if (loading) {
    return (
      <>
        {[0, 1, 2, 3].map(i => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent className='flex flex-col gap-3'>
                <Skeleton variant='rectangular' height={20} width='60%' />
                <Skeleton variant='rectangular' height={40} width='40%' />
                <Skeleton variant='rectangular' height={16} width='80%' />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </>
    )
  }

  return (
    <>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <PropertyStatsCard
          title='Total Properties'
          value={stats.totalProperties.toString()}
          description='Total number of properties managed'
          icon='ri-building-line'
          iconColor='success'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <PropertyStatsCard
          title='Total Occupants'
          value={stats.totalOccupants.toString()}
          description='Total number of active occupants'
          icon='ri-group-line'
          iconColor='warning'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <PropertyStatsCard
          title='Occupied Units'
          value={stats.occupiedUnits.toString()}
          description='Total number of occupied units'
          icon='ri-layout-grid-line'
          iconColor='info'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <PropertyStatsCard
          title='Vacant Units'
          value={stats.vacantUnits.toString()}
          description='Total number of vacant units'
          icon='ri-home-line'
          iconColor='error'
        />
      </Grid>
    </>
  )
}

export default DashboardStatsCards
