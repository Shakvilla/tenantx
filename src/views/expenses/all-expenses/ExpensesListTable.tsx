'use client'

// React Imports
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
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'
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
import { getExpenses, getExpenseStats, deleteExpense, type ExpenseStats } from '@/lib/api/expenses'

// Type Imports
import type { ExpenseType } from '@/types/expenses/expenseTypes'

// Component Imports
import RowActions from '@components/table/RowActions'
import PageBanner from '@components/banner/PageBanner'
import ExpenseStatsCard from './ExpenseStatsCard'
import AddExpenseDrawer from './AddExpenseDrawer'
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

type ExpenseTypeWithAction = ExpenseType & { action?: string }

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

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)

  return `${date.getDate()} ${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`
}

const statusChipColor: Record<string, 'success' | 'error' | 'warning'> = {
  PAID: 'success',
  UNPAID: 'error',
  PENDING: 'warning'
}

const ExpensesListTable = () => {
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<ExpenseType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ExpenseStats | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')

  // Add / Edit
  const [addOpen, setAddOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<ExpenseType | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<ExpenseType | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [expenses, expStats] = await Promise.all([
        getExpenses(statusFilter ? { status: statusFilter } : {}),
        getExpenseStats()
      ])

      setData(expenses.map(e => ({
        id: e.id,
        item: e.item,
        amount: e.amount,
        date: e.date,
        description: e.description,
        propertyId: e.propertyId,
        propertyName: e.propertyName,
        unitId: e.unitId,
        unitNo: e.unitNo,
        expenseConfigId: e.expenseConfigId,
        responsibility: e.responsibility,
        status: e.status,
        currency: e.currency,
        imageUrl: e.imageUrl,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt
      })))
      setStats(expStats)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSaved = useCallback((saved: ExpenseType) => {
    setData(prev => {
      const idx = prev.findIndex(e => e.id === saved.id)

      if (idx >= 0) {
        const updated = [...prev]

        updated[idx] = saved

        return updated
      }

      return [saved, ...prev]
    })
    // Refresh stats
    getExpenseStats().then(setStats).catch(() => {})
  }, [])

  const handleDeleteConfirm = async () => {
    if (!toDelete) return
    try {
      await deleteExpense(toDelete.id)
      setData(prev => prev.filter(e => e.id !== toDelete.id))
      setDeleteOpen(false)
      setToDelete(null)
      getExpenseStats().then(setStats).catch(() => {})
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete expense')
    }
  }

  // Derive unique properties from data for filter dropdown
  const uniquePropertyIds = useMemo(() => {
    const seen = new Set<string>()
    const result: { id: string; name: string }[] = []

    data.forEach(e => {
      if (e.propertyId && !seen.has(e.propertyId)) {
        seen.add(e.propertyId)
        result.push({ id: e.propertyId, name: e.propertyName ?? e.propertyId })
      }
    })

    return result
  }, [data])

  const columnHelper = createColumnHelper<ExpenseTypeWithAction>()

  const columns = useMemo<ColumnDef<ExpenseTypeWithAction, any>[]>(
    () => [
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
        )
      },
      columnHelper.display({
        id: 'sl',
        header: 'SL',
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex
          const pageSize = table.getState().pagination.pageSize

          return <Typography>{pageIndex * pageSize + row.index + 1}.</Typography>
        }
      }),
      columnHelper.accessor('item', {
        header: 'Name',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.item || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('propertyId', {
        header: 'Property',
        cell: ({ row }) => (
          <Typography color='text.primary' className='max-w-[180px] truncate'>
            {row.original.propertyName ?? row.original.propertyId ?? '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('unitId', {
        header: 'Unit',
        cell: ({ row }) => (
          <Typography color='text.primary'>
            {row.original.unitNo ?? row.original.unitId ?? '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('date', {
        header: 'Date',
        cell: ({ row }) => <Typography>{formatDate(row.original.date)}</Typography>
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            ₵{row.original.amount.toFixed(2)}
          </Typography>
        )
      }),
      columnHelper.accessor('responsibility', {
        header: 'Responsibility',
        cell: ({ row }) => (
          <Typography color='text.primary' className='capitalize'>
            {row.original.responsibility ? row.original.responsibility.toLowerCase() : '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status ?? 'PENDING'

          return (
            <Chip
              variant='tonal'
              label={status.toLowerCase()}
              size='small'
              color={statusChipColor[status] ?? 'default'}
              className='capitalize'
            />
          )
        }
      }),
      columnHelper.display({
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <RowActions
            iconButtonProps={{ size: 'small' }}
            options={[
              {
                text: 'Edit',
                icon: 'ri-pencil-line',
                menuItemProps: {
                  onClick: () => {
                    setEditExpense(row.original)
                    setEditOpen(true)
                  }
                }
              },
              {
                text: 'Delete',
                icon: 'ri-delete-bin-line',
                menuItemProps: {
                  onClick: () => {
                    setToDelete(row.original)
                    setDeleteOpen(true)
                  }
                }
              }
            ]}
          />
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
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <PageBanner
        title='All Expenses'
        description='View and manage all expenses for your properties'
        icon='ri-money-dollar-circle-line'
      />

      {/* Stats Card */}
      <ExpenseStatsCard
        totalExpenses={stats?.totalAmount ?? 0}
        upcomingExpenses={0}
        unfulfilledExpenses={stats?.unpaidAmount ?? 0}
        paidExpenses={stats?.paidAmount ?? 0}
      />

      <Card className='mbs-6'>
        <CardHeader
          title='Expenses List'
          action={
            <div className='flex items-center gap-2'>
              <Button
                variant='contained'
                color='primary'
                onClick={() => setAddOpen(true)}
                startIcon={<i className='ri-add-line' />}
              >
                Add Expenses
              </Button>
              <IconButton size='small' title='Refresh' onClick={fetchData} disabled={loading}>
                <i className={classnames('ri-refresh-line', { 'animate-spin': loading })} />
              </IconButton>
              <RowActions options={['Share']} />
            </div>
          }
        />
        <Divider />
        <CardContent className='flex flex-col gap-4'>
          {error && (
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Filters */}
          <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
            <div className='flex flex-wrap gap-4 items-center'>
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  label='Status'
                >
                  <MenuItem value=''>All Statuses</MenuItem>
                  <MenuItem value='PAID'>Paid</MenuItem>
                  <MenuItem value='UNPAID'>Unpaid</MenuItem>
                  <MenuItem value='PENDING'>Pending</MenuItem>
                </Select>
              </FormControl>
            </div>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search:'
              className='sm:is-auto min-is-[200px]'
            />
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
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 10 }).map((__, j) => (
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
                      No expenses found
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

      {/* Add Expense */}
      <AddExpenseDrawer
        open={addOpen}
        handleClose={() => setAddOpen(false)}
        onSaved={handleSaved}
      />

      {/* Edit Expense */}
      <AddExpenseDrawer
        open={editOpen}
        handleClose={() => {
          setEditOpen(false)
          setEditExpense(null)
        }}
        editExpense={editExpense}
        onSaved={handleSaved}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        setOpen={setDeleteOpen}
        type='delete-expense'
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}

export default ExpensesListTable
