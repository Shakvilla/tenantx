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
  allProperties: number
  occupiedUnits: number
  vacantUnits: number
  damagedUnits: number

  /** Agreement signed, tenant not yet moved in. Counted in none of the other three. */
  reservedUnits: number
}

type StatsDataType = {
  title: string
  value: string
  icon: string
  desc: string
}

const PropertiesStatsCard = ({
  allProperties,
  occupiedUnits,
  vacantUnits,
  damagedUnits,
  reservedUnits
}: Props) => {
  // Hooks
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  const data: StatsDataType[] = [
    {
      title: 'All Properties',
      value: allProperties.toString(),
      icon: 'ri-building-line',
      desc: 'Total number of properties'
    },
    {
      title: 'Occupied Units',
      value: occupiedUnits.toString(),
      icon: 'ri-home-line',
      desc: 'Currently occupied units'
    },
    {
      title: 'Vacant Units',
      value: vacantUnits.toString(),
      icon: 'ri-building-2-line',
      desc: 'Available for rent'
    },
    {
      title: 'Reserved Units',
      value: reservedUnits.toString(),
      icon: 'ri-calendar-check-line',
      desc: 'Awaiting move-in'
    },
    {
      title: 'Damaged Units',
      value: damagedUnits.toString(),
      icon: 'ri-error-warning-line',
      desc: 'Units requiring maintenance'
    }
  ]

  return (
    <Card className='mbs-6'>
      <CardContent>
        <Grid container spacing={6}>
          {data.map((item, index) => (
            <Grid
              // 2.4 = 12/5. Five tiles across on desktop rather than four plus a
              // stranded fifth on its own row.
              size={{ xs: 12, sm: 6, md: 2.4 }}
              key={index}
              className={classnames({
                '[&:nth-of-type(odd)>div]:pie-6 [&:nth-of-type(odd)>div]:border-ie': isBelowMdScreen && !isSmallScreen,
                '[&:not(:last-child)>div]:pie-6 [&:not(:last-child)>div]:border-ie': !isBelowMdScreen
              })}
            >
              <div className='flex flex-col gap-1'>
                <div className='flex justify-between'>
                  <div className='flex flex-col gap-1'>
                    <Typography>{item.title}</Typography>
                    <Typography variant='h4'>{item.value}</Typography>
                  </div>
                  <CustomAvatar variant='rounded' size={44}>
                    <i className={classnames(item.icon, 'text-[28px]')} />
                  </CustomAvatar>
                </div>
                <Typography>{item.desc}</Typography>
              </div>
              {isBelowMdScreen && !isSmallScreen && index < data.length - 2 && (
                <Divider
                  className={classnames('mbs-6', {
                    'mie-6': index % 2 === 0
                  })}
                />
              )}
              {isSmallScreen && index < data.length - 1 && <Divider className='mbs-6' />}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default PropertiesStatsCard
