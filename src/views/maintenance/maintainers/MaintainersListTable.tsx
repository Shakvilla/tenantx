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
import Rating from '@mui/material/Rating'
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
import { getMaintainers, deleteMaintainer, type Maintainer } from '@/lib/api/maintenance'

// Component Imports
import RowActions from '@components/table/RowActions'
import PageBanner from '@components/banner/PageBanner'
import CustomAvatar from '@core/components/mui/Avatar'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import AddMaintainerDialog from './AddMaintainerDialog'
import ViewMaintainerDialog from './ViewMaintainerDialog'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns { fuzzy: FilterFn<unknown> }
  interface FilterMeta { itemRank: RankingInfo }
}

type MaintainerWithAction = Maintainer & { action?: string }

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const DebouncedInput = ({
  value: initialValue, onChange, debounce = 500, ...props
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

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'> = {
  ACTIVE: 'success', active: 'success',
  INACTIVE: 'warning', inactive: 'warning',
  SUSPENDED: 'error'
}

const columnHelper = createColumnHelper<MaintainerWithAction>()

const MaintainersListTable = () => {
  const [data, setData] = useState<Maintainer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedMaintainer, setSelectedMaintainer] = useState<Maintainer | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [maintainerToEdit, setMaintainerToEdit] = useState<Maintainer | null>(null)
  const [maintainerToView, setMaintainerToView] = useState<Maintainer | null>(null)

  const fetchMaintainers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getMaintainers({ size: 100 })
      setData(response.data ?? [])
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load maintainers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMaintainers() }, [fetchMaintainers])

  const uniqueSpecializations = useMemo(() => {
    const all = data.flatMap(m => m.specializations ?? [])
    return Array.from(new Set(all)).sort()
  }, [data])

  const filteredData = useMemo(() => {
    let filtered = data
    if (globalFilter) {
      const q = globalFilter.toLowerCase()
      filtered = filtered.filter(m =>
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q) ||
        m.companyName?.toLowerCase().includes(q) ||
        m.specializations?.some(s => s.toLowerCase().includes(q))
      )
    }
    if (selectedStatus) filtered = filtered.filter(m => m.status?.toUpperCase() === selectedStatus.toUpperCase())
    if (selectedSpecialization) filtered = filtered.filter(m => m.specializations?.includes(selectedSpecialization))
    return filtered
  }, [data, globalFilter, selectedStatus, selectedSpecialization])

  const columns = useMemo<ColumnDef<MaintainerWithAction, any>[]>(() => [
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
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ row }) => (
        <div className='flex items-center gap-3'>
          <CustomAvatar skin='light' size={34}>{getInitials(row.original.name)}</CustomAvatar>
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>{row.original.name}</Typography>
            <Typography variant='caption' color='text.secondary'>{row.original.email ?? '-'}</Typography>
          </div>
        </div>
      )
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: ({ row }) => <Typography color='text.primary'>{row.original.phone ?? '-'}</Typography>
    }),
    columnHelper.accessor('companyName', {
      header: 'Company',
      cell: ({ row }) => <Typography color='text.primary'>{row.original.companyName ?? '-'}</Typography>
    }),
    columnHelper.display({
      id: 'specializations', header: 'Specializations',
      cell: ({ row }) => (
        <div className='flex flex-wrap gap-1'>
          {row.original.specializations?.length
            ? row.original.specializations.map(s => <Chip key={s} variant='tonal' label={s} size='small' color='primary' />)
            : <Typography color='text.secondary'>-</Typography>
          }
        </div>
      )
    }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <Rating value={Number(row.original.rating ?? 0)} readOnly size='small' precision={0.1} />
          <Typography variant='body2' color='text.secondary'>({Number(row.original.rating ?? 0).toFixed(1)})</Typography>
        </div>
      )
    }),
    columnHelper.display({
      id: 'jobs', header: 'Jobs',
      cell: ({ row }) => (
        <Typography color='text.primary'>{row.original.completedJobs ?? 0}/{row.original.totalJobs ?? 0}</Typography>
      )
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status ?? ''
        return <Chip variant='tonal' label={s} size='small' color={STATUS_COLORS[s] ?? 'secondary'} className='capitalize' />
      }
    }),
    columnHelper.display({
      id: 'action', header: 'Action',
      cell: ({ row }) => (
        <RowActions
          iconButtonProps={{ size: 'small' }}
          options={[
            { text: 'View', icon: 'ri-eye-line', menuItemProps: { onClick: () => { setMaintainerToView(row.original); setViewOpen(true) } } },
            { text: 'Edit', icon: 'ri-pencil-line', menuItemProps: { onClick: () => { setMaintainerToEdit(row.original); setEditOpen(true) } } },
            {
              text: 'Delete', icon: 'ri-delete-bin-line',
              menuItemProps: { onClick: () => { setSelectedMaintainer(row.original); setDeleteOpen(true) } }
            }
          ]}
        />
      ),
      enableSorting: false
    })
  ], [])

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
    if (!selectedMaintainer) return
    const ids = Object.keys(rowSelection).length > 0
      ? (Object.keys(rowSelection).map(k => filteredData[parseInt(k)]?.id).filter(Boolean) as string[])
      : [selectedMaintainer.id]

    try {
      await Promise.all(ids.map(id => deleteMaintainer(id)))
      setData(prev => prev.filter(m => !ids.includes(m.id)))
    } catch {
      // optimistic removal failed — refetch
      fetchMaintainers()
    }
    setRowSelection({})
    setDeleteOpen(false)
    setSelectedMaintainer(null)
  }, [selectedMaintainer, rowSelection, filteredData, fetchMaintainers])

  return (
    <>
      <PageBanner title='Maintainers' description='Manage maintenance service providers and contractors' icon='ri-tools-line' />
      <Card className='mbs-6'>
        <CardHeader
          title='Maintainers List'
          action={
            <div className='flex items-center gap-2'>
              {Object.keys(rowSelection).length > 0 && (
                <Button variant='outlined' color='error' startIcon={<i className='ri-delete-bin-line' />}
                  onClick={() => { const f = filteredData[parseInt(Object.keys(rowSelection)[0])]; if (f) { setSelectedMaintainer(f); setDeleteOpen(true) } }}>
                  Delete Selected ({Object.keys(rowSelection).length})
                </Button>
              )}
              <Button variant='contained' color='primary' startIcon={<i className='ri-add-line' />} onClick={() => setAddOpen(true)}>Add Maintainer</Button>
              <Button variant='outlined' size='small' onClick={fetchMaintainers}><i className='ri-refresh-line' /></Button>
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
                  <MenuItem value='ACTIVE'>Active</MenuItem>
                  <MenuItem value='INACTIVE'>Inactive</MenuItem>
                  <MenuItem value='SUSPENDED'>Suspended</MenuItem>
                </Select>
              </FormControl>
              <FormControl size='small' sx={{ minWidth: 180 }}>
                <InputLabel>Specialization</InputLabel>
                <Select value={selectedSpecialization} onChange={e => setSelectedSpecialization(e.target.value)} label='Specialization'>
                  <MenuItem value=''>All Specializations</MenuItem>
                  {uniqueSpecializations.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </div>
            <DebouncedInput value={globalFilter ?? ''} onChange={v => setGlobalFilter(String(v))} placeholder='Search maintainers...' className='sm:is-auto min-is-[200px]' />
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
                  <tbody><tr><td colSpan={table.getVisibleFlatColumns().length} className='text-center'>No maintainers found</td></tr></tbody>
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

      <ViewMaintainerDialog open={viewOpen} setOpen={setViewOpen} maintainer={maintainerToView as any}
        onEdit={() => { setViewOpen(false); setMaintainerToEdit(maintainerToView); setEditOpen(true) }} />
      <AddMaintainerDialog open={addOpen} handleClose={() => setAddOpen(false)} onSuccess={fetchMaintainers} mode='add' />
      <AddMaintainerDialog open={editOpen} handleClose={() => { setEditOpen(false); setMaintainerToEdit(null) }} onSuccess={fetchMaintainers} editData={maintainerToEdit as any} mode='edit' />
      <ConfirmationDialog open={deleteOpen} setOpen={setDeleteOpen} type='delete-maintainer' onConfirm={handleDeleteConfirm} />
    </>
  )
}

export default MaintainersListTable
