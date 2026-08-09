'use client'

import { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

export type CapturedPosition = {
  latitude: number
  longitude: number
  /** The browser's own radius of uncertainty. Carried, never discarded. */
  accuracyMetres: number
}

type Props = {
  onCaptured: (position: CapturedPosition) => void
  disabled?: boolean
}

/**
 * Beyond this, the reading is described as approximate rather than as a
 * position.
 *
 * A GPS fix is 5-20m and a wifi fix 20-100m — both are genuinely "where the
 * property is". An IP-derived fix can be kilometres, which is a different kind
 * of answer wearing the same shape. 100m is where "my building" stops being a
 * reasonable reading of the number.
 */
const APPROXIMATE_ABOVE_METRES = 100

/** Long enough for a cold GPS lock, short enough not to look hung. */
const TIMEOUT_MS = 15_000

/**
 * GeolocationPositionError codes, by their spec-stable numbers rather than
 * the constants on the error instance. Those constants are only present when
 * the object really is a GeolocationPositionError; a polyfill or a bare
 * `{ code }` delivers undefined, every comparison falls through, and the
 * landlord gets "try again in a moment" when the real answer was "allow
 * location access" — advice that can never work.
 */
const PERMISSION_DENIED = 1
const TIMED_OUT = 3

/**
 * Capture the property's position from the landlord's own device.
 *
 * This is the highest-accuracy, lowest-cost thing available: a phone standing
 * at the property typically gives a 5-20m fix, comparable to Ghana Post's 5m
 * grid, with no API key and no billing. It is also the only source that works
 * for a property no geocoder has ever heard of.
 *
 * The accuracy is shown rather than hidden, because all three fix qualities
 * arrive through the identical API and land in the identical columns. A cache
 * that quietly alters values, an autofill note claiming a field it never
 * filled, and a 3km fix rendered as a position are the same mistake.
 */
const UseMyLocationButton = ({ onCaptured, disabled }: Props) => {
  const [supported, setSupported] = useState(false)
  const [busy, setBusy] = useState(false)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Read on the client only: `navigator` does not exist while the server
  // renders, and assuming support would render a button that throws on click.
  useEffect(() => {
    setSupported(typeof navigator !== 'undefined' && Boolean(navigator.geolocation))
  }, [])

  if (!supported) return null

  const capture = () => {
    setBusy(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude, accuracy: reported } = position.coords

        setAccuracy(reported)
        setBusy(false)
        // Reported even when poor — the landlord asked, and withholding it
        // would be its own dishonesty. The accuracy travels with it so the
        // record says how far to trust it.
        onCaptured({ latitude, longitude, accuracyMetres: reported })
      },
      failure => {
        setBusy(false)
        setAccuracy(null)

        // Three different problems with three different remedies. Collapsing
        // them into "couldn't get your location" leaves the landlord with
        // nothing to act on.
        setError(
          failure.code === PERMISSION_DENIED
            ? 'We need permission to use your location. Allow it in your browser, then try again.'
            : failure.code === TIMED_OUT
              ? 'That took too long. Being outdoors usually helps — try again.'
              : "Your device couldn't get a location right now. Try again in a moment."
        )
      },
      {
        enableHighAccuracy: true,
        timeout: TIMEOUT_MS,
        // A cached fix from another part of town, presented as "your current
        // location", is wrong in a way nothing on screen would reveal.
        maximumAge: 0
      }
    )
  }

  const approximate = accuracy !== null && accuracy > APPROXIMATE_ABOVE_METRES

  return (
    <Box>
      <Button
        size='small'
        variant='outlined'
        disabled={disabled || busy}
        onClick={capture}
        startIcon={busy ? <CircularProgress size={14} /> : <i className='ri-crosshair-line' />}
      >
        {accuracy !== null || error ? 'Use my current location (try again)' : 'Use my current location'}
      </Button>

      {accuracy !== null && (
        <Typography
          variant='caption'
          color={approximate ? 'warning.main' : 'success.main'}
          className='mts-1 block'
        >
          {approximate
            ? `Approximate only — accurate to about ${formatMetres(accuracy)}. Standing outside at the property gives a much better reading.`
            : `Located to within ${formatMetres(accuracy)}.`}
        </Typography>
      )}

      {error && (
        <Typography variant='caption' color='error' className='mts-1 block'>
          {error}
        </Typography>
      )}
    </Box>
  )
}

/** "8 m" / "3.0 km" — a four-digit metre count reads as false precision. */
function formatMetres(metres: number): string {
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`
}

export default UseMyLocationButton
