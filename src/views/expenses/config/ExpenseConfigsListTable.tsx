'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Skeleton from '@mui/material/Skeleton'
import Chip from '@mui/material/Chip'
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
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Type Imports
import type { ExpenseConfigType } from '@/types/expenses/expenseConfigTypes'

// API Imports
import { getExpenseConfigs, deleteExpenseConfig } from '@/lib/api/expenses'

// Component Imports
import RowActions from '@components/table/RowActions'
import PageBanner from '@components/banner/PageBanner'
import AddExpenseConfigDrawer from './AddExpenseConfigDrawer'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type ExpenseConfigTypeWithAction = ExpenseConfigType & {
  action?: string
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
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

const ExpenseConfigsListTable = () => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<ExpenseConfigType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editConfig, setEditConfig] = useState<ExpenseConfigType | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [configToDelete, setConfigToDelete] = useState<ExpenseConfigType | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const configs = await getExpenseConfigs(false) // false = get all (active + inactive)

      setData(configs)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load expense configs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSaved = useCallback((saved: ExpenseConfigType) => {
    setData(prev => {
      const idx = prev.findIndex(c => c.id === saved.id)

      if (idx >= 0) {
        const updated = [...prev]

        updated[idx] = saved

        return updated
      }

      return [...prev, saved]
    })
  }, [])

  const openEdit = (config: ExpenseConfigType) => {
    setEditConfig(config)
    setDrawerOpen(true)
  }

  const openAdd = () => {
    setEditConfig(null)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditConfig(null)
  }

  const handleDeleteConfirm = async () => {
    if (!configToDelete) return
    setDeleting(true)
    try {
      await deleteExpenseConfig(configToDelete.id)
      setData(prev => prev.filter(c => c.id !== configToDelete.id))
      setDeleteDialogOpen(false)
      setConfigToDelete(null)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete expense config')
    } finally {
      setDeleting(false)
    }
  }

  const columnHelper = createColumnHelper<ExpenseConfigTypeWithAction>()

  const columns = useMemo<ColumnDef<ExpenseConfigTypeWithAction, any>[]>(
    () => [
      columnHelper.accessor('item', {
        header: 'ITEM',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.item}
          </Typography>
        )
      }),
      columnHelper.accessor('category', {
        header: 'CATEGORY',
        cell: ({ row }) => (
          <Typography color='text.primary'>
            {row.original.category || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('isActive', {
        header: 'STATUS',
        cell: ({ row }) => (
          <Chip
            label={row.original.isActive ? 'Active' : 'Inactive'}
            size='small'
            color={row.original.isActive ? 'success' : 'default'}
            variant='tonal'
          />
        )
      }),
      columnHelper.accessor('action', {
        header: () => <div className='text-right'>ACTION</div>,
        cell: ({ row }) => (
          <div className='flex justify-end gap-1'>
            <IconButton size='small' title='Edit' onClick={() => openEdit(row.original)}>
              <i className='ri-pencil-line text-textSecondary' />
            </IconButton>
            <IconButton
              size='small'
              title='Delete'
              onClick={() => {
                setConfigToDelete(row.original)
                setDeleteDialogOpen(true)
              }}
            >
              <i className='ri-delete-bin-line text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const table = useReactTable({
    data,
    columns,
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
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  return (
    <>
      <PageBanner
        title='Explore and manage the Expense Configs'
        description='Welcome to the Expense Configs, where you can monitor and manage all expense item configurations efficiently.'
        image='/images/cards/trophy.png'
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Expense Configs'
          action={
            <div className='flex items-center gap-2'>
              <IconButton size='small' title='Refresh' onClick={fetchData} disabled={loading}>
                <i className={classnames('ri-refresh-line', { 'animate-spin': loading })} />
              </IconButton>
              <RowActions options={['Share']} />
            </div>
          }
        />
        <CardContent className='flex flex-col gap-4'>
          {error && (
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Search + Add */}
          <div className='flex justify-between gap-4 flex-col items-start sm:flex-row sm:items-center'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search:'
              className='sm:is-auto min-is-[200px]'
            />
            <Button
              variant='contained'
              color='primary'
              size='small'
              onClick={openAdd}
              startIcon={<i className='ri-add-line' />}
            >
              Add New Expense Item
            </Button>
          </div>

          {/* Table */}
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
                      {Array.from({ length: 4 }).map((__, j) => (
                        <td key={j}>
                          <Skeleton variant='text' />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ) : table.getFilteredRowModel().rows.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                      No expense configs found
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

      <AddExpenseConfigDrawer
        open={drawerOpen}
        handleClose={closeDrawer}
        editConfig={editConfig}
        onSaved={handleSaved}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        type='delete-expense'
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}

export default ExpenseConfigsListTable
