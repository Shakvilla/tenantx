'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Skeleton from '@mui/material/Skeleton'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { TextFieldProps } from '@mui/material/TextField'

import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper, flexRender, getCoreRowModel, useReactTable,
  getFilteredRowModel, getPaginationRowModel, getSortedRowModel,
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

import RowActions from '@components/table/RowActions'
import PageBanner from '@components/banner/PageBanner'
import CreateReviewDialog from './dialogs/CreateReviewDialog'

import { rentReviewsApi } from '@/lib/api/rentReviews'
import type { RentReviewSummary, RentReviewStatus } from '@/types/rentReview'

import tableStyles from '@core/styles/table.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

declare module '@tanstack/table-core' {
  interface FilterFns { fuzzy: FilterFn<unknown> }
  interface FilterMeta { itemRank: RankingInfo }
}

type Row = RentReviewSummary & { action?: string }

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<RentReviewStatus, 'warning' | 'info' | 'success' | 'error'> = {
  PENDING:   'warning',
  NOTIFIED:  'info',
  APPLIED:   'success',
  CANCELLED: 'error',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const DebouncedInput = ({
  value: initialValue, onChange, debounce = 500, ...props
}: { value: string | number; onChange: (v: string | number) => void; debounce?: number }
  & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)
  useEffect(() => setValue(initialValue), [initialValue])
  useEffect(() => {
    const t = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtCurrency = (n: number) => `GHS ${n.toFixed(2)}`

// ── Component ─────────────────────────────────────────────────────────────────

export default function RentReviewsView() {
  const [data, setData]               = useState<Row[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [createOpen, setCreateOpen]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const reviews = await rentReviewsApi.getAll(statusFilter ? { status: statusFilter } : undefined)
      setData(reviews)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load rent reviews')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  async function handleAction(id: string, action: 'notify' | 'apply' | 'cancel') {
    setActionLoading(id + action)
    try {
      const updated = await rentReviewsApi[action](id)
      setData(prev => prev.map(r => r.id === id ? { ...r, status: updated.status as RentReviewStatus } : r))
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? `Failed to ${action} review`)
    } finally {
      setActionLoading(null)
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
    columnHelper.accessor('unitNo', {
      header: 'Unit',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography color='text.primary' className='font-medium'>Unit {row.original.unitNo}</Typography>
          <Typography variant='caption' color='text.secondary'>{row.original.propertyName}</Typography>
        </div>
      ),
    }),
    columnHelper.accessor('occupantName', {
      header: 'Occupant',
      cell: ({ row }) => (
        <Typography color='text.primary'>{row.original.occupantName ?? '—'}</Typography>
      ),
    }),
    columnHelper.accessor('currentRent', {
      header: 'Current Rent',
      cell: ({ row }) => (
        <Typography color='text.primary'>{fmtCurrency(row.original.currentRent)}</Typography>
      ),
    }),
    columnHelper.accessor('proposedRent', {
      header: 'Proposed Rent',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography color='success.main' className='font-medium'>{fmtCurrency(row.original.proposedRent)}</Typography>
          {row.original.increasePct != null && (
            <Typography variant='caption' color='success.main'>+{row.original.increasePct.toFixed(1)}%</Typography>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('effectiveDate', {
      header: 'Effective Date',
      cell: ({ row }) => {
        const due = new Date(row.original.effectiveDate) <= new Date() &&
          (row.original.status === 'PENDING' || row.original.status === 'NOTIFIED')
        return (
          <div className='flex flex-col gap-1'>
            <Typography color='text.primary'>{fmtDate(row.original.effectiveDate)}</Typography>
            {due && <Chip label='Due' size='small' color='error' variant='outlined' sx={{ width: 'fit-content', height: 18, fontSize: 10 }} />}
          </div>
        )
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => (
        <Chip
          variant='tonal'
          label={row.original.status.toLowerCase()}
          size='small'
          color={STATUS_COLOR[row.original.status] ?? 'default'}
          className='capitalize'
        />
      ),
    }),
    columnHelper.display({
      id: 'action',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }) => {
        const { id, status } = row.original
        const busy = actionLoading !== null

        const options = []

        if (status === 'PENDING') {
          options.push({
            text: 'Notify Occupant',
            icon: 'ri-notification-3-line',
            menuItemProps: { onClick: () => handleAction(id, 'notify'), disabled: busy },
          })
          options.push({
            text: 'Apply Now',
            icon: 'ri-checkbox-circle-line',
            menuItemProps: { onClick: () => handleAction(id, 'apply'), disabled: busy },
          })
          options.push({
            text: 'Cancel',
            icon: 'ri-close-circle-line',
            menuItemProps: { onClick: () => handleAction(id, 'cancel'), disabled: busy, sx: { color: 'error.main' } },
          })
        } else if (status === 'NOTIFIED') {
          options.push({
            text: 'Apply Now',
            icon: 'ri-checkbox-circle-line',
            menuItemProps: { onClick: () => handleAction(id, 'apply'), disabled: busy },
          })
          options.push({
            text: 'Re-notify',
            icon: 'ri-send-plane-line',
            menuItemProps: { onClick: () => handleAction(id, 'notify'), disabled: busy },
          })
          options.push({
            text: 'Cancel',
            icon: 'ri-close-circle-line',
            menuItemProps: { onClick: () => handleAction(id, 'cancel'), disabled: busy, sx: { color: 'error.main' } },
          })
        }

        if (options.length === 0) return <Typography variant='caption' color='text.disabled'>—</Typography>

        return actionLoading?.startsWith(id)
          ? <CircularProgress size={16} />
          : <RowActions iconButtonProps={{ size: 'small' }} options={options} />
      },
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [actionLoading])

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { rowSelection, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <>
      <PageBanner
        title='Rent Reviews'
        description='Propose, notify, and apply annual rent increases across your properties'
        icon='ri-percent-line'
      />

      <Card className='mbs-6'>
        <CardHeader
          title='Rent Reviews'
          action={
            <div className='flex items-center gap-2'>
              <Button
                variant='contained' color='primary' size='small'
                startIcon={<i className='ri-add-line' />}
                onClick={() => setCreateOpen(true)}
              >
                New Review
              </Button>
              <IconButton size='small' title='Refresh' onClick={load} disabled={loading}>
                <i className={classnames('ri-refresh-line', { 'animate-spin': loading })} />
              </IconButton>
            </div>
          }
        />
        <Divider />
        <CardContent className='flex flex-col gap-4'>
          {error && <Alert severity='error' onClose={() => setError(null)}>{error}</Alert>}

          {/* Filters */}
          <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
            <div className='flex flex-wrap gap-4 items-center'>
              <FormControl size='small' sx={{ minWidth: 160 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} label='Status'>
                  <MenuItem value=''>All Statuses</MenuItem>
                  <MenuItem value='PENDING'>Pending</MenuItem>
                  <MenuItem value='NOTIFIED'>Notified</MenuItem>
                  <MenuItem value='APPLIED'>Applied</MenuItem>
                  <MenuItem value='CANCELLED'>Cancelled</MenuItem>
                </Select>
              </FormControl>
            </div>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={v => setGlobalFilter(String(v))}
              placeholder='Search:'
              className='sm:is-auto min-is-[200px]'
            />
          </div>

          {/* Table */}
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
                  {Array.from({ length: 6 }).map((_, i) => (
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
                      No rent reviews found
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
        </CardContent>
      </Card>

      <CreateReviewDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={review => {
          setData(prev => [{
            id: review.id, unitId: review.unitId, unitNo: review.unitNo,
            propertyName: review.propertyName, occupantName: review.occupantName ?? 'Vacant',
            currentRent: review.currentRent, proposedRent: review.proposedRent,
            increasePct: review.increasePct, effectiveDate: review.effectiveDate,
            status: review.status, createdAt: review.createdAt,
          }, ...prev])
          setCreateOpen(false)
        }}
      />
    </>
  )
}
