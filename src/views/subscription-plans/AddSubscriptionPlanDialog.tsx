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
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Chip from '@mui/material/Chip'

// Type Imports
import type {
  SubscriptionPlan,
  PlanFormDataType,
  PlanTier,
  PlanStatus,
  BillingCycle
} from '@/types/subscription-plans/subscriptionPlanTypes'

type Props = {
  open: boolean
  handleClose: () => void
  plansData?: SubscriptionPlan[]
  setData: (data: SubscriptionPlan[]) => void
  editData?: SubscriptionPlan | null
  mode?: 'add' | 'edit'
}

const initialData: PlanFormDataType = {
  name: '',
  tier: 'basic',
  description: '',
  status: 'active',
  price: '',
  currency: '₵',
  billingCycle: 'monthly',
  trialPeriod: '',
  maxProperties: '',
  maxTenants: '',
  maxUnits: '',
  maxDocuments: '',
  maxUsers: '',
  features: [],
  isPopular: false
}

const AddSubscriptionPlanDialog = ({ open, handleClose, plansData, setData, editData, mode = 'add' }: Props) => {
  // States
  const [formData, setFormData] = useState<PlanFormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof PlanFormDataType, boolean>>>({})
  const [expanded, setExpanded] = useState<string | false>('basic-info')
  const [newFeature, setNewFeature] = useState('')

  // Get initial form data based on mode
  const getInitialFormData = (): PlanFormDataType => {
    if (mode === 'edit' && editData) {
      return {
        name: editData.name || '',
        tier: editData.tier || 'basic',
        description: editData.description || '',
        status: editData.status || 'active',
        price: editData.price || '',
        currency: editData.currency || '₵',
        billingCycle: editData.billingCycle || 'monthly',
        trialPeriod: editData.trialPeriod?.toString() || '',
        maxProperties: editData.maxProperties === -1 ? 'unlimited' : editData.maxProperties?.toString() || '',
        maxTenants: editData.maxTenants === -1 ? 'unlimited' : editData.maxTenants?.toString() || '',
        maxUnits: editData.maxUnits === -1 ? 'unlimited' : editData.maxUnits?.toString() || '',
        maxDocuments: editData.maxDocuments === -1 ? 'unlimited' : editData.maxDocuments?.toString() || '',
        maxUsers: editData.maxUsers === -1 ? 'unlimited' : editData.maxUsers?.toString() || '',
        features: editData.features || [],
        isPopular: editData.isPopular || false
      }
    }
    return initialData
  }

  // Reset form when dialog opens/closes or editData changes
  useEffect(() => {
    if (open) {
      const newFormData = getInitialFormData()
      setFormData(newFormData)
      setErrors({})
      setExpanded('basic-info')
      setNewFeature('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData, mode])

  const handleExpandChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const handleInputChange = (
    field: keyof PlanFormDataType,
    value: string | PlanTier | PlanStatus | BillingCycle | boolean | string[]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }))
    }
  }

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const parseLimit = (value: string): number => {
    if (value.toLowerCase() === 'unlimited' || value === '-1') {
      return -1
    }
    const num = parseInt(value, 10)
    return isNaN(num) ? 0 : num
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PlanFormDataType, boolean>> = {}

    if (!formData.name.trim()) newErrors.name = true
    if (!formData.price.trim() && formData.tier !== 'free') newErrors.price = true
    if (!formData.description.trim()) newErrors.description = true

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    if (mode === 'add') {
      const newPlan: SubscriptionPlan = {
        id: Date.now(),
        name: formData.name,
        tier: formData.tier,
        description: formData.description,
        status: formData.status,
        price: formData.tier === 'free' ? '0' : formData.price,
        currency: formData.currency,
        billingCycle: formData.billingCycle,
        trialPeriod: parseInt(formData.trialPeriod) || 0,
        maxProperties: parseLimit(formData.maxProperties),
        maxTenants: parseLimit(formData.maxTenants),
        maxUnits: parseLimit(formData.maxUnits),
        maxDocuments: parseLimit(formData.maxDocuments),
        maxUsers: parseLimit(formData.maxUsers),
        features: formData.features,
        isPopular: formData.isPopular
      }

      if (plansData && setData) {
        setData([...plansData, newPlan])
      }
    } else if (mode === 'edit' && editData) {
      const updatedPlan: SubscriptionPlan = {
        ...editData,
        name: formData.name,
        tier: formData.tier,
        description: formData.description,
        status: formData.status,
        price: formData.tier === 'free' ? '0' : formData.price,
        currency: formData.currency,
        billingCycle: formData.billingCycle,
        trialPeriod: parseInt(formData.trialPeriod) || 0,
        maxProperties: parseLimit(formData.maxProperties),
        maxTenants: parseLimit(formData.maxTenants),
        maxUnits: parseLimit(formData.maxUnits),
        maxDocuments: parseLimit(formData.maxDocuments),
        maxUsers: parseLimit(formData.maxUsers),
        features: formData.features,
        isPopular: formData.isPopular
      }

      if (plansData && setData) {
        setData(plansData.map(plan => (plan.id === editData.id ? updatedPlan : plan)))
      }
    }

    handleClose()
    setFormData(initialData)
    setErrors({})
    setNewFeature('')
  }

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
    setErrors({})
    setNewFeature('')
  }

  return (
    <Dialog open={open} onClose={handleReset} maxWidth='lg' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>{mode === 'edit' ? 'Edit Subscription Plan' : 'Add Subscription Plan'}</span>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div className='flex flex-col gap-4 mbs-4'>
          {/* Basic Information Section */}
          <Accordion expanded={expanded === 'basic-info'} onChange={handleExpandChange('basic-info')}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-vip-crown-line text-xl' />
                <Typography variant='h6'>Basic Information</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Plan Name'
                    placeholder='e.g., Pro Plan'
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    error={Boolean(errors.name)}
                    helperText={errors.name ? 'This field is required.' : ''}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel id='tier-label'>Tier</InputLabel>
                    <Select
                      size='small'
                      labelId='tier-label'
                      label='Tier'
                      value={formData.tier}
                      onChange={e => handleInputChange('tier', e.target.value as PlanTier)}
                    >
                      <MenuItem value='free'>Free</MenuItem>
                      <MenuItem value='basic'>Basic</MenuItem>
                      <MenuItem value='pro'>Pro</MenuItem>
                      <MenuItem value='enterprise'>Enterprise</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    size='small'
                    fullWidth
                    multiline
                    rows={3}
                    label='Description'
                    placeholder='Describe the plan features and benefits'
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    error={Boolean(errors.description)}
                    helperText={errors.description ? 'This field is required.' : ''}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel id='status-label'>Status</InputLabel>
                    <Select
                      size='small'
                      labelId='status-label'
                      label='Status'
                      value={formData.status}
                      onChange={e => handleInputChange('status', e.target.value as PlanStatus)}
                    >
                      <MenuItem value='active'>Active</MenuItem>
                      <MenuItem value='inactive'>Inactive</MenuItem>
                      <MenuItem value='archived'>Archived</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isPopular}
                        onChange={e => handleInputChange('isPopular', e.target.checked)}
                      />
                    }
                    label='Mark as Popular'
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Pricing Section */}
          <Accordion expanded={expanded === 'pricing'} onChange={handleExpandChange('pricing')}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-money-dollar-circle-line text-xl' />
                <Typography variant='h6'>Pricing</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Price'
                    placeholder='0'
                    type='number'
                    value={formData.price}
                    onChange={e => handleInputChange('price', e.target.value)}
                    error={Boolean(errors.price)}
                    helperText={errors.price ? 'This field is required for paid plans.' : ''}
                    disabled={formData.tier === 'free'}
                    required={formData.tier !== 'free'}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Currency'
                    placeholder='₵'
                    value={formData.currency}
                    onChange={e => handleInputChange('currency', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel id='billing-cycle-label'>Billing Cycle</InputLabel>
                    <Select
                      size='small'
                      labelId='billing-cycle-label'
                      label='Billing Cycle'
                      value={formData.billingCycle}
                      onChange={e => handleInputChange('billingCycle', e.target.value as BillingCycle)}
                    >
                      <MenuItem value='monthly'>Monthly</MenuItem>
                      <MenuItem value='quarterly'>Quarterly</MenuItem>
                      <MenuItem value='yearly'>Yearly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Trial Period (days)'
                    placeholder='0'
                    type='number'
                    value={formData.trialPeriod}
                    onChange={e => handleInputChange('trialPeriod', e.target.value)}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Limits Section */}
          <Accordion expanded={expanded === 'limits'} onChange={handleExpandChange('limits')}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-bar-chart-line text-xl' />
                <Typography variant='h6'>Limits</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Max Properties'
                    placeholder='0 or unlimited'
                    value={formData.maxProperties}
                    onChange={e => handleInputChange('maxProperties', e.target.value)}
                    helperText='Enter number or "unlimited"'
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Max Tenants'
                    placeholder='0 or unlimited'
                    value={formData.maxTenants}
                    onChange={e => handleInputChange('maxTenants', e.target.value)}
                    helperText='Enter number or "unlimited"'
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Max Units'
                    placeholder='0 or unlimited'
                    value={formData.maxUnits}
                    onChange={e => handleInputChange('maxUnits', e.target.value)}
                    helperText='Enter number or "unlimited"'
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Max Documents'
                    placeholder='0 or unlimited'
                    value={formData.maxDocuments}
                    onChange={e => handleInputChange('maxDocuments', e.target.value)}
                    helperText='Enter number or "unlimited"'
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Max Users'
                    placeholder='0 or unlimited'
                    value={formData.maxUsers}
                    onChange={e => handleInputChange('maxUsers', e.target.value)}
                    helperText='Enter number or "unlimited"'
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Features Section */}
          <Accordion expanded={expanded === 'features'} onChange={handleExpandChange('features')}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-checkbox-multiple-line text-xl' />
                <Typography variant='h6'>Features</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                  <div className='flex flex-col gap-4'>
                    <div className='flex gap-2'>
                      <TextField
                        size='small'
                        fullWidth
                        placeholder='Add a feature'
                        value={newFeature}
                        onChange={e => setNewFeature(e.target.value)}
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddFeature()
                          }
                        }}
                      />
                      <Button variant='outlined' onClick={handleAddFeature} startIcon={<i className='ri-add-line' />}>
                        Add
                      </Button>
                    </div>
                    {formData.features.length > 0 && (
                      <Box className='flex flex-wrap gap-2 p-4 border rounded'>
                        {formData.features.map((feature, index) => (
                          <Chip
                            key={index}
                            label={feature}
                            onDelete={() => handleRemoveFeature(index)}
                            size='small'
                            variant='tonal'
                            color='primary'
                          />
                        ))}
                      </Box>
                    )}
                  </div>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </div>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleReset}>
          Cancel
        </Button>
        <Button variant='contained' color='primary' onClick={handleSubmit}>
          {mode === 'edit' ? 'Update' : 'Save Now'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddSubscriptionPlanDialog
