'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

type PropertyData = {
  name: string
  type: string
  condition: string
  description: string
  price: string
  bedroom: number
  bathroom: number
  rooms: number
}

const PropertyInfoCard = ({ propertyData }: { propertyData?: PropertyData }) => {
  if (!propertyData) {
    return null
  }

  return (
    <Card>
      <CardHeader
        title='Property Information'
        action={
          <Typography component='a' color='primary.main' className='font-medium cursor-pointer'>
            Edit
          </Typography>
        }
      />
      <Divider />
      <CardContent>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <div className='flex items-center gap-3 mbe-4'>
              <CustomAvatar skin='light' color='primary' size={40}>
                <i className='ri-building-line text-xl' />
              </CustomAvatar>
              <div className='flex flex-col'>
                <Typography variant='h6' className='font-semibold' color='text.primary'>
                  {propertyData.name}
                </Typography>
                <div className='flex items-center gap-2'>
                  <Chip variant='tonal' label={propertyData.type} color='primary' size='small' />
                  {propertyData.condition && (
                    <Chip variant='tonal' label={propertyData.condition} color='info' size='small' />
                  )}
                </div>
              </div>
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='caption' color='text.secondary'>
                Price
              </Typography>
              <Typography variant='h5' className='font-semibold' color='text.primary'>
                {propertyData.price}
              </Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='caption' color='text.secondary'>
                Bedrooms
              </Typography>
              <Typography variant='h6' className='font-medium' color='text.primary'>
                {propertyData.bedroom}
              </Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='caption' color='text.secondary'>
                Bathrooms
              </Typography>
              <Typography variant='h6' className='font-medium' color='text.primary'>
                {propertyData.bathroom}
              </Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='caption' color='text.secondary'>
                Rooms
              </Typography>
              <Typography variant='h6' className='font-medium' color='text.primary'>
                {propertyData.rooms}
              </Typography>
            </div>
          </Grid>
          {propertyData.description && (
            <Grid size={{ xs: 12 }}>
              <Divider className='mbe-4' />
              <div className='flex flex-col gap-1'>
                <Typography variant='subtitle2' className='font-medium' color='text.primary'>
                  Description
                </Typography>
                <Typography variant='body1' color='text.secondary'>
                  {propertyData.description}
                </Typography>
              </div>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default PropertyInfoCard

