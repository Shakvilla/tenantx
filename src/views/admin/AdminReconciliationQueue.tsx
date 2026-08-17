'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Skeleton from '@mui/material/Skeleton'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'

import {
  getTenantReconciliationQueue,
  resolvePaymentReconciliation,
  type AdminPaymentSummary,
  type AdminReconciliationAssessment,
} from '@/lib/api/admin-auth-client'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { fuzzyFilter } from '@/utils/tableFilterFns'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtMoney(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null) return '—'

  const value = Number(amount).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return `${currency ?? 'GHS'} ${value}`
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'

  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function serverMessage(e: any): string | null {
  const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? null

  return typeof msg === 'string' && msg.trim() ? msg : null
}

/**
 * The one decision this table exists to make visible.
 *
 * `resolvable` and `creditable` are two booleans on purpose and are never collapsed here:
 * an already-settled row is resolvable but moves no money, and a landlord-abandoned one is
 * neither. Rendering a single uniform "Resolve" button across all three would make an
 * operator clearing a stale flag look identical to one authorising a payout — and would put
 * the refusal after the click, where the money question has already been asked.
 */
type Verdict = {
  action:  'CREDIT' | 'CLEAR' | null
  label:   string
  color:   'success' | 'info' | 'error' | 'default'
}

function verdictOf(a: AdminReconciliationAssessment | null | undefined): Verdict {
  if (!a) return { action: null, label: 'Not assessed', color: 'default' }

  if (a.resolvable && a.creditable) return { action: 'CREDIT', label: 'Safe to credit', color: 'success' }

  // Resolvable but not creditable: a late webhook already booked it, so the only thing left
  // to do is take the row out of the queue.
  if (a.resolvable) return { action: 'CLEAR', label: 'Stale flag only', color: 'info' }

  return { action: null, label: 'Do not credit', color: 'error' }
}

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------

const columnHelper = createColumnHelper<AdminPaymentSummary>()

export default function AdminReconciliationQueue({ tenantId }: { tenantId: string }) {
  const { hasPermission } = useAdminAuth()

  // Resolving is the one action on the tenant admin surface that puts withdrawable money in
  // a landlord's wallet, so it sits behind the wallet authority rather than tenants:write.
  const canResolve = hasPermission('platform:wallet:adjust')

  const [rows, setRows]         = useState<AdminPaymentSummary[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [notice, setNotice]     = useState<string | null>(null)

  // ── Confirmation ──────────────────────────────────────────────────────────
  const [target, setTarget]         = useState<AdminPaymentSummary | null>(null)
  const [submitting, setSubmitting] = useState(false)

  /**
   * The double-submit guard proper. A ref, not the `disabled` attribute: this is money, and a
   * synchronous check cannot be beaten by a second click landing before React has re-rendered.
   * The button is marked `aria-disabled` for assistive tech and shows a spinner; the guard is
   * what actually stops a second request.
   */
  const submittingRef = useRef(false)

  const load = useCallback(async (p = 0, size = pageSize) => {
    setLoading(true)
    setError(null)

    try {
      const res = await getTenantReconciliationQueue(tenantId, p, size)

      setRows(res.items ?? [])
      setTotal(res.total ?? 0)
      setPage(p)
    } catch (e: any) {
      setError(serverMessage(e) ?? e?.message ?? 'Failed to load the reconciliation queue')
    } finally {
      setLoading(false)
    }
  }, [tenantId, pageSize])

  useEffect(() => { load(0) }, [load])

  const targetVerdict = verdictOf(target?.reconciliation)
  const isCredit      = targetVerdict.action === 'CREDIT'

  function closeDialog() {
    if (submittingRef.current) return
    setTarget(null)
  }

  async function handleConfirm() {
    if (submittingRef.current || !target) return

    submittingRef.current = true
    setSubmitting(true)
    setError(null)
    setNotice(null)

    const row = target

    try {
      const res = await resolvePaymentReconciliation(tenantId, row.id)

      setTarget(null)

      // The counts come from the server's own answer rather than from what the row predicted,
      // so the confirmation the operator reads is what actually happened.
      setNotice(res.walletCredited
        ? `Settlement completed for ${row.occupantName ?? 'this payment'} — ${res.invoicesForAdvance} `
          + `monthly invoices issued and ${fmtMoney(res.amount, row.currency)} credited to the `
          + `landlord's wallet as withdrawable gateway money.`
        : `Flag cleared for ${row.occupantName ?? 'this payment'}. It was already settled, so no `
          + `money moved and no invoices were issued.`)

      await load(page)
    } catch (e: any) {
      // The backend refuses for specific, different reasons and names the alternative in the
      // message. Collapsing that into "Failed to resolve" would throw away the only guidance
      // the operator gets about what to do instead.
      setTarget(null)
      setError(serverMessage(e)
        ?? e?.message
        ?? 'The server refused to resolve this payment, without giving a reason.')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const columns = [
    columnHelper.accessor('occupantName', {
      header: 'Occupant',
      cell: info => (
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{info.getValue() ?? '—'}</Typography>
          <Typography variant='caption' color='text.secondary'>
            {info.row.original.paymentMethod ?? '—'}
          </Typography>
        </Box>
      ),
    }),
    columnHelper.accessor('amount', {
      header: () => <span style={{ display: 'block', textAlign: 'right' }}>Amount</span>,
      cell: info => (
        <Typography
          sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600, textAlign: 'right', display: 'block' }}
        >
          {fmtMoney(info.getValue(), info.row.original.currency)}
        </Typography>
      ),
    }),
    columnHelper.display({
      id: 'flaggedAt',
      header: 'Flagged',
      cell: info => {
        const row     = info.row.original
        const flagged = row.flaggedForReconciliationAt

        return (
          <Box>
            <Typography variant='caption' sx={{ whiteSpace: 'nowrap' }}>
              {fmtDate(flagged ?? row.createdAt)}
            </Typography>
            {!flagged && (

              // The admin response carries no flag timestamp yet, so this is the payment's own
              // creation time. Labelled rather than passed off as the moment it was flagged.
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                payment created
              </Typography>
            )}
          </Box>
        )
      },
    }),
    columnHelper.accessor('reconciliationReason', {
      header: 'Why it was flagged',
      cell: info => (
        <Typography variant='caption' color='text.secondary' sx={{ maxWidth: 260, display: 'block' }}>
          {info.getValue() ?? '—'}
        </Typography>
      ),
    }),
    columnHelper.display({
      id: 'assessment',
      header: 'Assessment',
      cell: info => {
        const assessment = info.row.original.reconciliation
        const v          = verdictOf(assessment)

        return (
          <Box sx={{ maxWidth: 380 }}>
            <Chip
              label={v.label}
              size='small'
              color={v.color === 'default' ? 'default' : v.color}
              sx={{ fontSize: '0.65rem', height: 20, mb: 0.5 }}
            />
            {assessment?.explanation && (
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                {assessment.explanation}
              </Typography>
            )}
          </Box>
        )
      },
    }),
    columnHelper.display({
      id: 'action',
      header: 'Action',
      cell: info => {
        const row = info.row.original
        const v   = verdictOf(row.reconciliation)

        // No button at all on a row the backend would refuse. The reason is already on the row,
        // so the operator learns it here rather than from a rejected request.
        if (!v.action) return null

        if (!canResolve) {
          return (
            <Typography variant='caption' color='text.secondary'>
              Needs wallet-adjust rights
            </Typography>
          )
        }

        return (
          <Button
            size='small'
            variant={v.action === 'CREDIT' ? 'contained' : 'outlined'}
            color={v.action === 'CREDIT' ? 'success' : 'info'}
            onClick={() => setTarget(row)}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {v.action === 'CREDIT' ? 'Complete settlement' : 'Clear stale flag'}
          </Button>
        )
      },
    }),
  ]

  const table = useReactTable({
    filterFns: { fuzzy: fuzzyFilter },
    data: rows,
    columns,
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <i className='ri-error-warning-line' style={{ fontSize: '1.15rem', opacity: 0.7 }} />
          <Typography variant='h6'>Stranded Payments</Typography>
          <Chip size='small' label={total} variant='tonal' color='error' />
        </Box>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          Payments the gateway may have taken without the platform being able to book them.
          Resolving one completes the interrupted settlement — check the assessment before acting,
          because only some of these may be credited.
        </Typography>

        {error  && <Alert severity='error'   sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        {notice && <Alert severity='success' sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} variant='rectangular' height={40} sx={{ borderRadius: 1 }} />)}
          </Box>
        ) : (
          <>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id}>
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}
                    >
                      No stranded payments for this tenant.
                    </td>
                  </tr>
                ) : table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <TablePagination
              component='div'
              rowsPerPageOptions={[10, 25, 50]}
              count={total}
              rowsPerPage={pageSize}
              page={page}
              onPageChange={(_, p) => load(p)}
              onRowsPerPageChange={e => { const s = Number(e.target.value);

 setPageSize(s); load(0, s) }}
            />
          </>
        )}
      </CardContent>

      {/* ── Confirmation ─────────────────────────────────────────────────────
          Two different consequences, so two different texts. The clearing case must not
          borrow the crediting case's wording: it moves no money, and saying otherwise
          would misrepresent the action an operator is about to authorise. */}
      <Dialog open={!!target} onClose={closeDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{isCredit ? 'Complete this settlement?' : 'Clear this stale flag?'}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {`Payment from ${target?.occupantName ?? 'this occupant'}, flagged `
              + `${fmtDate(target?.flaggedForReconciliationAt ?? target?.createdAt)}.`}
          </DialogContentText>

          {isCredit ? (
            <>
              <DialogContentText sx={{ mb: 1 }}>Confirming will:</DialogContentText>
              <Box component='ul' sx={{ pl: 3, m: 0, mb: 2 }}>
                <Typography component='li' variant='body2' sx={{ mb: 0.5 }}>
                  Activate the advance behind this payment.
                </Typography>
                <Typography component='li' variant='body2' sx={{ mb: 0.5 }}>
                  Issue its monthly invoices as PAID.
                </Typography>
                <Typography component='li' variant='body2'>
                  {`Credit the landlord ${fmtMoney(target?.amount, target?.currency)} as withdrawable `
                    + `gateway money.`}
                </Typography>
              </Box>
              <Alert severity='warning'>
                This releases real money the landlord can withdraw. It cannot be undone from here.
              </Alert>
            </>
          ) : (
            <DialogContentText>
              A later gateway confirmation already settled this payment — its invoices and its wallet
              credit already exist. Clearing the flag only takes the row out of this queue: it moves no
              money and issues no invoices.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            variant='contained'
            color={isCredit ? 'success' : 'primary'}
            onClick={handleConfirm}
            aria-disabled={submitting}
            startIcon={submitting ? <CircularProgress size={14} color='inherit' /> : undefined}
          >
            {isCredit ? 'Confirm & credit' : 'Confirm & clear flag'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
