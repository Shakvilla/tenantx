'use client'

import { useState } from 'react'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import { createProperty } from '@/lib/api/properties'
import { useReferenceData } from '@/contexts/ReferenceDataContext'
import type { Property } from '@/types/property'
import type { OnboardingStepProps } from '../onboardingTypes'
import PropertyAddressFields from '@/components/address/PropertyAddressFields'
import type { AddressValue } from '@/components/address/PropertyAddressFields'

export default function PropertyStep({ tenantId, onComplete, onSkip }: OnboardingStepProps) {
  const { ref } = useReferenceData()
  const [form, setForm] = useState({ name: '', type: '', street: '', region: '', district: '', city: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [coordinates, setCoordinates] = useState<{
    latitude: number
    longitude: number
    placeId: string
  } | null>(null)

  const [canWaiveCity, setCanWaiveCity] = useState(false)

  const valid = form.name && form.type && form.region && form.district && (form.city || canWaiveCity)

  const update = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAddressChange = (patch: Partial<AddressValue>) => setForm(prev => ({ ...prev, ...patch }))

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)

    try {
      const res = await createProperty(tenantId, {
        name: form.name,
        type: form.type as Property['type'],
        ownership: 'own',
        condition: 'good',
        region: form.region,
        district: form.district,
        currency: 'GHS',
        ...(coordinates ?? {}),
        address: {
          // Optional, and never the city: writing the city into
          // address_line_1 is what made every property's street a duplicate.
          street: form.street || undefined,
          city: form.city,
          state: form.region,
          country: 'Ghana'
        }
      })

      if (!res.success || !res.data?.id) {
        setError(res.error?.message ?? 'Could not create property. Please try again.')
        
return
      }

      onComplete({ propertyId: res.data.id })
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Could not create property. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box>
      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={4}>
        <PropertyAddressFields
          value={{ street: form.street, region: form.region, district: form.district, city: form.city }}
          onChange={handleAddressChange}
          onCoordinates={setCoordinates}
          size='medium'
          cityLabel='City / area'
          onStatusChange={({ canWaiveCity: waive }) => setCanWaiveCity(waive)}
        />
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label='Property name'
            required
            value={form.name}
            onChange={e => update('name', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth required>
            <InputLabel id='property-step-type-label'>Property type</InputLabel>
            <Select
              labelId='property-step-type-label'
              label='Property type'
              value={form.type}
              onChange={e => update('type', e.target.value)}
            >
              {ref.propertyTypes.map(t => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant='text' color='inherit' onClick={onSkip} disabled={submitting}>
            Skip this step
          </Button>
          <Button
            variant='contained'
            disabled={!valid || submitting}
            onClick={handleSubmit}
            endIcon={submitting ? <CircularProgress size={18} color='inherit' /> : undefined}
          >
            Save &amp; continue
          </Button>
        </Grid>
      </Grid>
    </Box>
  )
}
