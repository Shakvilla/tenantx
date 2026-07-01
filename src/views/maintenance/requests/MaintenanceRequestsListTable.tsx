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
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
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
  getMaintenanceRequests,
  getMyMaintenanceRequests,
  deleteMaintenanceRequest,
  getMaintenanceCategories,
  type MaintenanceRequest,
  type MaintenanceCategory
} from '@/lib/api/maintenance'
import { getStoredTenantId } from '@/lib/api/storage'

// Auth Imports
import { useAuth } from '@/contexts/AuthContext'

// Component Imports
import RowActions from '@components/table/RowActions'
import PageBanner from '@components/banner/PageBanner'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import AddMaintenanceRequestDialog from './AddMaintenanceRequestDialog'
import ViewMaintenanceRequestDialog from './ViewMaintenanceRequestDialog'
import MaintenanceStatsCards from './MaintenanceStatsCards'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns { fuzzy: FilterFn<unknown> }
  interface FilterMeta { itemRank: RankingInfo }
}

type RequestWithAction = MaintenanceRequest & { action?: string }

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
  return `${date.getDate()} ${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`
}

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  pending:           { label: 'Pending',           color: 'warning'   },
  awaiting_approval: { label: 'Awaiting Approval', color: 'info'      },
  approved:          { label: 'Approved',          color: 'secondary' },
  in_progress:       { label: 'In Progress',       color: 'primary'   },
  completed:         { label: 'Completed',         color: 'success'   },
  cancelled:         { label: 'Cancelled',         color: 'error'     },
}

const PRIORITY_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'> = {
  low: 'info', medium: 'warning', high: 'error', urgent: 'error'
}

const columnHelper = createColumnHelper<RequestWithAction>()

const MaintenanceRequestsListTable = () => {
  const { user } = useAuth()
  const isOccupant   = user?.userType === 'OCCUPANT'
  const isMaintainer = user?.userType === 'MAINTAINER'

  const [data, setData] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedPriority, setSelectedPriority] = useState<string>('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [categories, setCategories] = useState<MaintenanceCategory[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [requestToEdit, setRequestToEdit] = useState<MaintenanceRequest | null>(null)
  const [requestToView, setRequestToView] = useState<MaintenanceRequest | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const statuses = selectedStatus ? [selectedStatus] : undefined
      const fetchFn = (isOccupant || isMaintainer) ? getMyMaintenanceRequests : getMaintenanceRequests
      const response = await fetchFn({ size: 100, statuses })
      setData(response.data ?? [])
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load maintenance requests')
    } finally {
      setLoading(false)
    }
  }, [selectedStatus, isOccupant, isMaintainer])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  // Load categories once for filter + display
  useEffect(() => {
    const tenantId = getStoredTenantId() ?? undefined
    getMaintenanceCategories(false, tenantId)
      .then(res => setCategories(Array.isArray(res) ? res : []))
      .catch(() => {})
  }, [])

  const filteredData = useMemo(() => {
    let filtered = data
    if (globalFilter) {
      const q = globalFilter.toLowerCase()
      filtered = filtered.filter(r =>
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.requestNumber?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q)
      )
    }
    if (selectedPriority) filtered = filtered.filter(r => r.priority?.toLowerCase() === selectedPriority)
    if (selectedCategoryId) filtered = filtered.filter(r => r.categoryId === selectedCategoryId)
    return filtered
  }, [data, globalFilter, selectedPriority, selectedCategoryId])

  const columns = useMemo<ColumnDef<RequestWithAction, any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox checked={table.getIsAllRowsSelected()} indeterminate={table.getIsSomeRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} disabled={!row.getCanSelect()} indeterminate={row.getIsSomeSelected()} onChange={row.getToggleSelectedHandler()} />
      )
    },
    columnHelper.display({
      id: 'sl', header: 'SL',
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = table.getState().pagination
        return <Typography>{pageIndex * pageSize + row.index + 1}.</Typography>
      }
    }),
    columnHelper.accessor('requestNumber', {
      header: 'Request #',
      cell: ({ row }) => <Typography color='text.primary' className='font-medium'>{row.original.requestNumber ?? '-'}</Typography>
    }),
    columnHelper.accessor('title', {
      header: 'Issue',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography color='text.primary' className='font-medium'>{row.original.title}</Typography>
          {row.original.subCategory && <Typography variant='caption' color='text.secondary'>{row.original.subCategory}</Typography>}
        </div>
      )
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: ({ row }) => {
        const p = row.original.priority?.toLowerCase() ?? ''
        return <Chip variant='tonal' label={p} size='small' color={PRIORITY_COLORS[p] ?? 'secondary'} className='capitalize' />
      }
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status ?? ''
        const cfg = STATUS_CONFIG[s] ?? { label: s.replace(/_/g, ' '), color: 'default' as const }
        return <Chip variant='tonal' label={cfg.label} size='small' color={cfg.color} className='capitalize' />
      }
    }),
    columnHelper.accessor('estimatedCost', {
      header: 'Est. Cost',
      cell: ({ row }) => row.original.estimatedCost != null
        ? <Typography>{row.original.currency ?? 'GHS'} {Number(row.original.estimatedCost).toLocaleString()}</Typography>
        : <Typography color='text.secondary'>-</Typography>
    }),
    columnHelper.accessor('createdAt', {
      header: 'Requested',
      cell: ({ row }) => <Typography>{formatDate(row.original.createdAt)}</Typography>
    }),
    columnHelper.accessor('completedDate', {
      header: 'Completed',
      cell: ({ row }) => <Typography>{formatDate(row.original.completedDate)}</Typography>
    }),
    columnHelper.display({
      id: 'action', header: 'Action',
      cell: ({ row }) => (
        <RowActions
          iconButtonProps={{ size: 'small' }}
          options={[
            { text: 'View', icon: 'ri-eye-line', menuItemProps: { onClick: () => { setRequestToView(row.original); setViewOpen(true) } } },
            ...(!isOccupant && !isMaintainer ? [
              { text: 'Edit', icon: 'ri-pencil-line', menuItemProps: { onClick: () => { setRequestToEdit(row.original); setEditOpen(true) } } },
              { text: 'Delete', icon: 'ri-delete-bin-line', menuItemProps: { onClick: () => { setSelectedRequest(row.original); setDeleteOpen(true) } } }
            ] : [])
          ]}
        />
      ),
      enableSorting: false
    })
  ], [isOccupant, isMaintainer])

  const table = useReactTable({
    data: filteredData, columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { rowSelection, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedRequest) return
    const ids = Object.keys(rowSelection).length > 0
      ? (Object.keys(rowSelection).map(k => filteredData[parseInt(k)]?.id).filter(Boolean) as string[])
      : [selectedRequest.id]
    try {
      await Promise.all(ids.map(id => deleteMaintenanceRequest(id)))
      setData(prev => prev.filter(r => !ids.includes(r.id)))
      setRowSelection({})
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete request(s)')
    } finally {
      setDeleteOpen(false)
      setSelectedRequest(null)
    }
  }, [selectedRequest, rowSelection, filteredData])

  return (
    <>
      <PageBanner title='Maintenance Requests' description='Manage and track maintenance requests from tenants' icon='ri-tools-line' />
      <MaintenanceStatsCards />
      <Card className='mbs-6'>
        <CardHeader
          title='Maintenance Requests List'
          action={
            <div className='flex items-center gap-2'>
              {!isOccupant && !isMaintainer && Object.keys(rowSelection).length > 0 && (
                <Button variant='outlined' color='error' startIcon={<i className='ri-delete-bin-line' />}
                  onClick={() => { const f = filteredData[parseInt(Object.keys(rowSelection)[0])]; if (f) { setSelectedRequest(f); setDeleteOpen(true) } }}>
                  Delete Selected ({Object.keys(rowSelection).length})
                </Button>
              )}
              {!isMaintainer && (
                <Button variant='contained' color='primary' startIcon={<i className='ri-add-line' />} onClick={() => setAddOpen(true)}>Add Request</Button>
              )}
              <Button variant='outlined' size='small' onClick={fetchRequests}><i className='ri-refresh-line' /></Button>
            </div>
          }
        />
        <Divider />
        <CardContent className='flex flex-col gap-4'>
          {error && <Alert severity='error'>{error}</Alert>}
          <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
            <div className='flex flex-wrap gap-4 items-center'>
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} label='Status'>
                  <MenuItem value=''>All Status</MenuItem>
                  <MenuItem value='pending'>Pending</MenuItem>
                  <MenuItem value='awaiting_approval'>Awaiting Approval</MenuItem>
                  <MenuItem value='approved'>Approved</MenuItem>
                  <MenuItem value='in_progress'>In Progress</MenuItem>
                  <MenuItem value='completed'>Completed</MenuItem>
                  <MenuItem value='cancelled'>Cancelled</MenuItem>
                </Select>
              </FormControl>
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Priority</InputLabel>
                <Select value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)} label='Priority'>
                  <MenuItem value=''>All Priority</MenuItem>
                  <MenuItem value='low'>Low</MenuItem>
                  <MenuItem value='medium'>Medium</MenuItem>
                  <MenuItem value='high'>High</MenuItem>
                  <MenuItem value='urgent'>Urgent</MenuItem>
                </Select>
              </FormControl>
              {categories.length > 0 && (
                <FormControl size='small' sx={{ minWidth: 160 }}>
                  <InputLabel>Category</InputLabel>
                  <Select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} label='Category'>
                    <MenuItem value=''>All Categories</MenuItem>
                    {categories.map(c => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.icon && <i className={`${c.icon} mie-2`} />}{c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </div>
            <DebouncedInput value={globalFilter ?? ''} onChange={v => setGlobalFilter(String(v))} placeholder='Search requests...' className='sm:is-auto min-is-[200px]' />
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
                            <div className={classnames({ 'flex items-center': h.column.getIsSorted(), 'cursor-pointer select-none': h.column.getCanSort() })} onClick={h.column.getToggleSortingHandler()}>
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
                  <tbody><tr><td colSpan={table.getVisibleFlatColumns().length} className='text-center'>No maintenance requests found</td></tr></tbody>
                ) : (
                  <tbody>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            )}
          </div>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]} component='div' className='border-bs'
            count={table.getFilteredRowModel().rows.length}
            rowsPerPage={table.getState().pagination.pageSize}
            page={table.getState().pagination.pageIndex}
            SelectProps={{ inputProps: { 'aria-label': 'rows per page' } }}
            onPageChange={(_, page) => table.setPageIndex(page)}
            onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
          />
        </CardContent>
      </Card>

      <AddMaintenanceRequestDialog open={addOpen} handleClose={() => setAddOpen(false)} onSuccess={fetchRequests} mode='add' />
      <AddMaintenanceRequestDialog open={editOpen} handleClose={() => { setEditOpen(false); setRequestToEdit(null) }} onSuccess={fetchRequests} editData={requestToEdit as any} mode='edit' />
      <ViewMaintenanceRequestDialog open={viewOpen} setOpen={setViewOpen} request={requestToView as any} onEdit={() => { setViewOpen(false); setRequestToEdit(requestToView); setEditOpen(true) }} />
      <ConfirmationDialog open={deleteOpen} setOpen={setDeleteOpen} type='delete-maintenance-request' onConfirm={handleDeleteConfirm} />
    </>
  )
}

export default MaintenanceRequestsListTable
