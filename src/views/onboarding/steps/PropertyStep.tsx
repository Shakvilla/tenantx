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

export default function PropertyStep({ tenantId, onComplete }: OnboardingStepProps) {
  const { ref, getDistricts, getCities } = useReferenceData()
  const [form, setForm] = useState({ name: '', type: '', region: '', district: '', city: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const districts = form.region ? getDistricts(form.region) : []
  const cities = form.region && form.district ? getCities(form.region, form.district) : []

  const valid = form.name && form.type && form.region && form.district && form.city

  // Cascade resets so a stale district/city can't survive a region change.
  const update = (field: keyof typeof form, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }

      if (field === 'region') {
        next.district = ''
        next.city = ''
      } else if (field === 'district') {
        next.city = ''
      }

      
return next
    })
  }

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)

    try {
      const res = await createProperty(tenantId, {
        name: form.name,
        type: form.type as Property['type'],
        ownership: 'own',
        region: form.region,
        district: form.district,
        currency: 'GHS',
        address: {
          street: form.city,
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
            <InputLabel>Property type</InputLabel>
            <Select label='Property type' value={form.type} onChange={e => update('type', e.target.value)}>
              {ref.propertyTypes.map(t => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth required>
            <InputLabel>Region</InputLabel>
            <Select label='Region' value={form.region} onChange={e => update('region', e.target.value)}>
              {ref.regions.map(r => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth required disabled={!form.region}>
            <InputLabel>District</InputLabel>
            <Select label='District' value={form.district} onChange={e => update('district', e.target.value)}>
              {districts.map(d => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormControl fullWidth required disabled={!form.district}>
            <InputLabel>City / area</InputLabel>
            <Select label='City / area' value={form.city} onChange={e => update('city', e.target.value)}>
              {cities.map(c => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
