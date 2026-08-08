'use client'

import { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'

import AddressSearchField from '@/components/address/AddressSearchField'
import { useReferenceData } from '@/contexts/ReferenceDataContext'
import { getCities as fetchCities } from '@/lib/api/reference'
import type { PlaceSuggestion } from '@/lib/api/places'
import { applyPlaceToForm, describeAutofill } from '@/views/properties/addressAutofill'

export type AddressValue = { region: string; district: string; city: string }

export type AddressCoordinates = { latitude: number; longitude: number; placeId: string }

type Props = {
  value: AddressValue
  onChange: (patch: Partial<AddressValue>) => void
  onCoordinates: (coords: AddressCoordinates | null) => void
  /**
   * false in edit mode — the update endpoint cannot save what the search
   * fills: `UpdatePropertyRequest` carries neither the coordinates nor a
   * hand-picked region/district, because the edit payload sources those from
   * `editData` rather than `formData`.
   */
  searchable?: boolean
  errors?: Partial<Record<keyof AddressValue, boolean>>
  size?: 'small' | 'medium'
  cityLabel?: string
  onStatusChange?: (status: { canWaiveCity: boolean }) => void
}

/**
 * Region / District / City, plus the address search that fills them.
 *
 * Extracted from AddPropertyDialog and PropertyStep, which held ten pieces of
 * identical address state between them. That duplication is why the last
 * review's autofilled-city bug had to be found once and fixed twice.
 */
const PropertyAddressFields = ({
  value,
  onChange,
  onCoordinates,
  searchable = true,
  errors = {},
  size = 'small',
  cityLabel = 'City',
  onStatusChange
}: Props) => {
  const { ref } = useReferenceData()

  const [autofillNote, setAutofillNote] = useState<string | null>(null)

  // Set only by onUnavailable, alongside the setMode('manual') call it makes
  // in the same batch. AddressSearchField's own "search is unavailable"
  // helper text unmounts with it — this is what lets manual mode carry that
  // reason forward instead of silently swallowing it.
  const [searchUnavailable, setSearchUnavailable] = useState(false)

  // 'searching': nothing picked yet, search only. 'resolved': a place was
  // picked, shown as text. 'manual': the selects are open.
  //
  // Manual is terminal within a session. There is deliberately no path back
  // to searching — a user who has started correcting by hand should not have
  // the search silently reclaim their fields.
  //
  // Seeded from `value`, not just `searchable`: AddPropertyDialog renders its
  // steps through a switch, so this component unmounts on every step change,
  // not only on dialog open/close. A remount with an already-filled value
  // (Previous, or the stepper) must come back showing the resolved text, not
  // an empty search box hiding an address the user already entered.
  const [mode, setMode] = useState<'searching' | 'resolved' | 'manual'>(() => {
    if (!searchable) return 'manual'

    return value.region || value.district || value.city ? 'resolved' : 'searching'
  })

  // True only right after a suggestion filled city from its region-wide
  // locality fallback (district: null, city set) — the exact case
  // describeAutofill tells the user to "choose the district below". The
  // cascade below must not then wipe the very city it just announced.
  // One-shot: cleared the moment an address-field edit consumes it.
  const [cityFromAutofill, setCityFromAutofill] = useState(false)

  const [cities, setCities] = useState<string[]>([])

  // 'idle': no district yet. 'loading': fetch in flight. 'loaded': resolved
  // (cities may legitimately be empty). 'error': fetch failed. Kept separate
  // from `cities` because an empty array alone cannot distinguish the three.
  const [citiesStatus, setCitiesStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [citiesRetryTick, setCitiesRetryTick] = useState(0)

  const districtsForRegion = ref.regions.find(r => r.value === value.region)?.districts ?? []

  // Localities are not in the bulk reference payload — 7,000 of them would be
  // ten times the size of everything else the dashboard loads up front.
  useEffect(() => {
    if (!value.district) {
      setCities([])
      setCitiesStatus('idle')

      return
    }

    let cancelled = false

    setCitiesStatus('loading')

    fetchCities(value.district)
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
  }, [value.district, citiesRetryTick])

  useEffect(() => {
    onStatusChange?.({ canWaiveCity: citiesStatus === 'loaded' && cities.length === 0 })

    // onStatusChange is a callback prop; callers pass a stable handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citiesStatus, cities.length])

  const handleFieldChange = (field: keyof AddressValue, next: string) => {
    // A suggestion with district: null fills city from the region-wide
    // locality fallback and tells the user to pick the district. Consumed
    // once, here — the cascade below must not clear that same city.
    const preserveCity = field === 'district' && cityFromAutofill

    const patch: Partial<AddressValue> = { [field]: next }

    if (field === 'region') {
      patch.district = ''
      patch.city = ''
    } else if (field === 'district' && !preserveCity) {
      patch.city = ''
    }

    onChange(patch)

    // Coordinates and the note describe one specific picked place. Once any
    // part of the address is hand-edited they no longer describe what the
    // form holds, and saving the old lat/lng beside a hand-picked district
    // would be wrong in a way that looks deliberate.
    onCoordinates(null)
    setAutofillNote(null)

    if (cityFromAutofill) {
      setCityFromAutofill(false)
    }
  }

  const handlePlaceSelected = (place: PlaceSuggestion) => {
    const next = applyPlaceToForm(value, place)

    // gpsCode is Ghana Post's digital address. No geocoder has it, so it is
    // never touched here even though it sits among the address fields.
    onChange({ region: next.region, district: next.district, city: next.city })
    onCoordinates({ latitude: place.latitude, longitude: place.longitude, placeId: place.placeId })
    setAutofillNote(describeAutofill(place))
    setCityFromAutofill(!place.district && Boolean(place.city))
    setMode('resolved')
  }

  const regionLabel = ref.regions.find(r => r.value === value.region)?.label ?? ''
  const districtLabel = districtsForRegion.find(d => d.value === value.district)?.label ?? ''

  // Slugs are how these are stored; they are not something to show a
  // landlord — but a failed label lookup (reference data still in flight, or
  // its fetch failed) must fall back to the stored value rather than an
  // empty string. Losing the label is a cosmetic slug; losing the value
  // entirely renders a blank line with a lone Change button and no select to
  // recover through, because all three values are non-empty.
  const regionDisplay = value.region ? regionLabel || value.region : ''
  const districtDisplay = value.district ? districtLabel || value.district : ''
  const resolvedParts = [regionDisplay, districtDisplay, value.city].filter(Boolean)

  // Extracted so each select can be rendered from either the `resolved`
  // branch (only the fields the geocoder could not fill) or the `manual`
  // branch (all three) without duplicating the field itself.
  const regionField = (
    <Grid key='region' size={{ xs: 12, sm: 6 }}>
      <FormControl fullWidth required error={Boolean(errors.region)} size={size}>
        <InputLabel id='address-region-label'>Region</InputLabel>
        <Select
          size={size}
          labelId='address-region-label'
          label='Region'
          value={value.region}
          onChange={e => handleFieldChange('region', e.target.value)}
        >
          <MenuItem value=''>Select Region</MenuItem>
          {ref.regions.map(r => (
            <MenuItem key={r.value} value={r.value}>
              {r.label}
            </MenuItem>
          ))}
        </Select>
        {errors.region && (
          <Typography variant='caption' color='error' className='mts-1'>
            This field is required.
          </Typography>
        )}
      </FormControl>
    </Grid>
  )

  const districtField = (
    <Grid key='district' size={{ xs: 12, sm: 6 }}>
      <FormControl fullWidth required error={Boolean(errors.district)} size={size} disabled={!value.region}>
        <InputLabel id='address-district-label'>District</InputLabel>
        <Select
          size={size}
          labelId='address-district-label'
          label='District'
          value={value.district}
          onChange={e => handleFieldChange('district', e.target.value)}
        >
          <MenuItem value=''>Select District</MenuItem>
          {districtsForRegion.map(d => (
            <MenuItem key={d.value} value={d.value}>
              {d.label}
            </MenuItem>
          ))}
        </Select>
        {errors.district && (
          <Typography variant='caption' color='error' className='mts-1'>
            This field is required.
          </Typography>
        )}
      </FormControl>
    </Grid>
  )

  const cityField = (
    <Grid key='city' size={{ xs: 12, sm: 6 }}>
      <FormControl
        fullWidth
        required
        error={Boolean(errors.city)}
        size={size}
        disabled={!value.district || citiesStatus === 'loading'}
      >
        <InputLabel id='address-city-label'>{cityLabel}</InputLabel>
        <Select
          size={size}
          labelId='address-city-label'
          label={cityLabel}
          value={value.city}
          onChange={e => handleFieldChange('city', e.target.value)}
        >
          <MenuItem value=''>Select {cityLabel}</MenuItem>
          {/* A city assigned outside the fetched list (autofilled from a search
          whose locality fetch then failed) has nowhere else to render — MUI
          falls back to a blank Select when the value matches no MenuItem,
          which reads as if the pick was lost. */}
          {value.city && !cities.includes(value.city) && <MenuItem value={value.city}>{value.city}</MenuItem>}
          {cities.map(c => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </Select>
        {citiesStatus === 'loading' && (
          <Typography variant='caption' color='text.secondary' className='mts-1'>
            Loading areas…
          </Typography>
        )}
        {citiesStatus === 'error' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <Typography variant='caption' color='error'>
              Couldn&apos;t load areas for this district.
            </Typography>
            <Button size='small' onClick={() => setCitiesRetryTick(t => t + 1)}>
              Retry
            </Button>
          </Box>
        )}
        {errors.city && citiesStatus === 'loaded' && (
          <Typography variant='caption' color='error' className='mts-1'>
            This field is required.
          </Typography>
        )}
      </FormControl>
    </Grid>
  )

  return (
    <>
      {searchable && mode !== 'manual' && (
        <Grid size={{ xs: 12 }}>
          <AddressSearchField
            onSelect={handlePlaceSelected}
            onUnavailable={() => {
              setSearchUnavailable(true)
              setMode('manual')
            }}
          />
          {autofillNote && (
            <Typography variant='caption' color='success.main' className='mts-1 block'>
              {autofillNote}
            </Typography>
          )}
          {mode === 'searching' && (
            <Button size='small' onClick={() => setMode('manual')} sx={{ mt: 1 }}>
              Can&apos;t find it? Enter the address manually
            </Button>
          )}
        </Grid>
      )}

      {mode === 'searching' && (
        <>
          {/* `errors` is otherwise consumed only inside the field variables,
              which mount just above in `resolved` and `manual` — never here.
              A user who ignores the search and clicks Next got a button that
              validateStep failed silently: nothing on screen named the
              missing field. Mirrors the `resolved` branch's own fallback
              rendering, just keyed on error instead of on absence. */}
          {errors.region && regionField}
          {errors.district && districtField}
          {errors.city && cityField}
        </>
      )}

      {mode === 'resolved' && (
        <>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='body2'>{resolvedParts.join(' › ')}</Typography>
              <Button size='small' onClick={() => setMode('manual')}>
                Change
              </Button>
            </Box>
          </Grid>
          {/* Only what the geocoder could not resolve. Region and district
              resolve in practice almost always; the city is the usual gap. */}
          {!value.region && regionField}
          {!value.district && districtField}
          {!value.city && cityField}
        </>
      )}

      {mode === 'manual' && (
        <>
          {searchUnavailable && (
            <Grid size={{ xs: 12 }}>
              <Typography variant='caption' color='text.secondary' className='block'>
                Address search is unavailable — enter the address below.
              </Typography>
            </Grid>
          )}
          {regionField}
          {districtField}
          {cityField}
        </>
      )}
    </>
  )
}

export default PropertyAddressFields
