'use client'

import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import TablePagination from '@mui/material/TablePagination'

// Third-party Imports
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

// API Imports
import { paymentsApi } from '@/lib/api/payments'
import type { PaymentResponse, PaymentStatus } from '@/types/payment'

// Auth Imports
import { useAuth } from '@/contexts/AuthContext'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const columnHelper = createColumnHelper<PaymentResponse>()

const statusColorMap: Record<PaymentStatus, 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
  PAID: 'success',
  PENDING: 'warning',
  PROCESSING: 'warning',
  FAILED: 'error',
  CANCELLED: 'error',
  RECORDED: 'success'
}

const formatDate = (d?: string | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const OccupantPaymentsView = () => {
  const { user } = useAuth()
  const [data, setData] = useState<PaymentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    paymentsApi
      .getByOccupant(user.id)
      .then(setData)
      .catch(err => setError(err?.message ?? 'Failed to load payments'))
      .finally(() => setLoading(false))
  }, [user?.id])

  const columns = useMemo<ColumnDef<PaymentResponse, any>[]>(
    () => [
      columnHelper.accessor('invoiceNumber', {
        header: 'INVOICE #',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.invoiceNumber ?? '—'}
          </Typography>
        )
      }),
      columnHelper.accessor('amount', {
        header: 'AMOUNT',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.currency ?? ''} {Number(row.original.amount).toLocaleString()}
          </Typography>
        )
      }),
      columnHelper.accessor('currency', {
        header: 'CURRENCY',
        cell: ({ row }) => <Typography>{row.original.currency ?? '—'}</Typography>
      }),
      columnHelper.accessor('paymentMethod', {
        header: 'METHOD',
        cell: ({ row }) => (
          <Typography className='capitalize'>
            {(row.original.paymentMethod ?? '').replace(/_/g, ' ').toLowerCase()}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => {
          const s = row.original.status
          const color = statusColorMap[s] ?? 'secondary'
          return <Chip variant='tonal' label={s} size='small' color={color} />
        }
      }),
      columnHelper.accessor('paymentDate', {
        header: 'PAYMENT DATE',
        cell: ({ row }) => <Typography>{formatDate(row.original.paymentDate ?? row.original.completedAt)}</Typography>
      }),
      columnHelper.accessor('gatewayName', {
        header: 'GATEWAY',
        cell: ({ row }) => <Typography>{row.original.gatewayName ?? '—'}</Typography>
      })
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    state: {},
    initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <Card>
      <CardHeader title='My Payments' />
      <CardContent>
        {error && <Alert severity='error' className='mbe-4'>{error}</Alert>}

        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={classnames({
                            'flex items-center': header.column.getIsSorted(),
                            'cursor-pointer select-none': header.column.getCanSort()
                          })}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <i className='ri-arrow-up-s-line text-xl' />,
                            desc: <i className='ri-arrow-down-s-line text-xl' />
                          }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
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
                    {columns.map((_, ci) => (
                      <td key={ci}>
                        <Skeleton variant='text' width='80%' />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ) : data.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={columns.length} className='text-center py-8'>
                    No payments found
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

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          className='border-bs'
          count={data.length}
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

export default OccupantPaymentsView
