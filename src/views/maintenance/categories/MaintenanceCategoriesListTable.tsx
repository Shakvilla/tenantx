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
import Box from '@mui/material/Box'
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
  getMaintenanceCategories,
  updateMaintenanceCategory,
  deleteMaintenanceCategory,
  type MaintenanceCategory
} from '@/lib/api/maintenance'
import { getStoredTenantId } from '@/lib/api/storage'

// Component Imports
import PageBanner from '@components/banner/PageBanner'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import AddMaintenanceCategoryDialog from './AddMaintenanceCategoryDialog'

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

const columnHelper = createColumnHelper<MaintenanceCategory>()

const MaintenanceCategoriesListTable = () => {
  const [data, setData] = useState<MaintenanceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<MaintenanceCategory | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [toEdit, setToEdit] = useState<MaintenanceCategory | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const tenantId = getStoredTenantId() ?? undefined
      const res = await getMaintenanceCategories(!showInactive, tenantId)
      setData(Array.isArray(res) ? res : [])
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [showInactive])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const handleToggleActive = useCallback(async (cat: MaintenanceCategory) => {
    setTogglingId(cat.id)
    try {
      const updated = await updateMaintenanceCategory(cat.id, { isActive: !cat.isActive })
      setData(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: updated.isActive } : c))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update category')
    } finally {
      setTogglingId(null)
    }
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!selected) return
    try {
      await deleteMaintenanceCategory(selected.id)
      setData(prev => prev.filter(c => c.id !== selected.id))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete category')
    } finally {
      setDeleteOpen(false)
      setSelected(null)
    }
  }, [selected])

  const columns = useMemo<ColumnDef<MaintenanceCategory, any>[]>(() => [
    columnHelper.display({
      id: 'sl', header: 'SL',
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = table.getState().pagination
        return <Typography>{pageIndex * pageSize + row.index + 1}.</Typography>
      }
    }),
    columnHelper.accessor('icon', {
      header: 'Icon',
      enableSorting: false,
      cell: ({ row }) => (
        <Box
          sx={{
            width: 36, height: 36, borderRadius: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'action.selected'
          }}
        >
          {row.original.icon
            ? <i className={`${row.original.icon} text-xl`} />
            : <i className='ri-tools-line text-xl opacity-40' />
          }
        </Box>
      )
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography color='text.primary' className='font-medium'>{row.original.name}</Typography>
          {row.original.description && (
            <Typography variant='caption' color='text.secondary'
              sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.original.description}
            </Typography>
          )}
        </div>
      )
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: ({ row }) => (
        <Chip
          variant='tonal'
          size='small'
          label={row.original.isActive ? 'Active' : 'Inactive'}
          color={row.original.isActive ? 'success' : 'secondary'}
        />
      )
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: ({ row }) => <Typography variant='body2'>{formatDate(row.original.createdAt)}</Typography>
    }),
    columnHelper.display({
      id: 'toggle', header: 'Active',
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
        title='Maintenance Categories'
        description='Organise maintenance requests by defining your own categories'
        icon='ri-price-tag-3-line'
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Categories'
          action={
            <div className='flex items-center gap-2'>
              <Button variant='contained' color='primary' startIcon={<i className='ri-add-line' />} onClick={() => setAddOpen(true)}>
                New Category
              </Button>
              <Button variant='outlined' size='small' onClick={fetchCategories}>
                <i className='ri-refresh-line' />
              </Button>
            </div>
          }
        />
        <Divider />
        <CardContent className='flex flex-col gap-4'>
          {error && <Alert severity='error' onClose={() => setError(null)}>{error}</Alert>}

          <div className='flex items-center justify-between gap-4 flex-wrap'>
            <Box className='flex items-center gap-2'>
              <Switch
                size='small'
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
              />
              <Typography variant='body2' color='text.secondary'>Show inactive</Typography>
            </Box>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={v => setGlobalFilter(String(v))}
              placeholder='Search categories…'
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
                          <i className='ri-price-tag-3-line text-4xl opacity-30' />
                          <Typography color='text.secondary'>No categories yet. Create one to get started.</Typography>
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

      <AddMaintenanceCategoryDialog
        open={addOpen}
        handleClose={() => setAddOpen(false)}
        onSuccess={fetchCategories}
        mode='add'
      />
      <AddMaintenanceCategoryDialog
        open={editOpen}
        handleClose={() => { setEditOpen(false); setToEdit(null) }}
        onSuccess={fetchCategories}
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

export default MaintenanceCategoriesListTable
