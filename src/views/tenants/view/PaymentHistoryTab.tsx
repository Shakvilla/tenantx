'use client'

import { useState, useMemo, useEffect } from 'react'

// MUI
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import TablePagination from '@mui/material/TablePagination'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// Third-party
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// API
import { paymentsApi } from '@/lib/api/payments'
import type { PaymentResponse, PaymentStatus } from '@/types/payment'

// Styles
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns { fuzzy: FilterFn<unknown> }
  interface FilterMeta { itemRank: RankingInfo }
}

type Props = {
  occupantId?: string
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const statusColor = (s: PaymentStatus) => {
  switch (s) {
    case 'PAID':
    case 'RECORDED': return 'success'
    case 'FAILED':
    case 'CANCELLED': return 'error'
    case 'PROCESSING': return 'info'
    default: return 'warning'  // PENDING
  }
}

const methodLabel: Record<string, string> = {
  MOBILE_MONEY: 'Mobile Money',
  CASH: 'Cash',
  CHEQUE: 'Cheque',
  BANK_TRANSFER: 'Bank Transfer'
}

const columnHelper = createColumnHelper<PaymentResponse>()

const PaymentHistoryTab = ({ occupantId }: Props) => {
  const [payments, setPayments]     = useState<PaymentResponse[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (!occupantId) return
    setLoading(true)
    setError(null)
    paymentsApi.getByOccupant(occupantId)
      .then(setPayments)
      .catch(err => setError(err?.message ?? 'Failed to load payment history'))
      .finally(() => setLoading(false))
  }, [occupantId])

  const filteredData = useMemo(() => {
    if (!statusFilter) return payments
    return payments.filter(p => p.status === statusFilter)
  }, [payments, statusFilter])

  const columns = useMemo<ColumnDef<PaymentResponse, any>[]>(
    () => [
      columnHelper.accessor('invoiceNumber', {
        header: 'INVOICE',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-medium'>
            {row.original.invoiceNumber || '—'}
          </Typography>
        )
      }),
      columnHelper.accessor('paymentMethod', {
        header: 'METHOD',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {methodLabel[row.original.paymentMethod] ?? row.original.paymentMethod}
            {row.original.mobileNetwork ? ` · ${row.original.mobileNetwork}` : ''}
          </Typography>
        )
      }),
      columnHelper.accessor('amount', {
        header: 'AMOUNT',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-medium' color='text.primary'>
            ₵{row.original.amount.toFixed(2)}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={row.original.status}
            size='small'
            color={statusColor(row.original.status)}
            className='capitalize'
          />
        )
      }),
      columnHelper.accessor('paymentDate', {
        header: 'DATE',
        cell: ({ row }) => {
          const raw = row.original.paymentDate ?? row.original.createdAt
          if (!raw) return <Typography variant='body2'>—</Typography>
          const d = new Date(raw)
          return (
            <Typography variant='body2'>
              {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Typography>
          )
        }
      }),
      columnHelper.accessor('notes', {
        header: 'NOTES',
        cell: ({ row }) => (
          <Typography variant='body2' color='text.secondary' className='max-w-[160px] truncate'>
            {row.original.notes || '—'}
          </Typography>
        )
      })
    ],
    []
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  if (!occupantId) {
    return (
      <Card elevation={0}>
        <CardContent>
          <Alert severity='info'>No occupant selected.</Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card elevation={0}>
      <CardHeader
        title='Payment History'
        action={
          <TextField
            select
            size='small'
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value=''>All Statuses</MenuItem>
            <MenuItem value='PAID'>Paid</MenuItem>
            <MenuItem value='RECORDED'>Recorded</MenuItem>
            <MenuItem value='PENDING'>Pending</MenuItem>
            <MenuItem value='PROCESSING'>Processing</MenuItem>
            <MenuItem value='FAILED'>Failed</MenuItem>
            <MenuItem value='CANCELLED'>Cancelled</MenuItem>
          </TextField>
        }
      />
      <CardContent className='flex flex-col gap-4'>

        {/* Controls */}
        <Box className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-2'>
            <Typography variant='body2'>Show</Typography>
            <TextField
              select size='small'
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              sx={{ minWidth: 80 }}
            >
              {[10, 25, 50].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </TextField>
            <Typography variant='body2'>entries</Typography>
          </div>
          <TextField
            size='small'
            placeholder='Search'
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className='min-w-[200px]'
            InputProps={{ startAdornment: <i className='ri-search-line text-lg mie-2' /> }}
          />
        </Box>

        {/* Table */}
        {loading ? (
          <Box className='flex justify-center py-8'>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity='error'>{error}</Alert>
        ) : (
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
                              'cursor-pointer select-none': h.column.getCanSort()
                            })}
                            onClick={h.column.getToggleSortingHandler()}
                          >
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {{ asc: <i className='ri-arrow-up-s-line text-xl' />, desc: <i className='ri-arrow-down-s-line text-xl' /> }[h.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              {table.getFilteredRowModel().rows.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={columns.length} className='text-center py-8'>
                      No payment records found
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        )}

        {/* Pagination */}
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
      </CardContent>
    </Card>
  )
}

export default PaymentHistoryTab
