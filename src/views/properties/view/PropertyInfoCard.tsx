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
  bedrooms: string
  bathrooms: string
  rooms: string
}

/**
 * Renders a value that may not have been captured.
 *
 * These four figures are all optional on a property, and three of them are
 * blank on every property created before the form asked for them. "Not set"
 * says which, where a bare dash or a hard-coded "N/A" reads as a system
 * failure.
 */
const Figure = ({ value, variant }: { value: string; variant: 'h5' | 'h6' }) =>
  value ? (
    <Typography variant={variant} className={variant === 'h5' ? 'font-semibold' : 'font-medium'} color='text.primary'>
      {value}
    </Typography>
  ) : (
    <Typography variant={variant === 'h5' ? 'body1' : 'body2'} color='text.disabled'>
      Not set
    </Typography>
  )

const PropertyInfoCard = ({ propertyData }: { propertyData?: PropertyData }) => {
  if (!propertyData) {
    return null
  }

  return (
    <Card>
      <CardHeader title='Property Information' />
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
              {/* "Price" on a rental property reads as rent. This figure is the
                  landlord's own valuation of the asset (properties.current_value),
                  so name it that. */}
              <Typography variant='caption' color='text.secondary'>
                Estimated Value
              </Typography>
              <Figure value={propertyData.price} variant='h5' />
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='caption' color='text.secondary'>
                Bedrooms
              </Typography>
              <Figure value={propertyData.bedrooms} variant='h6' />
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='caption' color='text.secondary'>
                Bathrooms
              </Typography>
              <Figure value={propertyData.bathrooms} variant='h6' />
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='caption' color='text.secondary'>
                Rooms
              </Typography>
              <Figure value={propertyData.rooms} variant='h6' />
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

