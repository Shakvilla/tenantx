'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Skeleton from '@mui/material/Skeleton'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'

import classnames from 'classnames'
import {
  createColumnHelper, flexRender, getCoreRowModel, useReactTable,
  getPaginationRowModel, getSortedRowModel,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import RowActions from '@components/table/RowActions'
import { utilitiesApi } from '@/lib/api/utilities'
import type { UtilityTokenResponse, UtilityMeterResponse } from '@/types/utility'

import tableStyles from '@core/styles/table.module.css'

// ── Constants ─────────────────────────────────────────────────────────────────

const PAYER_LABELS: Record<string, string> = {
  LANDLORD:  'Landlord',
  CARETAKER: 'Caretaker',
  TENANT:    'Tenant',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  meter:         UtilityMeterResponse
  onRecordToken: () => void
}

type Row = UtilityTokenResponse

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })

const fmtCurr = (n: number) => `GHS ${n.toFixed(2)}`

// ── Component ─────────────────────────────────────────────────────────────────

export default function TokensTable({ meter, onRecordToken }: Props) {
  const [data, setData]               = useState<Row[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [rowSelection, setRowSelection] = useState({})

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    utilitiesApi.getTokensByMeter(meter.id)
      .then(setData)
      .catch(err => setError(err?.message ?? 'Failed to load tokens'))
      .finally(() => setLoading(false))
  }, [meter.id])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await utilitiesApi.deleteToken(id)
      setData(prev => prev.filter(t => t.id !== id))
      setDeleteId(null)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete token')
    } finally {
      setDeleting(false)
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
    columnHelper.accessor('purchasedAt', {
      header: 'Date',
      cell: ({ row }) => (
        <Typography color='text.primary'>{fmtDate(row.original.purchasedAt)}</Typography>
      ),
    }),
    columnHelper.accessor('amountPaid', {
      header: 'Amount',
      cell: ({ row }) => (
        <Typography color='text.primary' className='font-medium'>
          {fmtCurr(row.original.amountPaid)}
        </Typography>
      ),
    }),
    columnHelper.accessor('unitsPurchased', {
      header: 'kWh',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {row.original.unitsPurchased != null ? `${row.original.unitsPurchased} kWh` : '—'}
        </Typography>
      ),
    }),
    columnHelper.accessor('tokenNumber', {
      header: 'Token No.',
      cell: ({ row }) => row.original.tokenNumber
        ? <Typography color='text.primary' sx={{ fontFamily: 'monospace', fontSize: 13 }}>{row.original.tokenNumber}</Typography>
        : <Typography variant='caption' color='text.disabled'>—</Typography>,
    }),
    columnHelper.accessor('purchasedBy', {
      header: 'Purchased By',
      cell: ({ row }) => (
        <Typography color='text.primary'>
          {PAYER_LABELS[row.original.purchasedBy] ?? row.original.purchasedBy}
        </Typography>
      ),
    }),
    columnHelper.accessor('notes', {
      header: 'Notes',
      cell: ({ row }) => row.original.notes
        ? <Typography variant='body2' color='text.secondary'>{row.original.notes}</Typography>
        : <Typography variant='caption' color='text.disabled'>—</Typography>,
    }),
    columnHelper.display({
      id: 'action',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }) => (
        <RowActions
          iconButtonProps={{ size: 'small' }}
          options={[
            {
              text: 'Delete',
              icon: 'ri-delete-bin-line',
              menuItemProps: {
                onClick: () => setDeleteId(row.original.id),
                sx: { color: 'error.main' },
              },
            },
          ]}
        />
      ),
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
                    <i className='ri-flashlight-line text-4xl' style={{ color: 'var(--mui-palette-text-disabled)' }} />
                    <Typography color='text.secondary'>No tokens recorded yet.</Typography>
                    <Button size='small' variant='outlined' onClick={onRecordToken} startIcon={<i className='ri-add-line' />}>
                      Record Token
                    </Button>
                  </Box>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
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

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onClose={() => !deleting && setDeleteId(null)} maxWidth='xs' fullWidth>
        <DialogTitle className='flex items-center gap-2'>
          <i className='ri-error-warning-line' style={{ color: 'var(--mui-palette-error-main)' }} />
          Delete Token Record
        </DialogTitle>
        <DialogContent>
          <Typography>Remove this token top-up record? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions className='gap-2 pbs-4'>
          <Button variant='outlined' color='secondary' onClick={() => setDeleteId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant='contained' color='error' disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color='inherit' /> : <i className='ri-delete-bin-line' />}
            onClick={() => deleteId && handleDelete(deleteId)}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
