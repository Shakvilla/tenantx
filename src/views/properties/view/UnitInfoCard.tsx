'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'

// API Imports
import { getUnitPriceHistory, type UnitPriceChangeLog } from '@/lib/api/units'

// Util Imports
import { formatCurrency } from '@/utils/currency'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

type UnitViewData = {
  id: string
  unitNumber: string
  propertyName: string
  propertyId: string
  tenantName: string | null
  status: 'occupied' | 'vacant' | 'maintenance' | 'available' | 'reserved'
  rent: string
  rentPeriod: string
  bedrooms: number
  bathrooms: number
  size: string
  floor: number | null
}

const UnitInfoCard = ({ unitData }: { unitData?: UnitViewData }) => {
  const [pendingChange, setPendingChange] = useState<UnitPriceChangeLog | null>(null)

  const statusColor: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    occupied: 'success',
    vacant: 'warning',
    available: 'warning',
    maintenance: 'error',
    reserved: 'info'
  }

  useEffect(() => {
    const unitId = unitData?.id

    if (!unitId) {
      setPendingChange(null)

      return
    }

    let active = true

    getUnitPriceHistory(unitId).then(history => {
      if (!active) return

      const today = new Date()

      today.setHours(0, 0, 0, 0)

      // History is newest-created first; surface the nearest change still in the future.
      const upcoming = history
        .filter(change => {
          const effective = new Date(change.effectiveDate)

          return !Number.isNaN(effective.getTime()) && effective > today
        })
        .sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime())[0]

      setPendingChange(upcoming ?? null)
    })

    return () => {
      active = false
    }
  }, [unitData?.id])

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
              <Typography variant='h6'>
                {unitData?.rent} <span className='text-sm font-normal text-textSecondary'>/ {unitData?.rentPeriod}</span>
              </Typography>
              {pendingChange && (
                <Alert severity='info' sx={{ mt: 1 }}>
                  Rent will change from {formatCurrency(pendingChange.oldRent, pendingChange.currency)} to{' '}
                  {formatCurrency(pendingChange.newRent, pendingChange.currency)} on{' '}
                  {formatDate(pendingChange.effectiveDate)}
                </Alert>
              )}
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='body2' color='text.secondary'>
                Floor
              </Typography>
              <Typography variant='h6'>{unitData?.floor !== null ? unitData?.floor : '-'}</Typography>
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
          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='body2' color='text.secondary'>
                Current Tenant
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

