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

type UnitData = {
  id: string
  unitNumber: string
  propertyName: string
  propertyId: string
  tenantName: string | null
  status: 'occupied' | 'vacant' | 'maintenance'
  rent: string
  bedrooms: number
  bathrooms: number
  size: string
}

const UnitInfoCard = ({ unitData }: { unitData?: UnitData }) => {
  const statusColor: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    occupied: 'success',
    vacant: 'warning',
    maintenance: 'error'
  }

  return (
    <Card>
      <CardHeader title='Unit Information' />
      <CardContent>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='body2' color='text.secondary'>
                Unit Number
              </Typography>
              <Typography variant='h6'>{unitData?.unitNumber || '-'}</Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='body2' color='text.secondary'>
                Property
              </Typography>
              <Typography variant='h6'>{unitData?.propertyName || '-'}</Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='body2' color='text.secondary'>
                Status
              </Typography>
              {unitData?.status ? (
                <Chip
                  variant='tonal'
                  label={unitData.status}
                  color={statusColor[unitData.status]}
                  size='small'
                  className='capitalize w-fit'
                />
              ) : (
                <Typography variant='h6'>-</Typography>
              )}
            </div>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='body2' color='text.secondary'>
                Rent
              </Typography>
              <Typography variant='h6'>{unitData?.rent || '-'}</Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='body2' color='text.secondary'>
                Bedrooms
              </Typography>
              <Typography variant='h6'>{unitData?.bedrooms || '-'}</Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='body2' color='text.secondary'>
                Bathrooms
              </Typography>
              <Typography variant='h6'>{unitData?.bathrooms || '-'}</Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='body2' color='text.secondary'>
                Size
              </Typography>
              <Typography variant='h6'>{unitData?.size || '-'}</Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='body2' color='text.secondary'>
                Tenant
              </Typography>
              {unitData?.tenantName ? (
                <div className='flex items-center gap-3'>
                  <CustomAvatar skin='light' color='primary' size={40}>
                    {unitData.tenantName
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()}
                  </CustomAvatar>
                  <Typography variant='h6'>{unitData.tenantName}</Typography>
                </div>
              ) : (
                <Typography variant='body1' color='text.secondary'>
                  No tenant assigned
                </Typography>
              )}
            </div>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default UnitInfoCard

