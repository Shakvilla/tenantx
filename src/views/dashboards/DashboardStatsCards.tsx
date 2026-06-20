'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Skeleton from '@mui/material/Skeleton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// Component Imports
import PropertyStatsCard from '@/components/card-statistics/PropertyStatsCard'

// API Imports
import { getPropertyStats } from '@/lib/api/properties'
import { getOccupantStats } from '@/lib/api/occupants'
import { getStoredTenantId } from '@/lib/api/storage'

const DashboardStatsCards = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalOccupants: 0,
    occupiedUnits: 0,
    vacantUnits: 0
  })

  useEffect(() => {
    const tenantId = getStoredTenantId()
    if (!tenantId) { setLoading(false); return }

    Promise.all([
      getPropertyStats(tenantId).catch(() => null),
      getOccupantStats(tenantId).catch(() => null)
    ]).then(([propStats, occStats]) => {
      setStats({
        totalProperties: propStats?.data?.total ?? 0,
        totalOccupants: occStats?.total ?? 0,
        occupiedUnits: propStats?.data?.occupiedUnits ?? 0,
        vacantUnits: (propStats?.data?.totalUnits ?? 0) - (propStats?.data?.occupiedUnits ?? 0)
      })
    }).finally(() => setLoading(false))
  }, [])

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
