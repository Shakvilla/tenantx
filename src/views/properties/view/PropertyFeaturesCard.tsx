'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'

type PropertyData = {
  amenities: Record<string, boolean>
  facilities: string[]
}

const amenitiesList = [
  { id: 'electricity', name: '24-hour Electricity', icon: 'ri-flashlight-line' },
  { id: 'kitchenCabinets', name: 'Kitchen Cabinets', icon: 'ri-home-4-line' },
  { id: 'popCeiling', name: 'POP Ceiling', icon: 'ri-building-line' },
  { id: 'tiledFloor', name: 'Tiled Floor', icon: 'ri-layout-grid-line' },
  { id: 'diningArea', name: 'Dining Area', icon: 'ri-restaurant-line' },
  { id: 'parking', name: 'Parking Space', icon: 'ri-parking-line' },
  { id: 'security', name: 'Security', icon: 'ri-shield-check-line' },
  { id: 'wifi', name: 'WiFi', icon: 'ri-wifi-line' }
]

const PropertyFeaturesCard = ({ propertyData }: { propertyData?: PropertyData }) => {
  if (!propertyData) {
    return null
  }

  const selectedAmenities = amenitiesList.filter(amenity => propertyData.amenities[amenity.id])

  return (
    <Card>
      <CardHeader title='Property Features' />
      <CardContent>
        <div className='flex flex-col gap-4'>
          {selectedAmenities.length > 0 ? (
            <Grid container spacing={2}>
              {selectedAmenities.map(amenity => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={amenity.id}>
                  <Box
                    className='flex items-center gap-3 p-3 border rounded-lg hover:bg-actionHover transition-colors'
                    sx={{
                      borderColor: 'var(--mui-palette-divider)'
                    }}
                  >
                    <i className={`${amenity.icon} text-xl text-primary`} />
                    <Typography variant='body1' className='font-medium' color='text.primary'>
                      {amenity.name}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color='text.secondary'>No amenities selected</Typography>
          )}

          {propertyData.facilities && propertyData.facilities.length > 0 && (
            <div className='flex flex-col gap-2 mts-4'>
              <Typography variant='subtitle2' className='font-medium' color='text.primary'>
                Facilities
              </Typography>
              <div className='flex flex-wrap gap-2'>
                {propertyData.facilities.map((facility, index) => (
                  <Chip
                    key={index}
                    label={facility}
                    size='small'
                    variant='tonal'
                    color='primary'
                    icon={<i className={`ri-${facility === 'wifi' ? 'wifi' : facility === 'bed' ? 'bed' : 'lightbulb'}-line`} />}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PropertyFeaturesCard

