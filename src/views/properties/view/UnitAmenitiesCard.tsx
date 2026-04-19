'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'

type UnitViewData = {
  amenities: string[]
}

const unitAmenitiesList = [
  { id: 'furnished', label: 'Furnished', icon: 'ri-home-heart-line' },
  { id: 'ac', label: 'Air Conditioning', icon: 'ri-temp-cold-line' },
  { id: 'balcony', label: 'Balcony', icon: 'ri-window-line' },
  { id: 'laundry', label: 'In-unit Laundry', icon: 'ri-water-flash-line' },
  { id: 'parking', label: 'Parking Space', icon: 'ri-parking-box-line' },
  { id: 'kitchen_cabinets', label: 'Kitchen Cabinets', icon: 'ri-cup-line' },
  { id: 'wardrobes', label: 'Built-in Wardrobes', icon: 'ri-shirt-line' },
  { id: 'wifi', label: 'WiFi / Internet', icon: 'ri-wifi-line' }
]

const UnitAmenitiesCard = ({ unitData }: { unitData?: UnitViewData }) => {
  if (!unitData) return null

  const selectedAmenities = unitAmenitiesList.filter(amenity => unitData.amenities.includes(amenity.id))

  return (
    <Card>
      <CardHeader title='Unit Amenities' />
      <CardContent>
        {selectedAmenities.length > 0 ? (
          <Grid container spacing={4}>
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
                    {amenity.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography color='text.secondary'>No specific amenities listed for this unit.</Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default UnitAmenitiesCard
