'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TablePagination from '@mui/material/TablePagination'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import type { TextFieldProps } from '@mui/material/TextField'

// Third-party Imports
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

// API Imports
import {
  getPreventativeSchedules,
  deletePreventativeSchedule,
  updatePreventativeSchedule,
  type PreventativeSchedule
} from '@/lib/api/maintenance'

// Component Imports
import PageBanner from '@components/banner/PageBanner'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import AddPreventativeScheduleDialog from './AddPreventativeScheduleDialog'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns { fuzzy: FilterFn<unknown> }
  interface FilterMeta { itemRank: RankingInfo }
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: { value: string | number; onChange: (v: string | number) => void; debounce?: number } & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)
  useEffect(() => { setValue(initialValue) }, [initialValue])
  useEffect(() => {
    const t = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

const formatDate = (d?: string | null) => {
  if (!d) return '-'
  const date = new Date(d)
  return `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`
}

const isDueSoon = (nextDueDate: string) => {
  const due = new Date(nextDueDate)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}

const isOverdue = (nextDueDate: string) => new Date(nextDueDate) < new Date()

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
  quarterly: 'Quarterly', biannual: 'Biannual', annual: 'Annual'
}

const PRIORITY_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'> = {
  low: 'info', medium: 'warning', high: 'error', urgent: 'error'
}

const columnHelper = createColumnHelper<PreventativeSchedule>()

const PreventativeSchedulesListTable = () => {
  const [data, setData] = useState<PreventativeSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<PreventativeSchedule | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [toEdit, setToEdit] = useState<PreventativeSchedule | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPreventativeSchedules({ size: 100, sort: 'nextDueDate,asc' })
      setData(res.data ?? [])
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  const handleToggleActive = useCallback(async (schedule: PreventativeSchedule) => {
    setTogglingId(schedule.id)
    try {
      const updated = await updatePreventativeSchedule(schedule.id, { isActive: !schedule.isActive })
      setData(prev => prev.map(s => s.id === schedule.id ? { ...s, isActive: updated.isActive } : s))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update schedule')
    } finally {
      setTogglingId(null)
    }
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!selected) return
    try {
      await deletePreventativeSchedule(selected.id)
      setData(prev => prev.filter(s => s.id !== selected.id))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete schedule')
    } finally {
      setDeleteOpen(false)
      setSelected(null)
    }
  }, [selected])

  const columns = useMemo<ColumnDef<PreventativeSchedule, any>[]>(() => [
    columnHelper.display({
      id: 'sl', header: 'SL',
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = table.getState().pagination
        return <Typography>{pageIndex * pageSize + row.index + 1}.</Typography>
      }
    }),
    columnHelper.accessor('title', {
      header: 'Title',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography color='text.primary' className='font-medium'>{row.original.title}</Typography>
          {row.original.description && (
            <Typography variant='caption' color='text.secondary' sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.original.description}
            </Typography>
          )}
        </div>
      )
    }),
    columnHelper.accessor('frequency', {
      header: 'Frequency',
      cell: ({ row }) => (
        <Chip
          variant='tonal' size='small' color='primary'
          label={FREQUENCY_LABELS[row.original.frequency] ?? row.original.frequency}
        />
      )
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: ({ row }) => {
        const p = row.original.priority?.toLowerCase() ?? ''
        return <Chip variant='tonal' label={p} size='small' color={PRIORITY_COLORS[p] ?? 'secondary'} className='capitalize' />
      }
    }),
    columnHelper.accessor('nextDueDate', {
      header: 'Next Due',
      cell: ({ row }) => {
        const d = row.original.nextDueDate
        const overdue = isOverdue(d)
        const soon = !overdue && isDueSoon(d)
        return (
          <Typography
            variant='body2'
            color={overdue ? 'error.main' : soon ? 'warning.main' : 'text.primary'}
            className='font-medium'
          >
            {formatDate(d)}
            {overdue && ' ⚠ Overdue'}
            {soon && ' · Soon'}
          </Typography>
        )
      }
    }),
    columnHelper.accessor('lastGeneratedAt', {
      header: 'Last Run',
      cell: ({ row }) => <Typography variant='body2'>{formatDate(row.original.lastGeneratedAt)}</Typography>
    }),
    columnHelper.accessor('isActive', {
      header: 'Active',
      cell: ({ row }) => (
        <Switch
          size='small'
          checked={row.original.isActive}
          disabled={togglingId === row.original.id}
          onChange={() => handleToggleActive(row.original)}
        />
      )
    }),
    columnHelper.display({
      id: 'action', header: 'Action',
      cell: ({ row }) => (
        <div className='flex items-center gap-1'>
          <Tooltip title='Edit'>
            <IconButton size='small' onClick={() => { setToEdit(row.original); setEditOpen(true) }}>
              <i className='ri-pencil-line text-base' />
            </IconButton>
          </Tooltip>
          <Tooltip title='Delete'>
            <IconButton size='small' color='error' onClick={() => { setSelected(row.original); setDeleteOpen(true) }}>
              <i className='ri-delete-bin-line text-base' />
            </IconButton>
          </Tooltip>
        </div>
      )
    })
  ], [handleToggleActive, togglingId])

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <PageBanner
        title='Preventative Schedules'
        description='Set up recurring maintenance tasks that auto-generate requests on a schedule'
        icon='ri-calendar-check-line'
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Schedules'
          action={
            <div className='flex items-center gap-2'>
              <Button variant='contained' color='primary' startIcon={<i className='ri-add-line' />} onClick={() => setAddOpen(true)}>
                New Schedule
              </Button>
              <Button variant='outlined' size='small' onClick={fetchSchedules}>
                <i className='ri-refresh-line' />
              </Button>
            </div>
          }
        />
        <Divider />
        <CardContent className='flex flex-col gap-4'>
          {error && <Alert severity='error' onClose={() => setError(null)}>{error}</Alert>}

          <div className='flex justify-end'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={v => setGlobalFilter(String(v))}
              placeholder='Search schedules…'
              className='min-is-[220px]'
            />
          </div>

          <div className='overflow-x-auto'>
            {loading ? (
              <div className='flex justify-center py-10'><CircularProgress /></div>
            ) : (
              <table className={tableStyles.table}>
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => (
                        <th key={h.id}>
                          {h.isPlaceholder ? null : (
                            <div
                              className={classnames({ 'flex items-center': h.column.getIsSorted(), 'cursor-pointer select-none': h.column.getCanSort() })}
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
                      <td colSpan={table.getVisibleFlatColumns().length} className='text-center py-10'>
                        <div className='flex flex-col items-center gap-2'>
                          <i className='ri-calendar-check-line text-4xl opacity-30' />
                          <Typography color='text.secondary'>No schedules yet. Create one to get started.</Typography>
                        </div>
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
            )}
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

      <AddPreventativeScheduleDialog
        open={addOpen}
        handleClose={() => setAddOpen(false)}
        onSuccess={fetchSchedules}
        mode='add'
      />
      <AddPreventativeScheduleDialog
        open={editOpen}
        handleClose={() => { setEditOpen(false); setToEdit(null) }}
        onSuccess={fetchSchedules}
        mode='edit'
        editData={toEdit}
      />
      <ConfirmationDialog
        open={deleteOpen}
        setOpen={setDeleteOpen}
        type='delete-maintenance-request'
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}

export default PreventativeSchedulesListTable
