'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import CardMedia from '@mui/material/CardMedia'
import InputAdornment from '@mui/material/InputAdornment'

type TenantData = {
  id: string
  name: string
  email: string
  phone: string
  roomNo: string
  propertyName: string
  costPerMonth: string
  propertyImage?: string
  propertyAddress?: string
  unitName?: string
  securityDeposit?: string
  lateFee?: string
  rentType?: string
  receipt?: string
  paymentDueDate?: string
}

const HomeDetailsTab = ({ tenantData }: { tenantData?: TenantData }) => {
  return (
    <Grid container spacing={6}>
      {/* Property Image Section */}
      <Grid size={{ xs: 12, md: 7 }}>
        <Card elevation={0}>
          <CardMedia
            component='img'
            image={
              tenantData?.propertyImage ||
              'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
            }
            alt={tenantData?.propertyName || 'Property'}
            sx={{ height: 500, objectFit: 'cover' }}
          />
        </Card>
      </Grid>

      {/* Rent Information Section */}
      <Grid size={{ xs: 12, md: 5 }}>
        <Card elevation={0}>
          <CardContent className='flex flex-col gap-6'>
            <div className='flex flex-col gap-2'>
              <Typography variant='h5'>{tenantData?.propertyName || 'Property Name'}</Typography>
              {tenantData?.propertyAddress && (
                <div className='flex items-center gap-2'>
                  <i className='ri-map-pin-line text-lg' />
                  <Typography variant='body2' color='text.secondary'>
                    {tenantData.propertyAddress}
                  </Typography>
                </div>
              )}
            </div>

            <div className='flex flex-col gap-4'>
              <Typography variant='subtitle2' className='uppercase' color='text.disabled'>
                Rent Information
              </Typography>

              <Box className='grid grid-cols-2 gap-4'>
                <TextField
                  size='small'
                  label='Unit Name'
                  value={tenantData?.unitName || tenantData?.roomNo || '-'}
                  InputProps={{
                    readOnly: true
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: 'var(--mui-palette-primary-lightOpacity)',
                      '& fieldset': {
                        borderColor: 'var(--mui-palette-primary-main)'
                      }
                    }
                  }}
                />
                <TextField
                  size='small'
                  label='Tenant'
                  value={tenantData?.name || '-'}
                  InputProps={{
                    readOnly: true
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: 'var(--mui-palette-primary-lightOpacity)',
                      '& fieldset': {
                        borderColor: 'var(--mui-palette-primary-main)'
                      }
                    }
                  }}
                />
                <TextField
                  size='small'
                  label='Rent'
                  value={tenantData?.costPerMonth || '-'}
                  InputProps={{
                    readOnly: true
                  }}
                />
                <TextField
                  size='small'
                  label='Security Deposit'
                  value={tenantData?.securityDeposit || '-'}
                  InputProps={{
                    readOnly: true
                  }}
                />
                <TextField
                  size='small'
                  label='Late Fee'
                  value={tenantData?.lateFee || '-'}
                  InputProps={{
                    readOnly: true
                  }}
                />
                <TextField
                  size='small'
                  label='Rent Type'
                  value={tenantData?.rentType || 'Monthly'}
                  InputProps={{
                    readOnly: true
                  }}
                />
                <TextField
                  size='small'
                  label='Receipt'
                  value={tenantData?.receipt || '-'}
                  InputProps={{
                    readOnly: true
                  }}
                />
                <TextField
                  size='small'
                  label='Payment Due Date'
                  value={tenantData?.paymentDueDate || '-'}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position='end'>
                        <i className='ri-calendar-line text-lg' />
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default HomeDetailsTab

