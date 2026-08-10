'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useReferenceData } from '@/contexts/ReferenceDataContext'
import { searchPlaces, type PlaceSuggestion, type ReverseResolved } from '@/lib/api/places'
import type { PostcodeDistrict } from '@/lib/api/reference'
import { parseGhanaPostCode } from '@/lib/ghanaPostCode'
import { decodePrefix, loadPostcodeTable, type DecodedAddress } from '@/lib/postcodeTable'
import type { CapturedPosition } from '@/components/address/UnifiedAddressField.types'

const MIN_QUERY_LENGTH = 3
const SEARCH_DEBOUNCE_MS = 400

/**
 * One list, three sources. Picking any row is the same gesture, so the
 * landlord does not have to know which machinery produced the answer.
 */
export type AddressRow =
  | { kind: 'location'; resolved: ReverseResolved | null; position: CapturedPosition }
  | { kind: 'place'; place: PlaceSuggestion }
  | { kind: 'manual' }

/**
 * How long after typing stops before a code-shaped input becomes a chip.
 *
 * Not per keystroke: the parser deliberately accepts 6-9 digits so that it
 * matches the backend rule for rule, which means an intermediate typing state
 * can match a code the landlord has not finished. Waiting for a pause, and
 * letting a later keystroke replace the chip, makes an early commit
 * self-correcting rather than sticky.
 */
export const CODE_COMMIT_DEBOUNCE_MS = 400

type Props = {
  gpsCode: string
  onGpsCodeChange: (code: string) => void

  /**
   * The decoded district, or null when the prefix maps to nothing. Null
   * matters as much as a hit: a landlord correcting GD-184-7915 to GL-100-0001
   * must not be left with Adentan standing under a warning that says we do not
   * know the district.
   */
  onDecoded: (decoded: DecodedAddress | null) => void

  onPlaceSelected: (place: PlaceSuggestion) => void
  onManual: () => void
  onUnavailable?: () => void

  disabled?: boolean
  size?: 'small' | 'medium'
}

/**
 * One field for the whole address question.
 *
 * A landlord has one of three things: an address they can name, a Ghana Post
 * GPS code, or the ability to stand at the property. Asking them to choose
 * between three inputs first makes our problem theirs, so the field decides
 * from what they type and the dropdown carries every candidate.
 */
const UnifiedAddressField = ({
  gpsCode,
  onGpsCodeChange,
  onDecoded,
  onPlaceSelected,
  onManual,
  onUnavailable,
  disabled,
  size = 'small'
}: Props) => {
  const { ref } = useReferenceData()

  const [input, setInput] = useState('')
  const [table, setTable] = useState<PostcodeDistrict[] | null>(null)
  const [unknownPrefix, setUnknownPrefix] = useState(false)

  const [options, setOptions] = useState<PlaceSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const requestId = useRef(0)

  // The decode is one-shot per distinct code. Re-deriving on every render
  // would silently undo a district the landlord corrected by hand afterwards.
  const decodedFor = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    loadPostcodeTable()
      .then(rows => !cancelled && setTable(rows))

      // The field still accepts and stores a code without the table; it just
      // cannot fill anything from it. Degrading to "type it and pick your
      // district" beats blocking the form on a reference fetch.
      .catch(() => !cancelled && setTable([]))

    return () => {
      cancelled = true
    }
  }, [])

  const commitCode = (normalised: string) => {
    onGpsCodeChange(normalised)
    setInput('')
  }

  useEffect(() => {
    const parsed = parseGhanaPostCode(input)

    if (!parsed) return

    const timer = setTimeout(() => commitCode(parsed.normalised), CODE_COMMIT_DEBOUNCE_MS)

    return () => clearTimeout(timer)

    // commitCode closes over stable callback props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input])

  useEffect(() => {
    const parsed = parseGhanaPostCode(gpsCode)

    if (!parsed) {
      decodedFor.current = null
      setUnknownPrefix(false)

      return
    }

    if (!table || decodedFor.current === parsed.normalised) return

    decodedFor.current = parsed.normalised

    const decoded = decodePrefix(table, parsed.prefix)

    setUnknownPrefix(!decoded)
    onDecoded(decoded)

    // onDecoded is a callback prop; callers pass a stable handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsCode, table])

  useEffect(() => {
    // Bump on every effect run — not only when a request is dispatched. A
    // query change, the field clearing, or a disabled/unavailable flip must
    // all invalidate anything already in flight, otherwise a slow response for
    // a query the user has since erased can land late and repopulate stale
    // suggestions.
    const id = ++requestId.current

    if (unavailable || disabled) {
      setLoading(false)

      return
    }

    const trimmed = input.trim()

    // Code-shaped text is not an address query.
    if (parseGhanaPostCode(trimmed) || trimmed.length < MIN_QUERY_LENGTH) {
      setOptions([])
      setLoading(false)

      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)

      const result = await searchPlaces(trimmed)

      if (id !== requestId.current) return

      setLoading(false)

      if (result.status === 'unavailable') {
        setUnavailable(true)
        setOptions([])
        onUnavailable?.()

        return
      }

      setOptions(result.suggestions)
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)

    // onUnavailable is a callback prop; callers pass a stable handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, unavailable, disabled])

  /** "Ayawaso West Municipal, Greater Accra" — the slugs resolved to labels. */
  const describeWhere = (option: PlaceSuggestion) => {
    const region = ref.regions.find(r => r.value === option.region)
    const district = region?.districts?.find(d => d.value === option.district)

    // Falls back to the slug rather than showing nothing: a missing label
    // should still disambiguate two rows.
    return [district?.label ?? option.district, region?.label ?? option.region].filter(Boolean).join(', ')
  }

  const rows: AddressRow[] = [...options.map(place => ({ kind: 'place' as const, place })), { kind: 'manual' as const }]

  const pick = (row: AddressRow | null) => {
    if (!row) return

    setInput('')

    if (row.kind === 'place') onPlaceSelected(row.place)
    if (row.kind === 'manual') onManual()
  }

  /**
   * Removing the chip clears the code and nothing else — deliberately not
   * onDecoded(null), which would take the region and district with it.
   */
  const removeCode = () => {
    decodedFor.current = null
    setUnknownPrefix(false)
    onGpsCodeChange('')
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      const parsed = parseGhanaPostCode(input)

      if (parsed) {
        event.preventDefault()
        commitCode(parsed.normalised)
      }

      return
    }

    if (event.key === 'Backspace' && input === '' && gpsCode) removeCode()
  }

  return (
    <>
      <Autocomplete
        fullWidth
        disabled={disabled}
        options={rows}
        filterOptions={x => x}
        inputValue={input}
        onInputChange={(_, next) => setInput(next)}
        value={null}
        onChange={(_, row) => pick(row)}
        getOptionLabel={row =>
          row.kind === 'place' ? row.place.label : row.kind === 'manual' ? 'Enter the address manually' : ''
        }
        renderOption={(props, row) => {
          const { key, ...rest } = props as typeof props & { key: string }

          if (row.kind === 'manual') {
            return (
              <li key='manual' {...rest}>
                <Typography variant='body2' color='primary'>
                  <i className='ri-pencil-line mie-2' />
                  Enter the address manually
                </Typography>
              </li>
            )
          }

          if (row.kind === 'place') {
            const where = describeWhere(row.place)

            return (
              <li
                key={`${row.place.placeId ?? ''}|${row.place.region}|${row.place.district}|${row.place.city}`}
                {...rest}
              >
                <Box>
                  <Typography variant='body2'>{row.place.label}</Typography>
                  {where && (
                    <Typography variant='caption' color='text.secondary'>
                      {where}
                    </Typography>
                  )}
                </Box>
              </li>
            )
          }

          return <li key='location' {...rest} />
        }}
        renderInput={params => (
          <TextField
            {...params}
            size={size}
            label='Address'
            placeholder='Search an address, or enter a GPS code'
            onKeyDown={handleKeyDown}
            helperText='Optional — a Ghana Post GPS code fills in the region and district.'
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position='start'>
                    <i className='ri-map-pin-line' />
                  </InputAdornment>
                  {gpsCode && (
                    <Chip
                      size='small'
                      label={gpsCode}
                      onDelete={removeCode}
                      deleteIcon={

                        // MUI's default delete icon is aria-hidden with no
                        // accessible name — a mouse-only affordance, on the
                        // theory that keyboard/AT users delete via Backspace
                        // on the focused chip instead. That leaves no name
                        // for a screen reader user driving by touch/click, so
                        // this overrides it with a real one rather than
                        // leaving the "x" unlabelled.
                        <IconButton size='small' aria-label='Remove address code' sx={{ p: 0 }}>
                          <i className='ri-close-line' />
                        </IconButton>
                      }
                    />
                  )}
                  {params.InputProps.startAdornment}
                </>
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

      {unknownPrefix && (
        <Typography variant='caption' color='warning.main' className='mts-1 block'>
          Code saved. We don&apos;t recognise this prefix — please choose the region and district below.
        </Typography>
      )}
    </>
  )
}

export default UnifiedAddressField
