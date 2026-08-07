'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'

import { searchPlaces, type PlaceSuggestion } from '@/lib/api/places'

const MIN_QUERY_LENGTH = 3
const DEBOUNCE_MS = 400

type Props = {
  onSelect: (place: PlaceSuggestion) => void
  disabled?: boolean
}

/**
 * Type an address, pick a place. Knows nothing about properties — `onSelect`
 * is the whole contract, so the same field serves any form that needs an
 * address.
 */
const AddressSearchField = ({ onSelect, disabled }: Props) => {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<PlaceSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    // Once the geocoder has told us it is down, stop asking. It is a free
    // community service and retrying on every keystroke is how you get blocked.
    if (unavailable || disabled) return

    const trimmed = query.trim()

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setOptions([])

      return
    }

    const id = ++requestId.current
    const timer = setTimeout(async () => {
      setLoading(true)

      const result = await searchPlaces(trimmed)

      // A slower earlier request must not overwrite a faster later one.
      if (id !== requestId.current) return

      setLoading(false)

      if (result.status === 'unavailable') {
        setUnavailable(true)
        setOptions([])

        return
      }

      setOptions(result.suggestions)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query, unavailable, disabled])

  const helperText = useMemo(() => {
    if (unavailable) return 'Address search is unavailable — enter the address below.'

    return 'Start typing an address, then pick it to fill in the fields below.'
  }, [unavailable])

  return (
    <Autocomplete
      fullWidth
      disabled={disabled || unavailable}
      options={options}
      filterOptions={x => x}
      getOptionLabel={option => option.label}
      isOptionEqualToValue={(a, b) => a.placeId === b.placeId}
      noOptionsText='No matching address'
      onInputChange={(_, value) => setQuery(value)}
      onChange={(_, value) => {
        if (value) onSelect(value)
      }}
      renderInput={params => (
        <TextField
          {...params}
          size='small'
          label='Search for an address'
          placeholder='e.g. East Legon, Accra'
          helperText={helperText}
          error={unavailable}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position='start'>
                <i className='ri-map-pin-line' />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
    />
  )
}

export default AddressSearchField
