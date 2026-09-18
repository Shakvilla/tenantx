'use client'

import { useState, useEffect, useMemo } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import TablePagination from '@mui/material/TablePagination'
import Button from '@mui/material/Button'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'

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
import { getInvoices, type Invoice } from '@/lib/api/invoices'

// Component Imports
import PaymentsNeedingAttention from '@/views/billing/PaymentsNeedingAttention'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { fuzzyFilter } from '@/utils/tableFilterFns'

const columnHelper = createColumnHelper<Invoice>()

const statusColorMap: Record<Invoice['status'], 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
  PAID: 'success',
  PARTIAL: 'info',
  PENDING: 'warning',
  DRAFT: 'secondary',
  OVERDUE: 'error',
  CANCELLED: 'error'
}

const formatDate = (d?: string | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Tenant-wide payments/billing history for landlords, admins, and staff.
 *
 * There is currently no tenant-wide payment-transaction listing endpoint on the
 * backend (payments are only listable per-occupant or per-invoice). Invoices,
 * however, are listable tenant-wide and already carry payment status
 * (PAID/PENDING/OVERDUE/...), amount, occupant, and property/unit — so this view
 * reuses `getInvoices()` to give landlords a read-only payments history table.
 */
const LandlordPaymentsView = () => {
  const [data, setData] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))

  useEffect(() => {
    setLoading(true)
    setError(null)
    getInvoices()
      .then(setData)
      .catch(err => setError(err?.message ?? 'Failed to load payments'))
      .finally(() => setLoading(false))
  }, [])

  const columns = useMemo<ColumnDef<Invoice, any>[]>(
    () => [
      columnHelper.accessor('occupantName', {
        header: 'OCCUPANT',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.occupantName ?? '—'}
          </Typography>
        )
      }),
      columnHelper.display({
        id: 'propertyUnit',
        header: 'PROPERTY / UNIT',
        cell: ({ row }) => {
          const { propertyName, unitNo } = row.original
          if (!propertyName && !unitNo) return <Typography>—</Typography>
          return (
            <Typography>
              {propertyName ?? '—'}
              {unitNo ? ` · Unit ${unitNo}` : ''}
            </Typography>
          )
        }
      }),
      columnHelper.accessor('invoiceNumber', {
        header: 'INVOICE #',
        cell: ({ row }) => <Typography>{row.original.invoiceNumber ?? '—'}</Typography>
      }),
      columnHelper.accessor('amount', {
        header: 'AMOUNT',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.currency ?? ''} {Number(row.original.amount).toLocaleString()}
          </Typography>
        )
      }),
      columnHelper.accessor('invoiceType', {
        header: 'METHOD',
        cell: ({ row }) => (
          <Typography className='capitalize'>
            {(row.original.invoiceType ?? '—').toString().replace(/_/g, ' ').toLowerCase()}
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
      columnHelper.accessor('dueDate', {
        header: 'DATE',
        cell: ({ row }) => <Typography>{formatDate(row.original.dueDate ?? row.original.issuedDate)}</Typography>
      })
    ],
    []
  )

  const table = useReactTable({
    filterFns: { fuzzy: fuzzyFilter },
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
      <CardHeader title='Payments History' subheader='All billing activity across your properties' />
      <CardContent>
        {/*
          Above the history table on purpose: a flagged payment is usually PAID, so it reads
          as settled in the rows below. If it were mixed into the table it would be one row
          among many, styled like the rest.
        */}
        <PaymentsNeedingAttention />

        {error && <Alert severity='error' className='mbe-4'>{error}</Alert>}

        {/* Table (desktop) / stacked cards (mobile) */}
        {isMobile ? (
          loading ? (
            <div className='flex flex-col gap-3'>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant='text' height={48} />
              ))}
            </div>
          ) : data.length === 0 ? (
            <Typography color='text.secondary' className='py-8 text-center block'>
              No payments found
            </Typography>
          ) : (
            <div className='flex flex-col gap-3'>
              {table.getRowModel().rows.map(row => {
                const inv = row.original
                const s = inv.status
                const color = statusColorMap[s] ?? 'secondary'

                return (
                  <Card key={row.id} variant='outlined'>
                    <CardContent className='flex flex-col gap-3'>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <Typography color='text.primary' className='font-medium truncate'>
                            {inv.occupantName ?? '—'}
                          </Typography>
                          <Typography variant='body2' color='text.secondary' className='truncate'>
                            {[inv.propertyName, inv.unitNo ? `Unit ${inv.unitNo}` : ''].filter(Boolean).join(' · ') || '—'}
                          </Typography>
                        </div>
                        <Chip variant='tonal' label={s} size='small' color={color} className='shrink-0' />
                      </div>

                      <div className='flex flex-wrap gap-x-6 gap-y-2'>
                        <div className='flex flex-col gap-0.5'>
                          <Typography variant='caption' color='text.secondary'>Invoice #</Typography>
                          <Typography variant='body2'>{inv.invoiceNumber ?? '—'}</Typography>
                        </div>
                        <div className='flex flex-col gap-0.5'>
                          <Typography variant='caption' color='text.secondary'>Amount</Typography>
                          <Typography variant='body2' className='font-medium'>
                            {inv.currency ?? ''} {Number(inv.amount).toLocaleString()}
                          </Typography>
                        </div>
                        <div className='flex flex-col gap-0.5'>
                          <Typography variant='caption' color='text.secondary'>Method</Typography>
                          <Typography variant='body2' className='capitalize'>
                            {(inv.invoiceType ?? '—').toString().replace(/_/g, ' ').toLowerCase()}
                          </Typography>
                        </div>
                        <div className='flex flex-col gap-0.5'>
                          <Typography variant='caption' color='text.secondary'>Date</Typography>
                          <Typography variant='body2'>{formatDate(inv.dueDate ?? inv.issuedDate)}</Typography>
                        </div>
                      </div>

                      <Link href={`/billing/invoices/${inv.id}`} style={{ textDecoration: 'none' }}>
                        <Button size='small' variant='outlined' fullWidth sx={{ minHeight: 44 }} startIcon={<i className='ri-eye-line' />}>
                          View Invoice
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )
        ) : (
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
        )}

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

export default LandlordPaymentsView
