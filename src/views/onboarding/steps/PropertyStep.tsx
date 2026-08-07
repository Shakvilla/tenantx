'use client'

import { useState, useEffect } from 'react'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormHelperText from '@mui/material/FormHelperText'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import { createProperty } from '@/lib/api/properties'
import { getCities as fetchCities } from '@/lib/api/reference'
import { useReferenceData } from '@/contexts/ReferenceDataContext'
import type { Property } from '@/types/property'
import type { OnboardingStepProps } from '../onboardingTypes'
import AddressSearchField from '@/components/address/AddressSearchField'
import type { PlaceSuggestion } from '@/lib/api/places'
import { applyPlaceToForm, describeAutofill } from '@/views/properties/addressAutofill'

export default function PropertyStep({ tenantId, onComplete, onSkip }: OnboardingStepProps) {
  const { ref, getDistricts } = useReferenceData()
  const [form, setForm] = useState({ name: '', type: '', region: '', district: '', city: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [autofillNote, setAutofillNote] = useState<string | null>(null)
  const [coordinates, setCoordinates] = useState<{
    latitude: number
    longitude: number
    placeId: string
  } | null>(null)

  // True only right after a suggestion filled city from its region-wide
  // locality fallback (district: null, city set) — the exact case
  // describeAutofill tells the user to "choose the district below". The
  // region/district/city cascade in update() must not then wipe the very
  // city it just told them was filled. One-shot: cleared the moment any
  // field edit consumes or bypasses it.
  const [cityFromAutofill, setCityFromAutofill] = useState(false)

  const districts = form.region ? getDistricts(form.region) : []
  const [cities, setCities] = useState<string[]>([])

  // 'idle': no district picked yet. 'loading': fetch in flight. 'loaded': fetch
  // resolved (cities may legitimately be empty). 'error': fetch failed. Kept
  // separate from `cities` itself because an empty array alone can't
  // distinguish "still loading" from "the request failed" from "this district
  // genuinely has no localities" — see `valid` below.
  const [citiesStatus, setCitiesStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [citiesRetryTick, setCitiesRetryTick] = useState(0)

  // Localities are no longer in the bulk reference payload — 7,000 of them would
  // be ten times the size of everything else the dashboard loads up front.
  useEffect(() => {
    if (!form.district) {
      setCities([])
      setCitiesStatus('idle')

      return
    }

    let cancelled = false

    setCitiesStatus('loading')

    fetchCities(form.district)
      .then(list => {
        if (!cancelled) {
          setCities(list)
          setCitiesStatus('loaded')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCities([])
          setCitiesStatus('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [form.district, citiesRetryTick])

  const retryCitiesFetch = () => setCitiesRetryTick(t => t + 1)

  // An empty `cities` array alone can't tell "still loading", "fetch failed" and
  // "this district genuinely has no localities" apart — only a completed
  // ('loaded') fetch that came back empty may waive the City requirement.
  const valid =
    form.name && form.type && form.region && form.district && (form.city || (citiesStatus === 'loaded' && cities.length === 0))

  // Cascade resets so a stale district/city can't survive a region change.
  const update = (field: keyof typeof form, value: string) => {
    // A suggestion with district: null fills city from its region-wide
    // locality fallback and tells the user (via autofillNote) to pick the
    // district below. Consumed once, here — the cascade below must not then
    // clear that same city.
    const preserveCityOnDistrictChange = field === 'district' && cityFromAutofill

    setForm(prev => {
      const next = { ...prev, [field]: value }

      if (field === 'region') {
        next.district = ''
        next.city = ''
      } else if (field === 'district' && !preserveCityOnDistrictChange) {
        next.city = ''
      }


return next
    })

    // Coordinates and the autofill note describe one specific picked place —
    // not the address fields in general. The moment the user hand-edits any
    // part of the address (region, district or city), those two no longer
    // describe what the form holds: submitting the old lat/lng/placeId next
    // to a hand-picked district would be wrong in a way that looks deliberate.
    // Unrelated fields (name, type) leave both untouched.
    if (field === 'region' || field === 'district' || field === 'city') {
      setCoordinates(null)
      setAutofillNote(null)

      // preserveCityOnDistrictChange (above) already captured whatever
      // cityFromAutofill was before this edit, so the cascade above still
      // saw the correct value. Clearing it here — only for address-field
      // edits — means a second district change won't preserve a city that
      // was already consumed or was never autofilled to begin with.
      if (cityFromAutofill) {
        setCityFromAutofill(false)
      }
    }
  }

  const handlePlaceSelected = (place: PlaceSuggestion) => {
    setForm(prev => applyPlaceToForm(prev, place))
    setCoordinates({
      latitude: place.latitude,
      longitude: place.longitude,
      placeId: place.placeId
    })
    setAutofillNote(describeAutofill(place))
    setCityFromAutofill(!place.district && Boolean(place.city))
  }

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
        <Grid size={{ xs: 12 }}>
          <AddressSearchField onSelect={handlePlaceSelected} />
          {autofillNote && (
            <Box sx={{ mt: 1, fontSize: '0.75rem', color: 'success.main' }}>{autofillNote}</Box>
          )}
        </Grid>
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
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth required>
            <InputLabel id='property-step-region-label'>Region</InputLabel>
            <Select
              labelId='property-step-region-label'
              label='Region'
              value={form.region}
              onChange={e => update('region', e.target.value)}
            >
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
            <InputLabel id='property-step-district-label'>District</InputLabel>
            <Select
              labelId='property-step-district-label'
              label='District'
              value={form.district}
              onChange={e => update('district', e.target.value)}
            >
              {districts.map(d => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormControl fullWidth required disabled={!form.district || citiesStatus === 'loading'}>
            <InputLabel id='property-step-city-label'>City / area</InputLabel>
            <Select
              labelId='property-step-city-label'
              label='City / area'
              value={form.city}
              onChange={e => update('city', e.target.value)}
            >
              {/* A city assigned outside the fetched list (autofilled from an address
                  search whose locality fetch then failed, or any other case where the
                  value predates/outlives `cities`) has nowhere else to render — MUI
                  falls back to a blank Select when the current value matches no
                  MenuItem, which reads as if the pick was lost even though form.city
                  is still correct. */}
              {form.city && !cities.includes(form.city) && (
                <MenuItem value={form.city}>{form.city}</MenuItem>
              )}
              {cities.map(c => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
            {citiesStatus === 'loading' && <FormHelperText>Loading areas…</FormHelperText>}
          </FormControl>
          {citiesStatus === 'error' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Typography variant='caption' color='error'>
                Couldn&apos;t load areas for this district.
              </Typography>
              <Button size='small' onClick={retryCitiesFetch}>
                Retry
              </Button>
            </Box>
          )}
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
