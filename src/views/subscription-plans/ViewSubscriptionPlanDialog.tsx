// Documentation: /docs/subscription-plans/subscription-plans-module.md

'use client'

// React Imports
import { useMemo } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'

// Type Imports
import type { SubscriptionPlan } from '@/types/subscription-plans/subscriptionPlanTypes'

type Props = {
  open: boolean
  handleClose: () => void
  plan: SubscriptionPlan | null
}

const ViewSubscriptionPlanDialog = ({ open, handleClose, plan }: Props) => {
  const statusColors: Record<string, 'success' | 'warning' | 'error'> = {
    active: 'success',
    inactive: 'warning',
    archived: 'error'
  }

  const tierColors: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
    free: 'info',
    basic: 'primary',
    pro: 'success',
    enterprise: 'warning'
  }

  // Mock subscription count (in real app, this would come from API)
  const subscriptionCount = useMemo(() => {
    if (!plan) return 0
    // Mock: return a random number between 5 and 50
    return Math.floor(Math.random() * 45) + 5
  }, [plan])

  const formatLimit = (limit: number): string => {
    if (limit === -1) return 'Unlimited'
    return limit.toString()
  }

  if (!plan) {
    return null
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='lg' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>Plan Details</span>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Card className='previewCard'>
          <CardContent className='sm:!p-12'>
            <Grid container spacing={6}>
              {/* Header Section */}
              <Grid size={{ xs: 12 }}>
                <div className='p-6 bg-actionHover rounded'>
                  <div className='flex justify-between gap-y-4 flex-col sm:flex-row'>
                    <div className='flex flex-col gap-6'>
                      <div>
                        <Typography variant='h5'>{plan.name}</Typography>
                        <div className='flex items-center gap-2 mts-2'>
                          <Chip
                            variant='tonal'
                            label={plan.tier}
                            size='small'
                            color={tierColors[plan.tier] || 'default'}
                            className='capitalize'
                          />
                          <Chip
                            variant='tonal'
                            label={plan.status}
                            size='small'
                            color={statusColors[plan.status] || 'default'}
                            className='capitalize'
                          />
                          {plan.isPopular && <Chip variant='tonal' label='Popular' size='small' color='primary' />}
                        </div>
                      </div>
                    </div>
                    <div className='flex flex-col gap-6'>
                      <div className='flex flex-col gap-1'>
                        <Typography variant='h4' color='primary'>
                          {plan.price === '0' ? 'Free' : `${plan.currency}${plan.price}`}
                          <Typography component='span' variant='body2' color='text.secondary' className='ml-1'>
                            /
                            {plan.billingCycle === 'monthly'
                              ? 'month'
                              : plan.billingCycle === 'quarterly'
                                ? 'quarter'
                                : 'year'}
                          </Typography>
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {subscriptionCount} active subscriptions
                        </Typography>
                      </div>
                    </div>
                  </div>
                </div>
              </Grid>

              {/* Description */}
              <Grid size={{ xs: 12 }}>
                <Typography variant='body1' color='text.secondary'>
                  {plan.description}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider />
              </Grid>

              {/* Pricing Information */}
              <Grid size={{ xs: 12 }}>
                <Typography variant='h6' className='mb-4'>
                  Pricing Information
                </Typography>
                <Grid container spacing={6}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex items-center justify-between'>
                      <Typography variant='body2'>Price:</Typography>
                      <Typography className='font-medium' color='text.primary'>
                        {plan.price === '0' ? 'Free' : `${plan.currency}${plan.price}`}
                      </Typography>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex items-center justify-between'>
                      <Typography variant='body2'>Billing Cycle:</Typography>
                      <Typography className='font-medium capitalize' color='text.primary'>
                        {plan.billingCycle}
                      </Typography>
                    </div>
                  </Grid>
                  {plan.trialPeriod > 0 && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className='flex items-center justify-between'>
                        <Typography variant='body2'>Trial Period:</Typography>
                        <Typography className='font-medium' color='text.primary'>
                          {plan.trialPeriod} days
                        </Typography>
                      </div>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider />
              </Grid>

              {/* Limits */}
              <Grid size={{ xs: 12 }}>
                <Typography variant='h6' className='mb-4'>
                  Plan Limits
                </Typography>
                <Grid container spacing={6}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex items-center justify-between'>
                      <Typography variant='body2'>Max Properties:</Typography>
                      <Typography className='font-medium' color='text.primary'>
                        {formatLimit(plan.maxProperties)}
                      </Typography>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex items-center justify-between'>
                      <Typography variant='body2'>Max Tenants:</Typography>
                      <Typography className='font-medium' color='text.primary'>
                        {formatLimit(plan.maxTenants)}
                      </Typography>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex items-center justify-between'>
                      <Typography variant='body2'>Max Units:</Typography>
                      <Typography className='font-medium' color='text.primary'>
                        {formatLimit(plan.maxUnits)}
                      </Typography>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex items-center justify-between'>
                      <Typography variant='body2'>Max Documents:</Typography>
                      <Typography className='font-medium' color='text.primary'>
                        {formatLimit(plan.maxDocuments)}
                      </Typography>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex items-center justify-between'>
                      <Typography variant='body2'>Max Users:</Typography>
                      <Typography className='font-medium' color='text.primary'>
                        {formatLimit(plan.maxUsers)}
                      </Typography>
                    </div>
                  </Grid>
                </Grid>
              </Grid>

              {/* Features */}
              {plan.features.length > 0 && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant='h6' className='mb-4'>
                      Features
                    </Typography>
                    <Box className='flex flex-wrap gap-2'>
                      {plan.features.map((feature, index) => (
                        <Chip key={index} label={feature} size='small' variant='tonal' color='primary' />
                      ))}
                    </Box>
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 12 }}>
                <Divider className='border-dashed' />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant='body2' color='text.secondary'>
                  This plan is{' '}
                  {plan.status === 'active'
                    ? 'currently active'
                    : plan.status === 'inactive'
                      ? 'currently inactive'
                      : 'archived'}{' '}
                  and available for subscription.
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ViewSubscriptionPlanDialog
