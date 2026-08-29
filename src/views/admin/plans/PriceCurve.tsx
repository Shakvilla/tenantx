'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

// API Imports
import { getPriceCurve, type PriceCurve as PriceCurveData } from '@/lib/api/subscription-plans-admin'

/**
 * What a portfolio of each size would pay, and whether the shape is sane.
 *
 * This is not decoration. A tier table is easy to get subtly wrong in a way that punishes growth —
 * a later band charging MORE per unit than an earlier one — and that is the mistake the endpoint
 * exists to catch. It is stated in words, naming the band where the rate goes up, rather than left
 * for an admin to notice in a column of numbers.
 *
 * The numbers in the table below are averages, and an average legitimately climbs whenever a plan
 * has a free allowance: PRO gives five units free and then charges 30, so it reads 15 per unit at
 * ten and 29.40 at 250 without anyone being punished for growing. That is why the warning is
 * driven by the tier table's rates and not by this column.
 *
 * It prices the plan as SAVED, not the table being edited: the endpoint is reached through a plan
 * id, and slice A deliberately shipped no preview for an unsaved table. The label says so, because
 * an admin who read this as a live preview would draw exactly the wrong conclusion from it.
 */

interface PriceCurveProps {
  /** Null while creating — there is no saved plan to price yet. */
  planId: string | null
}

const PriceCurve = ({ planId }: PriceCurveProps) => {
  const [curve, setCurve] = useState<PriceCurveData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!planId) return

    let cancelled = false

    setLoading(true)
    getPriceCurve(planId)
      .then(data => {
        if (!cancelled) setCurve(data)
      })
      .catch(() => {
        if (!cancelled) setError('Could not price this plan. Its tier table may be incomplete.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [planId])

  if (!planId) {
    return (
      <Typography variant='body2' color='text.secondary'>
        The price curve appears once the plan is saved.
      </Typography>
    )
  }

  if (loading) return <Skeleton variant='rectangular' height={200} />
  if (error) return <Alert severity='warning'>{error}</Alert>
  if (!curve) return null

  return (
    <Box>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
        What each portfolio size pays on the <strong>saved</strong> plan. Unsaved edits are not
        reflected here.
      </Typography>

      {!curve.monotonic && (
        <Alert severity='warning' sx={{ mb: 2 }}>
          The per-unit rate <strong>goes up</strong> from {curve.risingAt.join(' and ')} unit
          {curve.risingAt.length === 1 && curve.risingAt[0] === 1 ? '' : 's'}. A landlord who
          crosses that threshold pays more for every further unit than a smaller one does.
        </Alert>
      )}

      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Units</TableCell>
            <TableCell align='right'>Total</TableCell>
            <TableCell align='right'>Per unit</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {curve.points.map(point => (
            <TableRow key={point.quantity} selected={curve.risingAt.includes(point.quantity)}>
              <TableCell>{point.quantity}</TableCell>
              <TableCell align='right'>
                {point.salesLed ? 'Talk to sales' : point.amount}
              </TableCell>
              <TableCell align='right'>{point.salesLed ? '—' : point.effectiveUnitPrice}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

export default PriceCurve
