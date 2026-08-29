'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// Type Imports
import type { BillingCycleName, PlanCycle } from '@/lib/api/subscription-plans-admin'

/**
 * Which cycles a plan offers, and at what discount.
 *
 * Two constraints come straight from the server and are enforced here rather than discovered on
 * save. The write body marks `cycles` non-empty, and the service replaces the rows WHOLESALE — so
 * an empty list does not mean "leave them alone", it deletes every one, after which
 * `PricingEngine.resolveDiscount` renews every annual subscriber at full price. MONTHLY is
 * therefore always emitted and cannot be switched off: a plan with no enabled cycle cannot be
 * billed at all.
 */

const ALL_CYCLES: BillingCycleName[] = ['MONTHLY', 'QUARTERLY', 'ANNUAL']

interface CycleEditorProps {
  value: PlanCycle[]
  onChange: (cycles: PlanCycle[]) => void
}

/**
 * The rows to render: every known cycle, filled in from the plan where it has one.
 *
 * MONTHLY is forced enabled rather than merely defaulted, so this function alone guarantees the
 * emitted list is never empty and never billable-by-nothing — the caller cannot get it wrong.
 */
function rowsFrom(value: PlanCycle[]): PlanCycle[] {
  return ALL_CYCLES.map(cycle => {
    const existing = value.find(c => c.cycle === cycle)

    if (cycle === 'MONTHLY') {
      return { cycle, discountPct: existing?.discountPct ?? '0.0000', enabled: true }
    }

    return existing ?? { cycle, discountPct: '0.0000', enabled: false }
  })
}

const CycleEditor = ({ value, onChange }: CycleEditorProps) => {
  const rows = rowsFrom(value)

  const update = (cycle: BillingCycleName, patch: Partial<PlanCycle>) =>
    onChange(rows.map(row => (row.cycle === cycle ? { ...row, ...patch } : row)))

  return (
    <Box>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Cycle</TableCell>
            <TableCell>Offered</TableCell>
            <TableCell>Discount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.cycle}>
              <TableCell>
                <Typography variant='body2'>{row.cycle}</Typography>
              </TableCell>
              <TableCell>
                <Checkbox
                  checked={row.enabled}
                  // MONTHLY is the floor. Switching it off would leave a plan with nothing to
                  // bill on, which the server refuses anyway — better to make it impossible here.
                  disabled={row.cycle === 'MONTHLY'}
                  inputProps={{ 'aria-label': `Enable ${row.cycle}` }}
                  onChange={e => update(row.cycle, { enabled: e.target.checked })}
                />
              </TableCell>
              <TableCell>
                <TextField
                  size='small'
                  value={row.discountPct}
                  disabled={!row.enabled}
                  inputProps={{ 'aria-label': `${row.cycle} discount` }}
                  helperText={row.cycle === 'MONTHLY' ? 'The baseline price' : undefined}
                  onChange={e => update(row.cycle, { discountPct: e.target.value })}
                  sx={{ width: 140 }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
        A discount is a fraction of the monthly price — 0.1700 is 17% off.
      </Typography>
    </Box>
  )
}

export default CycleEditor
