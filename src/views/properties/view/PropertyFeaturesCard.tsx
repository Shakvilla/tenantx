'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'

// Context Imports
import { useReferenceData } from '@/contexts/ReferenceDataContext'

/**
 * `facilities` used to sit alongside this, populated from the SAME
 * `property.amenities` array, and was rendered below as raw chips —
 * `kitchenCabinets`, `popCeiling`, `gatedCompound`. So the page listed every
 * amenity twice: once labelled through the reference data, once as its storage
 * key. One column, one list, one rendering.
 */
type PropertyData = {
  amenities: Record<string, boolean>
}

const PropertyFeaturesCard = ({ propertyData }: { propertyData?: PropertyData }) => {
  const { ref } = useReferenceData()

  if (!propertyData) {
    return null
  }

  const selectedAmenities = ref.amenities.filter(amenity => propertyData.amenities[amenity.id])

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

        </div>
      </CardContent>
    </Card>
  )
}

export default PropertyFeaturesCard

