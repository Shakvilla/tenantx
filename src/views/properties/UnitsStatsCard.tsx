'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

type Props = {
  allUnits: number
  occupiedUnits: number
  vacantUnits: number
  reservedUnits: number
  maintenanceUnits: number
}

type StatsDataType = {
  title: string
  value: string
  icon: string
  desc: string
  iconColor: 'primary' | 'success' | 'info' | 'warning' | 'error'
}

/**
 * Every status a unit can hold, so the tiles add up to All Units.
 *
 * Reserved was in none of them: a unit sits there from the moment an agreement
 * is signed until the tenant moves in, which can be weeks, and during that time
 * it vanished from this row entirely — a landlord with four units and three
 * signed tenancies read "All 4 · Occupied 0 · Vacant 1 · Maintenance 0" and had
 * no way to find the other three. The same omission was fixed on the dashboard;
 * this screen kept it.
 */
const UnitsStatsCard = ({ allUnits, occupiedUnits, vacantUnits, reservedUnits, maintenanceUnits }: Props) => {
  // Hooks
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  const data: StatsDataType[] = [
    {
      title: 'All Units',
      value: allUnits.toString(),
      icon: 'ri-building-line',
      desc: 'Total number of units',
      iconColor: 'primary'
    },
    {
      title: 'Occupied Units',
      value: occupiedUnits.toString(),
      icon: 'ri-home-line',
      desc: 'Currently occupied units',
      iconColor: 'success'
    },
    {
      title: 'Vacant Units',
      value: vacantUnits.toString(),
      icon: 'ri-building-2-line',
      desc: 'Available for rent',
      iconColor: 'info'
    },
    {
      title: 'Reserved Units',
      value: reservedUnits.toString(),
      icon: 'ri-calendar-check-line',
      desc: 'Awaiting move-in',
      iconColor: 'warning'
    },
    {
      title: 'Maintenance Units',
      value: maintenanceUnits.toString(),
      icon: 'ri-error-warning-line',
      desc: 'Units requiring maintenance',
      iconColor: 'error'
    }
  ]

  // The separators were written for exactly four tiles on one row — a right
  // border on all but the last — which with five leaves one hanging at the end
  // of the first row. Deriving the row width keeps them right at any count.
  const perRow = isSmallScreen ? 1 : isBelowMdScreen ? 2 : 3
  const lastRowStart = data.length - (data.length % perRow || perRow)

  return (
    <Card className='mbs-6'>
      <CardContent>
        <Grid container spacing={6}>
          {data.map((item, index) => {
            const endsRow = (index + 1) % perRow === 0
            const inLastRow = index >= lastRowStart

            return (
              <Grid
                size={{ xs: 12, sm: 6, md: 4 }}
                key={index}
                className={classnames({
                  '[&>div]:pie-6 [&>div]:border-ie': !endsRow && index !== data.length - 1
                })}
              >
                <div className='flex flex-col gap-1'>
                  <div className='flex justify-between'>
                    <div className='flex flex-col gap-1'>
                      <Typography>{item.title}</Typography>
                      <Typography variant='h4'>{item.value}</Typography>
                    </div>
                    <CustomAvatar variant='rounded' skin='light' color={item.iconColor} size={44}>
                      <i className={classnames(item.icon, 'text-[28px]')} />
                    </CustomAvatar>
                  </div>
                  <Typography>{item.desc}</Typography>
                </div>
                {!inLastRow && <Divider className={classnames('mbs-6', { 'mie-6': !endsRow })} />}
              </Grid>
            )
          })}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default UnitsStatsCard
