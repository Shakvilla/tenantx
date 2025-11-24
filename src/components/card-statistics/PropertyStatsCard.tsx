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
}

const PropertyStatsCard = ({ title, value, description, icon, iconColor }: PropertyStatsCardProps) => {
  return (
    <Card>
      <CardContent className='flex flex-col gap-3'>
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

