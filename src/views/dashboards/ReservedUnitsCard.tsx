'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'

// Component Imports
import PropertyStatsCard from '@/components/card-statistics/PropertyStatsCard'

// Data: the same shared /dashboard/summary fetch the other tiles read from.
import { useDashboardSummary } from '@views/dashboards/DashboardSummaryContext'

/**
 * Reserved Units tile.
 *
 * Split out of DashboardStatsCards so the dashboard grid divides evenly: five md-3 tiles
 * left a 3-column hole at the end of the second row on wide screens. This one opens the
 * second strip instead, alongside the two money cards and Rents Expiring Soon.
 */
const ReservedUnitsCard = () => {
  const { summary, loading } = useDashboardSummary()

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent className='flex flex-col gap-3'>
          <Skeleton variant='rectangular' height={20} width='60%' />
          <Skeleton variant='rectangular' height={40} width='40%' />
          <Skeleton variant='rectangular' height={16} width='80%' />
        </CardContent>
      </Card>
    )
  }

  return (
    <PropertyStatsCard
      fill
      title='Reserved Units'
      value={(summary?.properties?.reservedUnits ?? 0).toString()}
      description='Awaiting move-in — activate the agreement to occupy'
      icon='ri-calendar-check-line'
      iconColor='success'
    />
  )
}

export default ReservedUnitsCard
