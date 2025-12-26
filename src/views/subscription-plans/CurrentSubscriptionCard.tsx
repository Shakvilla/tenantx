// Documentation: /docs/subscription-plans/subscription-plans-module.md

'use client'

// React Imports
import { useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'

// Type Imports
import type { Subscription, SubscriptionUsage } from '@/types/subscription-plans/subscriptionTypes'

type Props = {
  subscription: Subscription | null
  usage?: SubscriptionUsage
  onUpgrade?: () => void
  onDowngrade?: () => void
  onCancel?: () => void
}

const CurrentSubscriptionCard = ({ subscription, usage, onUpgrade, onDowngrade, onCancel }: Props) => {
  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    active: 'success',
    trial: 'info',
    expired: 'error',
    cancelled: 'warning'
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)

    
return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const calculateUsagePercentage = (used: number, limit: number): number => {
    if (limit === -1) return 0 // Unlimited
    if (limit === 0) return 0
    
return Math.min((used / limit) * 100, 100)
  }

  const formatLimit = (limit: number): string => {
    if (limit === -1) return 'Unlimited'
    
return limit.toString()
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent>
          <Box className='flex flex-col items-center justify-center gap-4 p-8'>
            <i className='ri-vip-crown-line text-6xl text-textDisabled' />
            <Typography variant='h6' color='text.secondary'>
              No Active Subscription
            </Typography>
            <Typography variant='body2' color='text.secondary' className='text-center'>
              Subscribe to a plan to unlock all features
            </Typography>
            {onUpgrade && (
              <Button variant='contained' color='primary' onClick={onUpgrade}>
                Browse Plans
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    )
  }

  const isTrial = subscription.status === 'trial'
  const isActive = subscription.status === 'active'
  const isExpired = subscription.status === 'expired'
  const isCancelled = subscription.status === 'cancelled'

  return (
    <Card>
      <CardContent>
        <Box className='flex flex-col gap-6'>
          {/* Header */}
          <Box className='flex items-center justify-between'>
            <Box className='flex flex-col gap-2'>
              <Typography variant='h5'>{subscription.planName}</Typography>
              <Chip
                variant='tonal'
                label={subscription.status}
                size='small'
                color={statusColors[subscription.status] || 'default'}
                className='capitalize w-fit'
              />
            </Box>
            <Box className='flex flex-col items-end gap-1'>
              <Typography variant='h6' color='primary'>
                {subscription.currency}
                {subscription.amount}
              </Typography>
              <Typography variant='caption' color='text.secondary' className='capitalize'>
                per {subscription.billingCycle}
              </Typography>
            </Box>
          </Box>

          <Divider />

          {/* Subscription Details */}
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant='body2' color='text.secondary'>
                Start Date
              </Typography>
              <Typography variant='body1' className='font-medium'>
                {formatDate(subscription.startDate)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant='body2' color='text.secondary'>
                {isTrial ? 'Trial Ends' : isCancelled ? 'Cancelled On' : 'Renews On'}
              </Typography>
              <Typography variant='body1' className='font-medium'>
                {isTrial && subscription.trialEndDate
                  ? formatDate(subscription.trialEndDate)
                  : formatDate(subscription.endDate)}
              </Typography>
            </Grid>
            {subscription.autoRenew && (
              <Grid size={{ xs: 12 }}>
                <Chip
                  label='Auto-renewal enabled'
                  size='small'
                  variant='tonal'
                  color='success'
                  icon={<i className='ri-checkbox-circle-line' />}
                />
              </Grid>
            )}
          </Grid>

          {/* Usage Statistics */}
          {usage && (
            <>
              <Divider />
              <Box className='flex flex-col gap-4'>
                <Typography variant='h6'>Usage Statistics</Typography>
                <Grid container spacing={4}>
                  {usage.propertiesLimit !== 0 && (
                    <Grid size={{ xs: 12 }}>
                      <Box className='flex flex-col gap-2'>
                        <Box className='flex items-center justify-between'>
                          <Typography variant='body2'>Properties</Typography>
                          <Typography variant='body2' className='font-medium'>
                            {usage.propertiesUsed} / {formatLimit(usage.propertiesLimit)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant='determinate'
                          value={calculateUsagePercentage(usage.propertiesUsed, usage.propertiesLimit)}
                          color={
                            calculateUsagePercentage(usage.propertiesUsed, usage.propertiesLimit) > 80
                              ? 'error'
                              : calculateUsagePercentage(usage.propertiesUsed, usage.propertiesLimit) > 60
                                ? 'warning'
                                : 'primary'
                          }
                        />
                      </Box>
                    </Grid>
                  )}
                  {usage.tenantsLimit !== 0 && (
                    <Grid size={{ xs: 12 }}>
                      <Box className='flex flex-col gap-2'>
                        <Box className='flex items-center justify-between'>
                          <Typography variant='body2'>Tenants</Typography>
                          <Typography variant='body2' className='font-medium'>
                            {usage.tenantsUsed} / {formatLimit(usage.tenantsLimit)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant='determinate'
                          value={calculateUsagePercentage(usage.tenantsUsed, usage.tenantsLimit)}
                          color={
                            calculateUsagePercentage(usage.tenantsUsed, usage.tenantsLimit) > 80
                              ? 'error'
                              : calculateUsagePercentage(usage.tenantsUsed, usage.tenantsLimit) > 60
                                ? 'warning'
                                : 'primary'
                          }
                        />
                      </Box>
                    </Grid>
                  )}
                  {usage.unitsLimit !== 0 && (
                    <Grid size={{ xs: 12 }}>
                      <Box className='flex flex-col gap-2'>
                        <Box className='flex items-center justify-between'>
                          <Typography variant='body2'>Units</Typography>
                          <Typography variant='body2' className='font-medium'>
                            {usage.unitsUsed} / {formatLimit(usage.unitsLimit)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant='determinate'
                          value={calculateUsagePercentage(usage.unitsUsed, usage.unitsLimit)}
                          color={
                            calculateUsagePercentage(usage.unitsUsed, usage.unitsLimit) > 80
                              ? 'error'
                              : calculateUsagePercentage(usage.unitsUsed, usage.unitsLimit) > 60
                                ? 'warning'
                                : 'primary'
                          }
                        />
                      </Box>
                    </Grid>
                  )}
                  {usage.usersLimit !== 0 && (
                    <Grid size={{ xs: 12 }}>
                      <Box className='flex flex-col gap-2'>
                        <Box className='flex items-center justify-between'>
                          <Typography variant='body2'>Users</Typography>
                          <Typography variant='body2' className='font-medium'>
                            {usage.usersUsed} / {formatLimit(usage.usersLimit)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant='determinate'
                          value={calculateUsagePercentage(usage.usersUsed, usage.usersLimit)}
                          color={
                            calculateUsagePercentage(usage.usersUsed, usage.usersLimit) > 80
                              ? 'error'
                              : calculateUsagePercentage(usage.usersUsed, usage.usersLimit) > 60
                                ? 'warning'
                                : 'primary'
                          }
                        />
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </>
          )}

          {/* Actions */}
          <Divider />
          <Box className='flex flex-wrap gap-2'>
            {isActive && onUpgrade && (
              <Button variant='outlined' color='primary' onClick={onUpgrade}>
                Upgrade Plan
              </Button>
            )}
            {isActive && onDowngrade && (
              <Button variant='outlined' color='secondary' onClick={onDowngrade}>
                Downgrade Plan
              </Button>
            )}
            {isActive && onCancel && (
              <Button variant='outlined' color='error' onClick={onCancel}>
                Cancel Subscription
              </Button>
            )}
            {isExpired && onUpgrade && (
              <Button variant='contained' color='primary' onClick={onUpgrade}>
                Renew Subscription
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default CurrentSubscriptionCard
