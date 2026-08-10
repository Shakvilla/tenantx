'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { PostcodeDistrict } from '@/lib/api/reference'
import { parseGhanaPostCode } from '@/lib/ghanaPostCode'
import { decodePrefix, loadPostcodeTable, type DecodedAddress } from '@/lib/postcodeTable'

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
const UnifiedAddressField = ({ gpsCode, onGpsCodeChange, onDecoded, disabled, size = 'small' }: Props) => {
  const [input, setInput] = useState('')
  const [table, setTable] = useState<PostcodeDistrict[] | null>(null)
  const [unknownPrefix, setUnknownPrefix] = useState(false)

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
        options={[]}
        filterOptions={x => x}
        inputValue={input}
        onInputChange={(_, next) => setInput(next)}
        value={null}
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
