'use client'

import { useEffect, useRef, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import UnifiedAddressField from '@/components/address/UnifiedAddressField'
import type { CapturedPosition } from '@/components/address/UnifiedAddressField.types'
import { useReferenceData } from '@/contexts/ReferenceDataContext'
import { getCities as fetchCities } from '@/lib/api/reference'
import type { PlaceSuggestion, ReverseResolved } from '@/lib/api/places'
import type { DecodedAddress } from '@/lib/postcodeTable'
import { describeAccuracy } from '@/components/address/accuracy'
import { applyPlaceToForm, describeAutofill } from '@/views/properties/addressAutofill'

export type AddressValue = { gpsCode: string; street: string; region: string; district: string; city: string }

export type AddressCoordinates = {
  latitude: number
  longitude: number
  /** Null for a device capture — there is no geocoder place behind it. */
  placeId: string | null
  /**
   * The device's reported radius of uncertainty. Undefined for a geocoded
   * address, which states no uncertainty of its own — that is "unknown", not
   * "perfect".
   */
  accuracyMetres?: number
}

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

  /**
   * The `accuracyMetres` of the coordinates the CALLER currently holds, so the
   * accuracy caption can be restored on a remount.
   *
   * AddPropertyDialog renders this block inside a step switch, so it unmounts
   * on every Next and remounts on Previous — the same remount that forced the
   * postcode table's module-scope memo. Without a seed, `capturedAccuracy`
   * comes back null while the parent still holds the position, and the caption
   * silently disappears from a position that is still going to be saved.
   *
   * Pass it straight from the coordinates: `coordinates?.accuracyMetres`. Null
   * or undefined when there are none, or when they came from a geocoded place
   * (which states no accuracy of its own) — this must never name a number for
   * coordinates the caller is no longer holding.
   */
  capturedAccuracyMetres?: number | null
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
  onStatusChange,
  capturedAccuracyMetres
}: Props) => {
  const { ref } = useReferenceData()

  const [autofillNote, setAutofillNote] = useState<string | null>(null)

  // Set only by onUnavailable, alongside the setMode('manual') call it makes
  // in the same batch. The field's own dropdown has nothing left to say once
  // the geocoder is down — this is what lets manual mode carry that reason
  // forward instead of silently swallowing it.
  const [searchUnavailable, setSearchUnavailable] = useState(false)

  // Fields the caller has errored at least once while still in `searching`
  // mode. Add-only for the life of the mount — never removed, including when
  // the live `errors` prop later clears.
  //
  // Regression from IMPORTANT 1's own fix: a caller (both forms do this)
  // clears a field's error the moment its patch carries a non-empty value.
  // Gating the searching-mode fallback on the live `errors` value directly
  // meant a field surfaced by an error vanished the instant the user
  // answered it — Region disappears on picking Region, District disappears
  // on picking District, leaving a screen that looks untouched right after
  // the user did the thing that was asked of them. Tracking surfaced fields
  // separately, and only ever adding to the set, keeps a field on screen
  // once shown so the user can see what they just picked.
  const [surfacedFields, setSurfacedFields] = useState<Set<keyof AddressValue>>(() => new Set())

  useEffect(() => {
    const newlyErrored = (['region', 'district', 'city'] as const).filter(
      field => errors[field] && !surfacedFields.has(field)
    )

    if (newlyErrored.length === 0) return

    setSurfacedFields(prev => {
      const next = new Set(prev)

      newlyErrored.forEach(field => next.add(field))

      return next
    })

    // errors is a plain object literal from the caller on every render;
    // comparing its three keys, not its identity, is what makes this only
    // fire when an error actually newly appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors.region, errors.district, errors.city])

  // 'searching': nothing picked yet, search only. 'resolved': a place was
  // picked, shown as text. 'manual': the selects are open.
  //
  // Nothing here ever returns to 'searching': the mode only ever advances to
  // 'resolved' or 'manual'. Since the one address field stays mounted in all
  // three, a landlord correcting by hand can still pick a suggestion or a
  // captured location, and handlePlaceSelected / handleLocationPicked will
  // move them to 'resolved' and collapse the selects. That is deliberate —
  // it takes an explicit pick. What must not happen is the search reclaiming
  // hand-entered fields on its own, and no code path does.
  //
  // Seeded from `value`, not just `searchable`: AddPropertyDialog renders its
  // steps through a switch, so this component unmounts on every step change,
  // not only on dialog open/close. A remount with an already-filled value
  // (Previous, or the stepper) must come back showing the resolved text, not
  // an empty search box hiding an address the user already entered.
  const [mode, setMode] = useState<'searching' | 'resolved' | 'manual'>(() => {
    if (!searchable) return 'manual'
    if (value.region || value.district || value.city) return 'resolved'

    // Street alone means the user took the manual path and typed only the
    // street line before navigating away. Seeding `resolved` here would
    // render an empty locality line beside a lone Change button; seeding
    // `searching` would hide the street they already typed.
    if (value.street) return 'manual'

    return 'searching'
  })

  // What the digital-address decode last filled, so an unrecognised code can
  // retract exactly that and nothing else.
  const lastDecoded = useRef<DecodedAddress | null>(null)

  // True only right after a suggestion filled city from its region-wide
  // locality fallback (district: null, city set) — the exact case
  // describeAutofill tells the user to "choose the district below". The
  // cascade below must not then wipe the very city it just announced.
  // One-shot: cleared the moment an address-field edit consumes it.
  const [cityFromAutofill, setCityFromAutofill] = useState(false)

  // A contested location awaiting an answer, and nothing else. An
  // uncontested pick is applied straight away by handleLocationPicked, so a
  // non-null proposal always means "the code and the location disagree".
  const [proposal, setProposal] = useState<ReverseResolved | null>(null)

  // The accuracy of the device fix currently held, or null when the
  // coordinates are not a device fix (or there are none). Stated on screen for
  // exactly as long as it is true: the dropdown row says it once and then
  // disappears, and nothing else in the app renders accuracyMetres, so
  // dropping it here would leave a saved position with nothing saying how far
  // to trust it. Every path that changes what onCoordinates holds updates this
  // in the same breath.
  //
  // Seeded from the caller, not from nothing, for the same reason `mode` is
  // seeded from `value`: this block unmounts on every step change, and the
  // parent goes on holding the coordinates across it. Lazy, so it seeds once
  // per mount — the clearing paths below own it from then on, and re-reading
  // the prop on later renders would resurrect a caption they just cleared.
  const [capturedAccuracy, setCapturedAccuracy] = useState<number | null>(() => capturedAccuracyMetres ?? null)

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

  // `street` is deliberately not assignable here: every path through this
  // function clears the coordinates, which is wrong for the street line.
  // See handleStreetChange.
  const handleFieldChange = (field: Exclude<keyof AddressValue, 'street' | 'gpsCode'>, next: string) => {
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
    setCapturedAccuracy(null)
    setAutofillNote(null)

    if (cityFromAutofill) {
      setCityFromAutofill(false)
    }
  }

  /**
   * Unlike the other three, editing the street does NOT clear the
   * coordinates.
   *
   * The geocoder rarely returns a street for a Ghanaian locality, so the
   * expected flow after picking "East Legon" is to type the house number and
   * street it never knew. Treating that as "the address no longer describes
   * the picked place" would drop the coordinates from very nearly every
   * property saved. Region, district and city still clear them: changing one
   * of those genuinely contradicts the place that was picked, whereas adding
   * detail beneath it does not.
   */
  const handleStreetChange = (next: string) => {
    onChange({ street: next })
  }

  /**
   * The code is a label the landlord types; editing it changes nothing about
   * where the property is, so it leaves the coordinates alone — same reasoning
   * as handleStreetChange.
   *
   * Removing it (the chip's ×, or backspace on an empty input) deliberately
   * does NOT retract what the code filled — region and district may since have
   * been confirmed by hand, and emptying a filled form as a side effect of
   * removing something else is worse than a stale value the landlord can see.
   * But `lastDecoded` has to go, because it is the claim "the digital address
   * says X", and there is no digital address any more. Left standing, the next
   * confident location pick asks "Your digital address is in X, but your
   * location looks like Y — which is right?" about a code that is not there.
   */
  const handleGpsCodeChange = (next: string) => {
    if (!next) lastDecoded.current = null

    onChange({ gpsCode: next })
  }

  /**
   * A recognised prefix fills region and district. City is cleared with them:
   * a city from a previously-chosen district, sitting under a district the
   * code just supplied, is wrong in a way that looks deliberate — the same
   * rule applyPlaceToForm already follows.
   */
  const handleDecoded = (decoded: DecodedAddress | null) => {
    if (decoded) {
      lastDecoded.current = decoded
      onChange({ region: decoded.regionValue, district: decoded.districtValue, city: '' })
      setMode('resolved')

      return
    }

    // The code no longer maps to a district. Anything a PREVIOUS code filled
    // has to go with it: leaving Accra Metropolitan on screen beneath "we
    // don't recognise that code's district" both contradicts the message and
    // would save the wrong district for a Ledzokuku property.
    //
    // Only what a decode put there, though — a district the landlord picked
    // by hand is theirs, and typing an unrecognised code is no reason to
    // throw it away.
    const previous = lastDecoded.current

    if (
      previous &&
      value.region === previous.regionValue &&
      value.district === previous.districtValue
    ) {
      lastDecoded.current = null
      onChange({ region: '', district: '', city: '' })
      setMode('manual')
    }
  }

  /**
   * A device fix is the most accurate position available for a Ghanaian
   * property, and the only one that works for a building no geocoder knows.
   * It carries no placeId — there is no geocoder place behind it — and the
   * reported accuracy travels with it so the record says how far to trust it.
   *
   * The address fields are left alone: turning a coordinate back into a
   * district is offered as a row, not applied.
   */
  const handlePositionCaptured = (position: CapturedPosition) => {
    onCoordinates({
      latitude: position.latitude,
      longitude: position.longitude,
      placeId: null,
      accuracyMetres: position.accuracyMetres
    })

    setCapturedAccuracy(position.accuracyMetres)
  }

  /**
   * The landlord has chosen the captured location. If a digital address says
   * otherwise, that disagreement is now worth raising — a mistyped code and a
   * capture taken at home both look like this, and neither is automatically
   * right, so it is a question rather than a correction.
   *
   * Only against a CONFIDENT position. A guess tens of kilometres from the
   * nearest locality node disagreeing with the code proves nothing, and
   * treating that as a conflict would cry wolf on every rural property.
   */
  const handleLocationPicked = (resolved: ReverseResolved) => {
    const decoded = lastDecoded.current

    if (
      decoded &&
      resolved.confident &&
      value.district === decoded.districtValue &&
      resolved.district !== decoded.districtValue
    ) {
      setProposal(resolved)

      return
    }

    onChange({ region: resolved.region, district: resolved.district, city: resolved.city })
    setMode('resolved')
  }

  const acceptProposal = () => {
    if (!proposal) return

    onChange({ region: proposal.region, district: proposal.district, city: proposal.city })
    setProposal(null)
    setMode('resolved')
  }

  const keepTheCode = () => setProposal(null)

  const handlePlaceSelected = (place: PlaceSuggestion) => {
    const next = applyPlaceToForm(value, place)

    // gpsCode is Ghana Post's digital address. No geocoder has it, so it is
    // never touched here even though it sits among the address fields.
    onChange({ street: next.street, region: next.region, district: next.district, city: next.city })

    // Coordinates only from a geocoded place, which is exactly what having a
    // placeId means. Our own catalogue's coordinates are the LOCALITY's
    // centre — the middle of a neighbourhood, potentially kilometres from the
    // property — and saving that in the same latitude/longitude columns a
    // building-level fix uses would be indistinguishable from real precision.
    // A property with no coordinates is honest; one pinned to the middle of
    // Adenta is not.
    if (place.placeId) {
      onCoordinates({ latitude: place.latitude, longitude: place.longitude, placeId: place.placeId })
    } else {
      onCoordinates(null)
    }

    // Either way the device fix is gone: a geocoded address states no
    // uncertainty of its own, so leaving "Located to within 8 m" underneath it
    // would attribute a phone's reading to a place the phone never saw.
    setCapturedAccuracy(null)

    setAutofillNote(describeAutofill(place))
    setCityFromAutofill(!place.district && Boolean(place.city))
    setMode('resolved')
  }

  // The label for whatever the digital address decoded to, so the conflict
  // question can name both districts rather than one slug and one label.
  const decodedDistrictLabel =
    ref.regions
      .flatMap(r => r.districts ?? [])
      .find(d => d.value === lastDecoded.current?.districtValue)?.label ??
    lastDecoded.current?.districtValue ??
    ''

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

  // Always an input, never collapsed into the resolved text: it is the one
  // part of an address the geocoder usually cannot supply, so the user has to
  // be able to type it whatever mode they arrived in. Optional — plenty of
  // Ghanaian properties are identified by locality and GPS code alone, with
  // no street name to give.
  const streetField = (
    <Grid key='street' size={{ xs: 12 }}>
      <TextField
        fullWidth
        size={size}
        label='Street / House Address'
        placeholder='e.g. 23 Lagos Avenue, House No. 12 Block C'
        value={value.street}
        onChange={e => handleStreetChange(e.target.value)}
        helperText='Optional — the building number and street, if it has one.'
      />
    </Grid>
  )

  return (
    <>
      <Grid size={{ xs: 12 }}>
        <UnifiedAddressField
          gpsCode={value.gpsCode}
          onGpsCodeChange={handleGpsCodeChange}
          onDecoded={handleDecoded}
          onPlaceSelected={handlePlaceSelected}
          onPositionCaptured={handlePositionCaptured}
          onLocationPicked={handleLocationPicked}
          onManual={() => setMode('manual')}
          onUnavailable={() => {
            setSearchUnavailable(true)
            setMode('manual')
          }}
          searchDisabled={!searchable}
          size={size}
        />

        {autofillNote && (
          <Typography variant='caption' color='success.main' className='mts-1 block'>
            {autofillNote}
          </Typography>
        )}

        {/* Stays for as long as the coordinates do. The dropdown row states
            the accuracy once and then vanishes with the pick, and nothing else
            in the app renders accuracyMetres — so without this a landlord ends
            up with a saved position and no way to tell a 8 m fix from a 3 km
            one. */}
        {capturedAccuracy !== null &&
          (() => {
            const { text, approximate } = describeAccuracy(capturedAccuracy)

            return (
              <Typography
                variant='caption'
                color={approximate ? 'warning.main' : 'success.main'}
                className='mts-1 block'
              >
                {text}
              </Typography>
            )
          })()}

        {proposal && (
          <Box sx={{ mt: 1 }}>
            <Typography variant='body2'>
              Your digital address is in <strong>{decodedDistrictLabel}</strong>, but your location looks like{' '}
              <strong>{proposal.districtLabel}</strong>. Which is right?
            </Typography>
            <Typography variant='caption' color='text.secondary' className='block'>
              A mistyped code and a location captured somewhere other than the property both look like this.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Button size='small' onClick={keepTheCode}>
                Keep the code
              </Button>
              <Button size='small' onClick={acceptProposal}>
                Use my location
              </Button>
            </Box>
          </Box>
        )}
      </Grid>

      {mode === 'searching' && (
        <>
          {/* `errors` is otherwise consumed only inside the field variables,
              which mount just above in `resolved` and `manual` — never here.
              A user who ignores the search and clicks Next got a button that
              validateStep failed silently: nothing on screen named the
              missing field. Mirrors the `resolved` branch's own fallback
              rendering, just keyed on `surfacedFields` (sticky) instead of
              on absence — keying on the live `errors` value directly made a
              field vanish the instant its error cleared, i.e. the instant
              the user answered it. */}
          {surfacedFields.has('region') && regionField}
          {surfacedFields.has('district') && districtField}
          {surfacedFields.has('city') && cityField}
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
          {streetField}
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
          {streetField}
        </>
      )}
    </>
  )
}

export default PropertyAddressFields
