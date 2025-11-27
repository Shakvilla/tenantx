'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

type PropertyData = {
  address: string
  region: string
  district: string
  city: string
  gpsCode: string
  location: string
}

const PropertyLocationCard = ({ propertyData }: { propertyData?: PropertyData }) => {
  if (!propertyData) {
    return null
  }

  return (
    <Card>
      <CardHeader title='Location Details' />
      <Divider />
      <CardContent>
        <div className='flex flex-col gap-4'>
          <div className='flex items-start gap-3'>
            <CustomAvatar skin='light' color='primary' size={40}>
              <i className='ri-map-pin-line text-xl' />
            </CustomAvatar>
            <div className='flex flex-col gap-1 flex-1'>
              <Typography variant='subtitle1' className='font-semibold' color='text.primary'>
                Address
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {propertyData.address}
              </Typography>
            </div>
          </div>

          <Divider />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <div className='flex flex-col gap-1'>
                <Typography variant='caption' color='text.secondary'>
                  Region
                </Typography>
                <Typography variant='body1' className='font-medium' color='text.primary'>
                  {propertyData.region}
                </Typography>
              </div>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <div className='flex flex-col gap-1'>
                <Typography variant='caption' color='text.secondary'>
                  District
                </Typography>
                <Typography variant='body1' className='font-medium' color='text.primary'>
                  {propertyData.district}
                </Typography>
              </div>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <div className='flex flex-col gap-1'>
                <Typography variant='caption' color='text.secondary'>
                  City
                </Typography>
                <Typography variant='body1' className='font-medium' color='text.primary'>
                  {propertyData.city}
                </Typography>
              </div>
            </Grid>
            {propertyData.gpsCode && (
              <Grid size={{ xs: 12 }}>
                <div className='flex items-center justify-between p-3 border rounded-lg'>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='caption' color='text.secondary'>
                      GPS Code
                    </Typography>
                    <Typography variant='body1' className='font-medium' color='text.primary'>
                      {propertyData.gpsCode}
                    </Typography>
                  </div>
                  <IconButton size='small' color='primary'>
                    <i className='ri-map-pin-line' />
                  </IconButton>
                </div>
              </Grid>
            )}
          </Grid>
        </div>
      </CardContent>
    </Card>
  )
}

export default PropertyLocationCard

