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

// Component Imports
import AdvanceRentSection from './AdvanceRentSection'
import CautionFeeSection from './CautionFeeSection'

// ImageKit does not serve original files on this account; see ikUrl.
import { ikUrl, IK_CARD } from '@/lib/imagekit'

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
  unitId?: string
  propertyId?: string
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
          {tenantData?.propertyImage ? (
            <CardMedia
              component='img'
              image={ikUrl(tenantData.propertyImage, IK_CARD)}
              alt={tenantData?.propertyName || 'Property'}
              sx={{ height: 500, objectFit: 'cover' }}
            />
          ) : (
            <Box
              sx={{
                height: 500,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                bgcolor: 'action.hover',
                color: 'text.disabled'
              }}
            >
              <i className='ri-home-4-line' style={{ fontSize: '3rem' }} />
              <Typography variant='body2' color='text.disabled'>
                No property image
              </Typography>
            </Box>
          )}
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
                  label='Resident'
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
                {/*
                  Renamed, because this and the Caution Fee panel below are the same money under
                  two names and a landlord entered it twice — ₵600 as a "Security Deposit" on the
                  lease on Sunday, then ₵600 again as a caution fee. This one is a figure copied
                  off the agreement; the panel below is the fee actually being held, with its
                  deductions and its refundable balance.
                */}
                <TextField
                  size='small'
                  label='Deposit stated on the lease'
                  value={tenantData?.securityDeposit || '-'}
                  helperText='The caution fee actually held is shown below.'
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

      {/*
        Advance rent and the caution fee used to sit here. They moved to Payment History, which
        is the tab about this tenant's money — a landlord looking for them on the tab about the
        PROPERTY found them by accident.
      */}
      <Grid size={{ xs: 12 }}>
        <Typography variant='body2' color='text.secondary'>
          Advance rent and the caution fee are on the <strong>Payment History</strong> tab.
        </Typography>
      </Grid>

    </Grid>
  )
}

export default HomeDetailsTab

