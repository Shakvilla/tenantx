// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

type PropertyStatsCardProps = {
  title: string
  value: string
  description: string
  icon: string
  iconColor: ThemeColor

  /**
   * Spread the content over the card's full height instead of hugging the top. Opt-in, for
   * the few places where this tile shares a row with much taller cards (the dashboard's
   * second strip) and would otherwise sit in a pool of white space.
   */
  fill?: boolean
}

const PropertyStatsCard = ({ title, value, description, icon, iconColor, fill }: PropertyStatsCardProps) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent
        className='flex flex-col gap-3'
        sx={fill ? { height: '100%', justifyContent: 'space-between' } : undefined}
      >
        <div className='flex items-start justify-between'>
          <Typography variant='body2' color='text.secondary' className='font-medium'>
            {title}
          </Typography>
          <CustomAvatar variant='rounded' skin='light' color={iconColor} size={48}>
            <i className={icon} />
          </CustomAvatar>
        </div>
        <div className='flex flex-col gap-1'>
          <Typography variant='h4' color='text.primary' className='font-semibold'>
            {value}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {description}
          </Typography>
        </div>
      </CardContent>
    </Card>
  )
}

export default PropertyStatsCard

