'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// Type Imports
import type { PlanTier } from '@/lib/api/subscription-plans-admin'

/**
 * The tier table, edited so that an invalid one cannot be expressed.
 *
 * The admin sets each band's UPPER bound and its prices. Lower bounds are DERIVED — a band always
 * begins one above its predecessor — and the last band is always open-ended. Gaps, overlaps and
 * second open-ended bands therefore have no representation here at all.
 *
 * This is not client-side validation, and must not be described as such. The server's
 * `TierTableValidator` remains the authority and still refuses a bad table with a 422; this
 * construction just means an honest mistake never reaches it. If the two ever disagree, the
 * server wins.
 */

// ---------------------------------------------------------------------------
// The arithmetic — pure, exported, and tested directly
// ---------------------------------------------------------------------------

/**
 * Rebuilds every lower bound from the band before it, and forces the last band open-ended.
 *
 * Every mutation below routes through this, so the invariant is re-established after each edit
 * rather than merely preserved by each one. That distinction matters: preserving an invariant
 * requires every operation to be correct, re-establishing it requires only this function to be.
 */
export function rechain(tiers: PlanTier[]): PlanTier[] {
  return tiers.map((tier, index) => {
    const fromQty = index === 0 ? 1 : (tiers[index - 1].toQty ?? tiers[index - 1].fromQty) + 1
    const isLast = index === tiers.length - 1

    return { ...tier, fromQty, toQty: isLast ? null : tier.toQty }
  })
}

/** Splits the open-ended band in two, leaving a new open-ended band at the end. */
export function addBand(tiers: PlanTier[]): PlanTier[] {
  const last = tiers[tiers.length - 1]
  const closedUpper = Math.max(last.fromQty, (last.fromQty ?? 1) + 9)

  return rechain([
    ...tiers.slice(0, -1),
    { ...last, toQty: closedUpper },
    { fromQty: closedUpper + 1, toQty: null, flatPrice: '0.00', perUnitPrice: '0.00' }
  ])
}

/**
 * Removes a band and re-chains its neighbours, so the hole closes rather than becoming a gap.
 *
 * The last band is never removed: a plan with no bands cannot price anything, and the server
 * refuses an empty tier list anyway.
 */
export function removeBand(tiers: PlanTier[], index: number): PlanTier[] {
  if (tiers.length <= 1) return tiers

  return rechain(tiers.filter((_, i) => i !== index))
}

/**
 * Sets one band's upper bound and re-chains everything after it.
 *
 * An upper bound at or below the band's own lower bound is ignored rather than applied and then
 * corrected — a band cannot end before it starts, and rejecting the edit keeps the table valid at
 * every keystroke instead of only after the next one.
 */
export function setUpperBound(tiers: PlanTier[], index: number, upper: number): PlanTier[] {
  if (index === tiers.length - 1) return tiers
  if (!Number.isFinite(upper) || upper <= tiers[index].fromQty) return tiers

  return rechain(tiers.map((tier, i) => (i === index ? { ...tier, toQty: upper } : tier)))
}

/** Sets a price on one band. Prices stay strings — see PlanTier's own note on precision. */
export function setPrice(
  tiers: PlanTier[],
  index: number,
  field: 'flatPrice' | 'perUnitPrice',
  value: string
): PlanTier[] {
  return tiers.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier))
}

// ---------------------------------------------------------------------------
// The component
// ---------------------------------------------------------------------------

interface TierTableEditorProps {
  value: PlanTier[]
  onChange: (tiers: PlanTier[]) => void
}

const TierTableEditor = ({ value, onChange }: TierTableEditorProps) => {
  return (
    <Box>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Units</TableCell>
            <TableCell>Flat price</TableCell>
            <TableCell>Per unit</TableCell>
            <TableCell align='right' />
          </TableRow>
        </TableHead>
        <TableBody>
          {value.map((tier, index) => {
            const isLast = index === value.length - 1

            return (
              <TableRow key={index}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Box className='flex items-center gap-2'>
                    {/* Derived, never typed: a band always begins one above its predecessor. */}
                    <Typography variant='body2'>{tier.fromQty}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      –
                    </Typography>
                    {isLast ? (
                      <Typography variant='body2' color='text.secondary'>
                        and above
                      </Typography>
                    ) : (
                      <TextField
                        size='small'
                        type='number'
                        value={tier.toQty ?? ''}
                        inputProps={{ min: tier.fromQty + 1, 'aria-label': `Band ${index + 1} upper bound` }}
                        onChange={e => onChange(setUpperBound(value, index, Number(e.target.value)))}
                        sx={{ width: 110 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <TextField
                    size='small'
                    value={tier.flatPrice}
                    inputProps={{ 'aria-label': `Band ${index + 1} flat price` }}
                    onChange={e => onChange(setPrice(value, index, 'flatPrice', e.target.value))}
                    sx={{ width: 120 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size='small'
                    value={tier.perUnitPrice}
                    inputProps={{ 'aria-label': `Band ${index + 1} per-unit price` }}
                    onChange={e => onChange(setPrice(value, index, 'perUnitPrice', e.target.value))}
                    sx={{ width: 120 }}
                  />
                </TableCell>
                <TableCell align='right'>
                  <IconButton
                    size='small'
                    aria-label={`Remove band ${index + 1}`}
                    disabled={value.length <= 1}
                    onClick={() => onChange(removeBand(value, index))}
                  >
                    <i className='ri-delete-bin-line text-[20px]' />
                  </IconButton>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <Button size='small' startIcon={<i className='ri-add-line' />} onClick={() => onChange(addBand(value))} sx={{ mt: 2 }}>
        Add band
      </Button>
    </Box>
  )
}

export default TierTableEditor
