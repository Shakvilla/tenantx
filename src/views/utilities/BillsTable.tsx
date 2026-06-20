'use client'

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Skeleton from '@mui/material/Skeleton'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import classnames from 'classnames'
import {
  createColumnHelper, flexRender, getCoreRowModel, useReactTable,
  getPaginationRowModel, getSortedRowModel, getExpandedRowModel,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import RowActions from '@components/table/RowActions'
import { utilitiesApi } from '@/lib/api/utilities'
import type { UtilityBillResponse, UtilityMeterResponse, PaymentResponsibility } from '@/types/utility'

import tableStyles from '@core/styles/table.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  meter:        UtilityMeterResponse
  onRecordBill: () => void
  onBillPaid?:  (bill: UtilityBillResponse) => void
}

type Row = UtilityBillResponse

// ── Constants ─────────────────────────────────────────────────────────────────

const PAYER_OPTIONS: { value: PaymentResponsibility; label: string }[] = [
  { value: 'LANDLORD',  label: 'Landlord' },
  { value: 'CARETAKER', label: 'Caretaker' },
  { value: 'TENANT',    label: 'Tenant' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })

const fmtCurr = (n: number) => `GHS ${n.toFixed(2)}`

// ── Component ─────────────────────────────────────────────────────────────────

export default function BillsTable({ meter, onRecordBill, onBillPaid }: Props) {
  const [data, setData]               = useState<Row[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [rowSelection, setRowSelection] = useState({})

  // Pay dialog
  const [payBillId, setPayBillId]   = useState<string | null>(null)
  const [paidBy, setPaidBy]         = useState<PaymentResponsibility>('LANDLORD')
  const [paying, setPaying]         = useState(false)
  const [payError, setPayError]     = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    utilitiesApi.getBillsByMeter(meter.id)
      .then(setData)
      .catch(err => setError(err?.message ?? 'Failed to load bills'))
      .finally(() => setLoading(false))
  }, [meter.id])

  useEffect(() => { load() }, [load])

  async function handlePay() {
    if (!payBillId) return
    setPaying(true)
    setPayError(null)
    try {
      const updated = await utilitiesApi.payBill(payBillId, { paidBy })
      setData(prev => prev.map(b => b.id === payBillId ? updated : b))
      onBillPaid?.(updated)
      setPayBillId(null)
    } catch (err: any) {
      setPayError(err?.response?.data?.message ?? err?.message ?? 'Failed to mark as paid')
    } finally {
      setPaying(false)
    }
  }

  const columnHelper = createColumnHelper<Row>()

  const columns = useMemo<ColumnDef<Row, any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          indeterminate={row.getIsSomeSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    columnHelper.accessor('billingPeriodStart', {
      header: 'Billing Period',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography color='text.primary' className='font-medium'>
            {fmtDate(row.original.billingPeriodStart)}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            to {fmtDate(row.original.billingPeriodEnd)}
          </Typography>
        </div>
      ),
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: ({ row }) => (
        <Typography color='text.primary' className='font-medium'>
          {fmtCurr(row.original.amount)}
        </Typography>
      ),
    }),
    columnHelper.accessor('unitsConsumed', {
      header: 'Units Used',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {row.original.unitsConsumed != null ? `${row.original.unitsConsumed} units` : '—'}
        </Typography>
      ),
    }),
    columnHelper.accessor('splitMethod', {
      header: 'Split',
      cell: ({ row }) => (
        <Typography color='text.primary' className='capitalize'>
          {row.original.splitMethod?.toLowerCase() ?? '—'}
        </Typography>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => (
        <Chip
          variant='tonal'
          label={row.original.status.toLowerCase()}
          size='small'
          color={row.original.status === 'PAID' ? 'success' : 'error'}
          className='capitalize'
        />
      ),
    }),
    columnHelper.display({
      id: 'splits',
      header: 'Splits',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.splits?.length > 0 ? (
          <Button
            size='small' variant='text'
            endIcon={<i className={row.getIsExpanded() ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />}
            onClick={() => row.toggleExpanded()}
          >
            {row.original.splits.length}
          </Button>
        ) : <Typography variant='caption' color='text.disabled'>—</Typography>,
    }),
    columnHelper.display({
      id: 'action',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }) => {
        if (row.original.status !== 'UNPAID') {
          return <Typography variant='caption' color='text.disabled'>—</Typography>
        }
        return (
          <RowActions
            iconButtonProps={{ size: 'small' }}
            options={[
              {
                text: 'Mark as Paid',
                icon: 'ri-checkbox-circle-line',
                menuItemProps: {
                  onClick: () => { setPayBillId(row.original.id); setPaidBy('LANDLORD'); setPayError(null) },
                },
              },
            ]}
          />
        )
      },
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [])

  const table = useReactTable({
    data,
    columns,
    state: { rowSelection },
    initialState: { pagination: { pageSize: 10 } },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  return (
    <Box>
      {error && (
        <Alert severity='error' sx={{ m: 3 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id}>
                    {h.isPlaceholder ? null : (
                      <div
                        className={classnames({
                          'flex items-center': h.column.getIsSorted(),
                          'cursor-pointer select-none': h.column.getCanSort(),
                        })}
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {{ asc: <i className='ri-arrow-up-s-line text-xl' />, desc: <i className='ri-arrow-down-s-line text-xl' /> }[h.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {loading ? (
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j}><Skeleton variant='text' /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : table.getFilteredRowModel().rows.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                  <Box className='flex flex-col items-center gap-2 py-8'>
                    <i className='ri-file-list-3-line text-4xl' style={{ color: 'var(--mui-palette-text-disabled)' }} />
                    <Typography color='text.secondary'>No bills recorded yet.</Typography>
                    <Button size='small' variant='outlined' onClick={onRecordBill} startIcon={<i className='ri-add-line' />}>
                      Record Bill
                    </Button>
                  </Box>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {table.getRowModel().rows.map(row => (
                <Fragment key={row.id}>
                  <tr className={classnames({ selected: row.getIsSelected() })}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                  {row.getIsExpanded() && row.original.splits?.length > 0 && (
                    <tr>
                      <td colSpan={table.getVisibleFlatColumns().length} style={{ padding: 0 }}>
                        <Box sx={{ px: 6, py: 2, background: 'var(--mui-palette-action-hover)' }}>
                          <Typography variant='caption' fontWeight={600} color='text.secondary'
                            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
                            Split Breakdown
                          </Typography>
                          {row.original.splits.map(s => (
                            <Box key={s.unitId} className='flex items-center justify-between' sx={{ py: 0.5 }}>
                              <Typography variant='body2'>
                                Unit {s.unitNo ?? '?'}{s.occupantName ? ` — ${s.occupantName}` : ''}
                              </Typography>
                              <Typography variant='body2' fontWeight={500}>
                                {fmtCurr(s.shareAmount)}
                                {s.sharePct != null && ` (${s.sharePct.toFixed(1)}%)`}
                              </Typography>
                            </Box>
                          ))}
                          {row.original.paidAt && (
                            <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                              Paid by {row.original.paidBy} on {fmtDate(row.original.paidAt)}
                            </Typography>
                          )}
                          {row.original.notes && (
                            <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                              Note: {row.original.notes}
                            </Typography>
                          )}
                        </Box>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          )}
        </table>
      </div>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component='div'
        className='border-bs'
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        SelectProps={{ inputProps: { 'aria-label': 'rows per page' } }}
        onPageChange={(_, page) => table.setPageIndex(page)}
        onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
      />

      {/* Pay dialog */}
      <Dialog open={!!payBillId} onClose={() => !paying && setPayBillId(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Mark Bill as Paid</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 mbs-2'>
            {payError && <Alert severity='error'>{payError}</Alert>}
            <TextField
              select size='small' fullWidth label='Paid by'
              value={paidBy}
              onChange={e => setPaidBy(e.target.value as PaymentResponsibility)}
            >
              {PAYER_OPTIONS.map(o => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions className='gap-2 pbs-4'>
          <Button variant='outlined' color='secondary' onClick={() => setPayBillId(null)} disabled={paying}>
            Cancel
          </Button>
          <Button
            variant='contained' color='success' onClick={handlePay} disabled={paying}
            startIcon={paying ? <CircularProgress size={16} color='inherit' /> : <i className='ri-checkbox-circle-line' />}
          >
            {paying ? 'Saving…' : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
