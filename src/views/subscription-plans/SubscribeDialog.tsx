// Documentation: /docs/subscription-plans/subscription-plans-module.md

'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

// Type Imports
import type { SubscriptionPlan, BillingCycle } from '@/types/subscription-plans/subscriptionPlanTypes'

type Props = {
  open: boolean
  handleClose: () => void
  plan: SubscriptionPlan | null
  billingCycle: BillingCycle
  onSubscribe?: (planId: number, billingCycle: BillingCycle) => void
}

const SubscribeDialog = ({ open, handleClose, plan, billingCycle: initialBillingCycle, onSubscribe }: Props) => {
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>(initialBillingCycle)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedBillingCycle(initialBillingCycle)
      setAcceptedTerms(false)
    }
  }, [open, initialBillingCycle])

  if (!plan) {
    return null
  }

  const calculatePrice = (cycle: BillingCycle): number => {
    const basePrice = parseFloat(plan.price) || 0
    if (plan.billingCycle === cycle) return basePrice

    // Convert to selected billing cycle
    if (cycle === 'monthly') {
      if (plan.billingCycle === 'quarterly') return basePrice / 3
      if (plan.billingCycle === 'yearly') return basePrice / 12
    } else if (cycle === 'quarterly') {
      if (plan.billingCycle === 'monthly') return basePrice * 3
      if (plan.billingCycle === 'yearly') return basePrice / 4
    } else if (cycle === 'yearly') {
      if (plan.billingCycle === 'monthly') return basePrice * 12
      if (plan.billingCycle === 'quarterly') return basePrice * 4
    }

    return basePrice
  }

  const formatLimit = (limit: number): string => {
    if (limit === -1) return 'Unlimited'
    if (limit === 0) return 'None'
    return limit.toString()
  }

  const handleSubscribe = () => {
    if (acceptedTerms && onSubscribe) {
      onSubscribe(plan.id, selectedBillingCycle)
      handleClose()
    }
  }

  const price = calculatePrice(selectedBillingCycle)

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>Subscribe to {plan.name}</span>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box className='flex flex-col gap-6 mbs-4'>
          {/* Plan Summary */}
          <Card variant='outlined'>
            <CardContent>
              <Box className='flex flex-col gap-4'>
                <Box className='flex items-center justify-between'>
                  <Typography variant='h6'>{plan.name}</Typography>
                  {plan.isPopular && (
                    <Chip label='Popular' size='small' color='primary' variant='tonal' />
                  )}
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  {plan.description}
                </Typography>
                <Divider />
                <Box className='flex flex-col gap-2'>
                  <Typography variant='body2' className='font-medium'>
                    Plan Includes:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant='body2' color='text.secondary'>
                        Properties: {formatLimit(plan.maxProperties)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant='body2' color='text.secondary'>
                        Tenants: {formatLimit(plan.maxTenants)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant='body2' color='text.secondary'>
                        Units: {formatLimit(plan.maxUnits)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant='body2' color='text.secondary'>
                        Users: {formatLimit(plan.maxUsers)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Billing Cycle Selection */}
          <FormControl fullWidth>
            <InputLabel id='billing-cycle-label'>Billing Cycle</InputLabel>
            <Select
              labelId='billing-cycle-label'
              label='Billing Cycle'
              value={selectedBillingCycle}
              onChange={e => setSelectedBillingCycle(e.target.value as BillingCycle)}
            >
              <MenuItem value='monthly'>Monthly</MenuItem>
              <MenuItem value='quarterly'>Quarterly</MenuItem>
              <MenuItem value='yearly'>Yearly</MenuItem>
            </Select>
          </FormControl>

          {/* Pricing Summary */}
          <Card variant='outlined'>
            <CardContent>
              <Box className='flex flex-col gap-2'>
                <Box className='flex items-center justify-between'>
                  <Typography variant='body2'>Plan Price</Typography>
                  <Typography variant='h6' color='primary'>
                    {plan.price === '0' ? 'Free' : `${plan.currency}${price.toFixed(2)}`}
                  </Typography>
                </Box>
                <Typography variant='caption' color='text.secondary' className='capitalize'>
                  Billed {selectedBillingCycle === 'monthly' ? 'monthly' : selectedBillingCycle === 'quarterly' ? 'quarterly' : 'annually'}
                </Typography>
                {plan.trialPeriod > 0 && (
                  <Chip
                    label={`${plan.trialPeriod}-day free trial`}
                    size='small'
                    color='success'
                    variant='tonal'
                    className='w-fit mts-2'
                  />
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Payment Method (Placeholder) */}
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='body2' className='font-medium mb-2'>
                Payment Method
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Payment gateway integration will be added here
              </Typography>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <FormControlLabel
            control={
              <Checkbox
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
              />
            }
            label={
              <Typography variant='body2'>
                I agree to the{' '}
                <Button variant='text' size='small' className='p-0 min-w-fit'>
                  Terms and Conditions
                </Button>
                {' '}and{' '}
                <Button variant='text' size='small' className='p-0 min-w-fit'>
                  Privacy Policy
                </Button>
              </Typography>
            }
          />
        </Box>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={handleSubscribe}
          disabled={!acceptedTerms}
          startIcon={<i className='ri-vip-crown-line' />}
        >
          Subscribe Now
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SubscribeDialog

