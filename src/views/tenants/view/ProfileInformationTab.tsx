'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Avatar from '@mui/material/Avatar'

type TenantData = {
  id: string
  name: string
  email: string
  phone: string
  roomNo: string
  propertyName: string
  status: 'active' | 'inactive'
  avatar?: string
  age?: number
  familyMembers?: number
  job?: string
  previousAddress?: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  permanentAddress?: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

const ProfileInformationTab = ({ tenantData }: { tenantData?: TenantData }) => {
  return (
    <Grid container spacing={6}>
      {/* Profile Information Card */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0}>
          <CardHeader title='Profile Information' />
          <CardContent className='flex flex-col gap-6'>
            {/* User Summary */}
            <div className='flex flex-col items-center gap-4'>
              <Avatar
                src={tenantData?.avatar}
                alt={tenantData?.name}
                sx={{ width: 100, height: 100 }}
              />
              <div className='flex flex-col items-center gap-1'>
                <Typography variant='h5'>{tenantData?.name || '-'}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {tenantData?.email || '-'}
                </Typography>
              </div>
            </div>

            <Divider />

            {/* Personal Information */}
            <div className='flex flex-col gap-4'>
              <Typography variant='subtitle2' className='uppercase' color='text.disabled'>
                Personal Information
              </Typography>
              <div className='flex flex-col gap-3'>
                <div className='flex justify-between'>
                  <Typography variant='body2' color='text.secondary'>
                    Name:
                  </Typography>
                  <Typography variant='body2' className='font-medium'>
                    {tenantData?.name || '-'}
                  </Typography>
                </div>
                <div className='flex justify-between'>
                  <Typography variant='body2' color='text.secondary'>
                    Contact Number:
                  </Typography>
                  <Typography variant='body2' className='font-medium'>
                    {tenantData?.phone || '-'}
                  </Typography>
                </div>
                <div className='flex justify-between'>
                  <Typography variant='body2' color='text.secondary'>
                    Email:
                  </Typography>
                  <Typography variant='body2' className='font-medium'>
                    {tenantData?.email || '-'}
                  </Typography>
                </div>
                {tenantData?.age && (
                  <div className='flex justify-between'>
                    <Typography variant='body2' color='text.secondary'>
                      Age:
                    </Typography>
                    <Typography variant='body2' className='font-medium'>
                      {tenantData.age}
                    </Typography>
                  </div>
                )}
                {tenantData?.familyMembers !== undefined && (
                  <div className='flex justify-between'>
                    <Typography variant='body2' color='text.secondary'>
                      Family Members:
                    </Typography>
                    <Typography variant='body2' className='font-medium'>
                      {tenantData.familyMembers.toString().padStart(2, '0')}
                    </Typography>
                  </div>
                )}
                {tenantData?.job && (
                  <div className='flex justify-between'>
                    <Typography variant='body2' color='text.secondary'>
                      Job:
                    </Typography>
                    <Typography variant='body2' className='font-medium'>
                      {tenantData.job}
                    </Typography>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Previous Address Card */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0}>
          <CardHeader title='Previous Address' />
          <CardContent>
            <div className='flex flex-col gap-3'>
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>
                  Address:
                </Typography>
                <Typography variant='body2' className='font-medium text-right max-w-[60%]'>
                  {tenantData?.previousAddress?.address || '-'}
                </Typography>
              </div>
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>
                  City:
                </Typography>
                <Typography variant='body2' className='font-medium'>
                  {tenantData?.previousAddress?.city || '-'}
                </Typography>
              </div>
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>
                  State:
                </Typography>
                <Typography variant='body2' className='font-medium'>
                  {tenantData?.previousAddress?.state || '-'}
                </Typography>
              </div>
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>
                  Zip Code:
                </Typography>
                <Typography variant='body2' className='font-medium'>
                  {tenantData?.previousAddress?.zipCode || '-'}
                </Typography>
              </div>
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>
                  Country:
                </Typography>
                <Typography variant='body2' className='font-medium'>
                  {tenantData?.previousAddress?.country || '-'}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Permanent Address Card */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card elevation={0}>
          <CardHeader title='Permanent Address' />
          <CardContent>
            <div className='flex flex-col gap-3'>
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>
                  Address:
                </Typography>
                <Typography variant='body2' className='font-medium text-right max-w-[60%]'>
                  {tenantData?.permanentAddress?.address || '-'}
                </Typography>
              </div>
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>
                  City:
                </Typography>
                <Typography variant='body2' className='font-medium'>
                  {tenantData?.permanentAddress?.city || '-'}
                </Typography>
              </div>
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>
                  State:
                </Typography>
                <Typography variant='body2' className='font-medium'>
                  {tenantData?.permanentAddress?.state || '-'}
                </Typography>
              </div>
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>
                  Zip Code:
                </Typography>
                <Typography variant='body2' className='font-medium'>
                  {tenantData?.permanentAddress?.zipCode || '-'}
                </Typography>
              </div>
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>
                  Country:
                </Typography>
                <Typography variant='body2' className='font-medium'>
                  {tenantData?.permanentAddress?.country || '-'}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ProfileInformationTab

