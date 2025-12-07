// Documentation: /docs/subscription-plans/subscription-plans-module.md

'use client'

// React Imports
import { useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Checkbox from '@mui/material/Checkbox'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'

// Component Imports
import SubscribeDialog from './SubscribeDialog'

// Type Imports
import type { SubscriptionPlan, BillingCycle } from '@/types/subscription-plans/subscriptionPlanTypes'

type Props = {
  plans: SubscriptionPlan[]
  currentPlanId?: number
  onSubscribe?: (planId: number, billingCycle: BillingCycle) => void
}

const PlansComparisonView = ({ plans, currentPlanId, onSubscribe }: Props) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

  // Filter active plans only
  const activePlans = useMemo(() => {
    return plans.filter(plan => plan.status === 'active')
  }, [plans])

  // Get all unique features across all plans
  const allFeatures = useMemo(() => {
    const featureSet = new Set<string>()
    activePlans.forEach(plan => {
      plan.features.forEach(feature => featureSet.add(feature))
    })
    return Array.from(featureSet)
  }, [activePlans])

  const handleSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setSubscribeDialogOpen(true)
  }

  const formatLimit = (limit: number): string => {
    if (limit === -1) return 'Unlimited'
    if (limit === 0) return 'None'
    return limit.toString()
  }

  const calculatePrice = (plan: SubscriptionPlan, cycle: BillingCycle): number => {
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

  const hasFeature = (plan: SubscriptionPlan, feature: string): boolean => {
    return plan.features.includes(feature)
  }

  if (activePlans.length === 0) {
    return (
      <Box className='flex items-center justify-center p-12'>
        <Typography color='text.secondary'>No active plans available</Typography>
      </Box>
    )
  }

  return (
    <>
      <Box className='flex flex-col gap-6'>
        {/* Billing Cycle Toggle */}
        <Box className='flex justify-center'>
          <ToggleButtonGroup
            value={billingCycle}
            exclusive
            onChange={(_, value) => value && setBillingCycle(value)}
            size='small'
          >
            <ToggleButton value='monthly'>Monthly</ToggleButton>
            <ToggleButton value='quarterly'>Quarterly</ToggleButton>
            <ToggleButton value='yearly'>Yearly</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Plan Cards */}
        <Grid container spacing={4}>
          {activePlans.map(plan => {
            const isCurrentPlan = currentPlanId === plan.id
            const price = calculatePrice(plan, billingCycle)
            const isPopular = plan.isPopular

            return (
              <Grid size={{ xs: 12, sm: 6, md: 12 / activePlans.length }} key={plan.id}>
                <Card
                  className={isPopular ? 'relative border-2 border-primary' : 'relative'}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {isPopular && (
                    <Chip label='Most Popular' color='primary' size='small' className='absolute top-4 right-4' />
                  )}
                  <CardContent className='flex flex-col gap-4 flex-1'>
                    {/* Plan Header */}
                    <Box className='flex flex-col gap-2'>
                      <Typography variant='h5'>{plan.name}</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {plan.description}
                      </Typography>
                    </Box>

                    <Divider />

                    {/* Pricing */}
                    <Box className='flex flex-col gap-1'>
                      <Typography variant='h3' color='primary'>
                        {plan.price === '0' ? 'Free' : `${plan.currency}${price.toFixed(2)}`}
                      </Typography>
                      <Typography variant='body2' color='text.secondary' className='capitalize'>
                        per {billingCycle === 'monthly' ? 'month' : billingCycle === 'quarterly' ? 'quarter' : 'year'}
                      </Typography>
                      {plan.trialPeriod > 0 && (
                        <Typography variant='caption' color='text.secondary'>
                          {plan.trialPeriod}-day free trial
                        </Typography>
                      )}
                    </Box>

                    {/* Limits Summary */}
                    <Box className='flex flex-col gap-2'>
                      <Typography variant='body2' className='font-medium'>
                        Includes:
                      </Typography>
                      <List dense className='p-0'>
                        <ListItem className='p-0'>
                          <ListItemIcon className='min-w-[32px]'>
                            <i className='ri-building-line text-lg' />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${formatLimit(plan.maxProperties)} Properties`}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                        <ListItem className='p-0'>
                          <ListItemIcon className='min-w-[32px]'>
                            <i className='ri-group-line text-lg' />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${formatLimit(plan.maxTenants)} Tenants`}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                        <ListItem className='p-0'>
                          <ListItemIcon className='min-w-[32px]'>
                            <i className='ri-user-line text-lg' />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${formatLimit(plan.maxUsers)} Users`}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      </List>
                    </Box>

                    {/* Key Features */}
                    <Box className='flex flex-col gap-2 flex-1'>
                      <Typography variant='body2' className='font-medium'>
                        Key Features:
                      </Typography>
                      <List dense className='p-0'>
                        {plan.features.slice(0, 5).map((feature, index) => (
                          <ListItem key={index} className='p-0'>
                            <ListItemIcon className='min-w-[32px]'>
                              <i className='ri-check-line text-lg text-success' />
                            </ListItemIcon>
                            <ListItemText primary={feature} primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                        ))}
                        {plan.features.length > 5 && (
                          <Typography variant='caption' color='text.secondary' className='mts-1'>
                            +{plan.features.length - 5} more features
                          </Typography>
                        )}
                      </List>
                    </Box>

                    {/* Action Button */}
                    <Button
                      variant={isPopular ? 'contained' : 'outlined'}
                      color='primary'
                      fullWidth
                      onClick={() => handleSubscribe(plan)}
                      disabled={isCurrentPlan}
                      startIcon={isCurrentPlan ? <i className='ri-check-line' /> : <i className='ri-vip-crown-line' />}
                    >
                      {isCurrentPlan ? 'Current Plan' : 'Subscribe'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>

        {/* Feature Comparison Table */}
        {allFeatures.length > 0 && (
          <Card className='mts-6'>
            <CardContent>
              <Typography variant='h6' className='mb-4'>
                Feature Comparison
              </Typography>
              <Box className='overflow-x-auto'>
                <table className='w-full border-collapse'>
                  <thead>
                    <tr>
                      <th className='text-left p-2 border-b'>Feature</th>
                      {activePlans.map(plan => (
                        <th key={plan.id} className='text-center p-2 border-b'>
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allFeatures.map(feature => (
                      <tr key={feature}>
                        <td className='p-2 border-b'>{feature}</td>
                        {activePlans.map(plan => (
                          <td key={plan.id} className='text-center p-2 border-b'>
                            {hasFeature(plan, feature) ? (
                              <i className='ri-check-line text-success text-xl' />
                            ) : (
                              <i className='ri-close-line text-error text-xl' />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Subscribe Dialog */}
      {selectedPlan && (
        <SubscribeDialog
          open={subscribeDialogOpen}
          handleClose={() => {
            setSubscribeDialogOpen(false)
            setSelectedPlan(null)
          }}
          plan={selectedPlan}
          billingCycle={billingCycle}
          onSubscribe={onSubscribe}
        />
      )}
    </>
  )
}

export default PlansComparisonView
