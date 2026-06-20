'use client'

import { useState, useEffect, useRef, useMemo } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid2'
import Skeleton from '@mui/material/Skeleton'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'
import ExportButtons from '@/components/reports/ExportButtons'
import { arrearsApi } from '@/lib/api/arrears'
import { formatCurrency } from '@/utils/currency'
import type { ArrearsReport as ArrearsReportType, OccupantArrearsRow } from '@/types/arrears'

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ageDays(isoDate: string | null): number {
  if (!isoDate) return 0
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000)
}

function AgeBadge({ days }: { days: number }) {
  if (days > 90) return <Chip label={`${days}d`} size='small' variant='tonal' color='error' />
  if (days > 60) return <Chip label={`${days}d`} size='small' variant='tonal' color='warning' />
  if (days > 30) return <Chip label={`${days}d`} size='small' variant='tonal' color='info' />
  return <Chip label={`${days}d`} size='small' variant='tonal' color='default' />
}

const col = createColumnHelper<OccupantArrearsRow>()

// ─── component ───────────────────────────────────────────────────────────────

const ArrearsReport = () => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [data, setData]       = useState<ArrearsReportType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'totalOutstanding', desc: true }])

  useEffect(() => {
    setLoading(true)
    setError(null)
    arrearsApi.getReport()
      .then(setData)
      .catch(e => setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load arrears report'))
      .finally(() => setLoading(false))
  }, [])

  const columns = useMemo(() => [
    col.accessor('occupantName', {
      header: 'Tenant',
      cell: ({ row }) => (
        <Box>
          <Typography variant='body2' fontWeight={500}>{row.original.occupantName ?? '—'}</Typography>
          {row.original.occupantPhone && (
            <Typography variant='caption' color='text.secondary'>{row.original.occupantPhone}</Typography>
          )}
        </Box>
      ),
    }),
    col.accessor('unitNo', {
      header: 'Unit',
      cell: ({ row }) => (
        <Box>
          <Typography variant='body2'>{row.original.unitNo ?? '—'}</Typography>
          <Typography variant='caption' color='text.secondary'>{row.original.propertyName ?? ''}</Typography>
        </Box>
      ),
    }),
    col.accessor('days1to30', {
      header: '1–30 days',
      cell: ({ getValue }) => {
        const v = getValue()
        return v > 0
          ? <Typography variant='body2' color='text.primary'>{formatCurrency(v)}</Typography>
          : <Typography variant='body2' color='text.disabled'>—</Typography>
      },
    }),
    col.accessor('days31to60', {
      header: '31–60 days',
      cell: ({ getValue }) => {
        const v = getValue()
        return v > 0
          ? <Typography variant='body2' color='info.main'>{formatCurrency(v)}</Typography>
          : <Typography variant='body2' color='text.disabled'>—</Typography>
      },
    }),
    col.accessor('days61to90', {
      header: '61–90 days',
      cell: ({ getValue }) => {
        const v = getValue()
        return v > 0
          ? <Typography variant='body2' color='warning.main'>{formatCurrency(v)}</Typography>
          : <Typography variant='body2' color='text.disabled'>—</Typography>
      },
    }),
    col.accessor('days90plus', {
      header: '90+ days',
      cell: ({ getValue }) => {
        const v = getValue()
        return v > 0
          ? <Typography variant='body2' color='error.main' fontWeight={500}>{formatCurrency(v)}</Typography>
          : <Typography variant='body2' color='text.disabled'>—</Typography>
      },
    }),
    col.accessor('totalOutstanding', {
      header: 'Total Owed',
      cell: ({ getValue }) => (
        <Typography variant='body2' fontWeight={600}>{formatCurrency(getValue())}</Typography>
      ),
    }),
    col.accessor('oldestDueDate', {
      header: 'Oldest Invoice',
      cell: ({ getValue }) => {
        const d = getValue()
        const days = ageDays(d)
        return (
          <Box className='flex flex-col gap-1'>
            <Typography variant='body2'>{fmtDate(d)}</Typography>
            <AgeBadge days={days} />
          </Box>
        )
      },
    }),
    col.accessor('invoiceCount', {
      header: 'Invoices',
      cell: ({ getValue }) => (
        <Chip label={getValue()} size='small' variant='tonal' />
      ),
    }),
  ], [])

  const rows = data?.rows ?? []

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  // ─── summary cards ────────────────────────────────────────────────────────

  const summaryCards = data ? [
    {
      title: 'Total Defaulters',
      value: String(data.totalDefaulters),
      icon: 'ri-user-unfollow-line',
      color: 'var(--mui-palette-error-main)',
      bg:    'var(--mui-palette-error-lightOpacity)',
    },
    {
      title: 'Total Outstanding',
      value: formatCurrency(data.totalOutstanding),
      icon: 'ri-money-dollar-circle-line',
      color: 'var(--mui-palette-warning-main)',
      bg:    'var(--mui-palette-warning-lightOpacity)',
    },
    {
      title: 'Critical (90+ days)',
      value: formatCurrency(data.totalDays90plus),
      icon: 'ri-alarm-warning-line',
      color: 'var(--mui-palette-error-main)',
      bg:    'var(--mui-palette-error-lightOpacity)',
    },
    {
      title: 'Moderate (31–90 days)',
      value: formatCurrency(data.totalDays31to60 + data.totalDays61to90),
      icon: 'ri-time-line',
      color: 'var(--mui-palette-warning-main)',
      bg:    'var(--mui-palette-warning-lightOpacity)',
    },
  ] : []

  return (
    <Box ref={contentRef}>
      {error && (
        <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* Summary cards */}
      <Grid container spacing={4} sx={{ mt: 2, mb: 4 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card><CardContent><Skeleton variant='text' height={60} /></CardContent></Card>
              </Grid>
            ))
          : summaryCards.map(card => (
              <Grid key={card.title} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent className='flex items-center gap-4'>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: card.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <i className={card.icon} style={{ fontSize: 22, color: card.color }} />
                    </Box>
                    <Box>
                      <Typography variant='caption' color='text.secondary'>{card.title}</Typography>
                      <Typography variant='h6' fontWeight={700}>{card.value}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
        }
      </Grid>

      {/* Table */}
      <Card>
        <CardHeader
          title='Defaulters'
          subheader='Tenants with overdue invoices, sorted by amount owed'
          action={
            <ExportButtons
              contentRef={contentRef}
              title='Arrears & Defaulters Report'
              filename='arrears-defaulters-report'
              data={rows.map(r => ({
                Tenant: r.occupantName ?? '',
                Phone:  r.occupantPhone ?? '',
                Unit:   r.unitNo ?? '',
                Property: r.propertyName ?? '',
                '1-30 days': r.days1to30,
                '31-60 days': r.days31to60,
                '61-90 days': r.days61to90,
                '90+ days': r.days90plus,
                'Total Owed': r.totalOutstanding,
                'Oldest Invoice': r.oldestDueDate ?? '',
                'Invoice Count': r.invoiceCount,
              }))}
            />
          }
        />

        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id}
                          onClick={h.column.getToggleSortingHandler()}
                          style={{ cursor: h.column.getCanSort() ? 'pointer' : 'default', userSelect: 'none' }}>
                        <Box className='flex items-center gap-1'>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getIsSorted() === 'asc'  && <i className='ri-arrow-up-s-line' />}
                          {h.column.getIsSorted() === 'desc' && <i className='ri-arrow-down-s-line' />}
                        </Box>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              {/* skeleton */}
              {loading && (
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((__, j) => (
                        <td key={j}><Skeleton variant='text' /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}

              {/* empty */}
              {!loading && rows.length === 0 && (
                <tbody>
                  <tr>
                    <td colSpan={9}>
                      <Box className='flex flex-col items-center gap-3 py-12'>
                        <Box sx={{
                          width: 64, height: 64, borderRadius: '50%',
                          background: 'var(--mui-palette-success-lightOpacity)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className='ri-checkbox-circle-line' style={{ fontSize: 28, color: 'var(--mui-palette-success-main)' }} />
                        </Box>
                        <Box className='text-center'>
                          <Typography variant='body1' fontWeight={500} color='text.primary'>No arrears</Typography>
                          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                            All invoices are up to date — no overdue payments found.
                          </Typography>
                        </Box>
                      </Box>
                    </td>
                  </tr>
                </tbody>
              )}

              {/* rows */}
              {!loading && rows.length > 0 && (
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

          {!loading && rows.length > 0 && (
            <TablePagination
              className='border-bs'
              component='div'
              count={table.getFilteredRowModel().rows.length}
              rowsPerPage={table.getState().pagination.pageSize}
              page={table.getState().pagination.pageIndex}
              onPageChange={(_, p) => table.setPageIndex(p)}
              onRowsPerPageChange={e => { table.setPageSize(Number(e.target.value)); table.setPageIndex(0) }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default ArrearsReport
