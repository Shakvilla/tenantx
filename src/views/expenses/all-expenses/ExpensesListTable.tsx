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
import Avatar from '@mui/material/Avatar'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
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

// Type Imports
import type { ExpenseType } from '@/types/expenses/expenseTypes'

// Component Imports
import OptionMenu from '@core/components/option-menu'
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

type ExpenseTypeWithAction = ExpenseType & {
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

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const day = date.getDate()
  const month = date.toLocaleString('en-US', { month: 'long' })
  const year = date.getFullYear()

  
return `${day} ${month} ${year}`
}

// Sample data with property, unit, and responsibility
const sampleExpenses: ExpenseType[] = [
  {
    id: 1,
    item: 'Electricity water gas',
    amount: 800.0,
    date: '2024-06-15',
    comment: 'Monthly utility bill',
    propertyName: 'A living room with mexican mansion blue',
    propertyImage:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 3',
    responsibility: 'Tenant',
    status: 'unpaid'
  },
  {
    id: 2,
    item: 'Plumbing repairs',
    amount: 200.0,
    date: '2024-05-20',
    comment: 'Fixed leaky faucet',
    propertyName: 'Rendering of a modern villa',
    propertyImage:
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=2148&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 6',
    responsibility: 'Owner',
    status: 'paid'
  },
  {
    id: 3,
    item: 'Legal/professional fees',
    amount: 150.0,
    date: '2024-06-10',
    comment: 'Legal consultation',
    propertyName: 'Beautiful modern style luxury home exterior sunset',
    propertyImage:
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 2',
    responsibility: 'Owner',
    status: 'paid'
  },
  {
    id: 4,
    item: 'Property management',
    amount: 350.0,
    date: '2024-08-15',
    comment: 'Monthly management fee',
    propertyName: 'A house with a lot of windows and a lot of plants',
    propertyImage:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 4',
    responsibility: 'Owner',
    status: 'pending'
  },
  {
    id: 5,
    item: 'Appraisal fees',
    amount: 410.0,
    date: '2024-05-05',
    comment: 'Property appraisal',
    propertyName: 'Design of a modern house as mansion blue couch',
    propertyImage:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 1',
    responsibility: 'Owner',
    status: 'paid'
  },
  {
    id: 6,
    item: 'Depreciation expense',
    amount: 188.0,
    date: '2024-07-01',
    comment: 'Monthly depreciation',
    propertyName: 'Depending on the location and design',
    propertyImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 8',
    responsibility: 'Owner',
    status: 'unpaid'
  },
  {
    id: 7,
    item: 'Window repairs',
    amount: 600.0,
    date: '2024-06-25',
    comment: 'Fixed broken window',
    propertyName: 'A living room with mexican mansion blue',
    propertyImage:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 9',
    responsibility: 'Owner',
    status: 'paid'
  },
  {
    id: 8,
    item: 'Pest control',
    amount: 411.0,
    date: '2024-08-20',
    comment: 'Monthly pest control service',
    propertyName: 'Rendering of a modern villa',
    propertyImage:
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=2148&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 5',
    responsibility: 'Owner',
    status: 'pending'
  },
  {
    id: 9,
    item: 'Maintenance',
    amount: 209.0,
    date: '2024-05-30',
    comment: 'General maintenance',
    propertyName: 'Beautiful modern style luxury home exterior sunset',
    propertyImage:
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 7',
    responsibility: 'Owner',
    status: 'paid'
  },
  {
    id: 10,
    item: 'Cleaning services',
    amount: 388.0,
    date: '2024-07-05',
    comment: 'Monthly cleaning',
    propertyName: 'A house with a lot of windows and a lot of plants',
    propertyImage:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 10',
    responsibility: 'Tenant',
    status: 'unpaid'
  },
  {
    id: 11,
    item: 'Insurance',
    amount: 500.0,
    date: '2024-09-01',
    comment: 'Property insurance',
    propertyName: 'Design of a modern house as mansion blue couch',
    propertyImage:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 11',
    responsibility: 'Owner',
    status: 'pending'
  },
  {
    id: 12,
    item: 'Taxes',
    amount: 300.0,
    date: '2024-04-15',
    comment: 'Property taxes',
    propertyName: 'Depending on the location and design',
    propertyImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 12',
    responsibility: 'Owner',
    status: 'unpaid'
  }
]

// Sample properties and units for edit data mapping
const sampleProperties = [
  { id: 1, name: 'A living room with mexican mansion blue' },
  { id: 2, name: 'Rendering of a modern villa' },
  { id: 3, name: 'Beautiful modern style luxury home exterior sunset' },
  { id: 4, name: 'A house with a lot of windows and a lot of plants' },
  { id: 5, name: 'Design of a modern house as mansion blue couch' },
  { id: 6, name: 'Depending on the location and design' }
]

const sampleUnits = [
  { id: 1, unitNumber: 'Unit no 1', propertyId: '5', propertyName: 'Design of a modern house as mansion blue couch' },
  {
    id: 2,
    unitNumber: 'Unit no 2',
    propertyId: '3',
    propertyName: 'Beautiful modern style luxury home exterior sunset'
  },
  { id: 3, unitNumber: 'Unit no 3', propertyId: '1', propertyName: 'A living room with mexican mansion blue' },
  {
    id: 4,
    unitNumber: 'Unit no 4',
    propertyId: '4',
    propertyName: 'A house with a lot of windows and a lot of plants'
  },
  { id: 5, unitNumber: 'Unit no 5', propertyId: '2', propertyName: 'Rendering of a modern villa' },
  { id: 6, unitNumber: 'Unit no 6', propertyId: '2', propertyName: 'Rendering of a modern villa' },
  {
    id: 7,
    unitNumber: 'Unit no 7',
    propertyId: '3',
    propertyName: 'Beautiful modern style luxury home exterior sunset'
  },
  { id: 8, unitNumber: 'Unit no 8', propertyId: '6', propertyName: 'Depending on the location and design' },
  { id: 9, unitNumber: 'Unit no 9', propertyId: '1', propertyName: 'A living room with mexican mansion blue' },
  {
    id: 10,
    unitNumber: 'Unit no 10',
    propertyId: '4',
    propertyName: 'A house with a lot of windows and a lot of plants'
  },
  { id: 11, unitNumber: 'Unit no 11', propertyId: '5', propertyName: 'Design of a modern house as mansion blue couch' },
  { id: 12, unitNumber: 'Unit no 12', propertyId: '6', propertyName: 'Depending on the location and design' }
]

const ExpensesListTable = ({ tableData }: { tableData?: ExpenseType[] }) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(tableData || sampleExpenses)
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [selectedUnit, setSelectedUnit] = useState<string>('')
  const [deleteExpenseOpen, setDeleteExpenseOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<ExpenseType | null>(null)
  const [editExpenseOpen, setEditExpenseOpen] = useState(false)
  const [selectedExpenseForEdit, setSelectedExpenseForEdit] = useState<ExpenseType | null>(null)

  // Get unique properties and units
  const uniqueProperties = useMemo(() => {
    const props = Array.from(new Set(data.map(e => e.propertyName).filter(Boolean)))

    
return props as string[]
  }, [data])

  const uniqueUnits = useMemo(() => {
    const units = Array.from(new Set(data.map(e => e.unitNo).filter(Boolean)))

    
return units as string[]
  }, [data])

  // Filter data
  useEffect(() => {
    let filtered = data

    if (globalFilter) {
      filtered = filtered.filter(
        expense =>
          expense.item?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          expense.propertyName?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          expense.unitNo?.toLowerCase().includes(globalFilter.toLowerCase())
      )
    }

    if (selectedProperty) {
      filtered = filtered.filter(expense => expense.propertyName === selectedProperty)
    }

    if (selectedUnit) {
      filtered = filtered.filter(expense => expense.unitNo === selectedUnit)
    }

    setFilteredData(filtered)
  }, [data, globalFilter, selectedProperty, selectedUnit])

  // Calculate expense statistics
  const expenseStats = useMemo(() => {
    const today = new Date()

    today.setHours(0, 0, 0, 0)

    let total = 0
    let upcoming = 0
    let unfulfilled = 0
    let paid = 0

    filteredData.forEach(expense => {
      const expenseDate = new Date(expense.date)

      expenseDate.setHours(0, 0, 0, 0)
      const amount = expense.amount

      total += amount

      // Check status first if available
      if (expense.status === 'paid') {
        paid += amount
      } else if (expense.status === 'unpaid' || expense.status === 'pending') {
        if (expenseDate > today) {
          // Upcoming expenses (future dates)
          upcoming += amount
        } else {
          // Unfulfilled expenses (past or today's dates - overdue/debt)
          unfulfilled += amount
        }
      } else {
        // No status field - use date-based logic
        if (expenseDate > today) {
          // Upcoming expenses (future dates)
          upcoming += amount
        } else if (expenseDate < today) {
          // Unfulfilled expenses (past dates - overdue/debt)
          unfulfilled += amount
        } else {
          // Today's expenses - consider as unpaid for now
          unfulfilled += amount
        }
      }
    })

    return { total, upcoming, unfulfilled, paid }
  }, [filteredData])

  // Handle delete expense
  const handleDeleteExpense = (expenseId: number) => {
    setData(data.filter(expense => expense.id !== expenseId))
    setDeleteExpenseOpen(false)
    setSelectedExpense(null)
  }

  // Get expense edit data
  const getExpenseEditData = useCallback((expense: ExpenseType | null) => {
    if (!expense) return null

    // Find property and unit IDs from names
    const property = sampleProperties.find(p => p.name === expense.propertyName)
    const unit = sampleUnits.find(u => u.unitNumber === expense.unitNo)

    return {
      id: expense.id,
      expenseName: expense.item,
      propertyId: property?.id.toString() || '',
      unitId: unit?.id.toString() || '',
      date: expense.date,
      responsibility: expense.responsibility || '',
      amount: expense.amount.toString(),
      image: expense.propertyImage || '',
      description: expense.comment
    }
  }, [])

  const columnHelper = createColumnHelper<ExpenseTypeWithAction>()

  // Status color mapping
  const expenseStatusObj: {
    [key: string]: {
      color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
    }
  } = {
    paid: { color: 'success' },
    unpaid: { color: 'error' },
    pending: { color: 'warning' }
  }

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
      columnHelper.accessor('propertyName', {
        header: 'Property',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Avatar
              variant='rounded'
              src={row.original.propertyImage}
              alt={row.original.propertyName}
              sx={{ width: 40, height: 40 }}
            >
              {row.original.propertyName?.[0]?.toUpperCase() || 'P'}
            </Avatar>
            <Typography color='text.primary' className='font-medium max-w-[200px] truncate'>
              {row.original.propertyName || '-'}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('unitNo', {
        header: 'Unit No',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.unitNo || '-'}</Typography>
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
        cell: ({ row }) => <Typography color='text.primary'>{row.original.responsibility || '-'}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status || 'pending'
          const statusConfig = expenseStatusObj[status] || { color: 'secondary' }

          return <Chip variant='tonal' label={status} size='small' color={statusConfig.color} className='capitalize' />
        }
      }),
      columnHelper.display({
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <OptionMenu
            iconButtonProps={{ size: 'small' }}
            options={[
              {
                text: 'Edit',
                icon: 'ri-pencil-line',
                menuItemProps: {
                  onClick: () => {
                    setSelectedExpenseForEdit(row.original)
                    setEditExpenseOpen(true)
                  }
                }
              },
              {
                text: 'Delete',
                icon: 'ri-delete-bin-line',
                menuItemProps: {
                  onClick: () => {
                    setSelectedExpense(row.original)
                    setDeleteExpenseOpen(true)
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
    data: filteredData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
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
      <ExpenseStatsCard
        totalExpenses={expenseStats.total}
        upcomingExpenses={expenseStats.upcoming}
        unfulfilledExpenses={expenseStats.unfulfilled}
        paidExpenses={expenseStats.paid}
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Expenses List'
          action={
            <div className='flex items-center gap-2'>
              <Button
                variant='contained'
                color='primary'
                onClick={() => setAddExpenseOpen(true)}
                startIcon={<i className='ri-add-line' />}
              >
                Add Expenses
              </Button>
              <OptionMenu options={['Refresh', 'Share']} />
            </div>
          }
        />
        <Divider />
        <CardContent className='flex flex-col gap-4'>
          {/* Filters */}
          <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
            <div className='flex flex-wrap gap-4 items-center'>
              <FormControl size='small' sx={{ minWidth: 180 }}>
                <InputLabel>Select Property</InputLabel>
                <Select
                  value={selectedProperty}
                  onChange={e => setSelectedProperty(e.target.value)}
                  label='Select Property'
                >
                  <MenuItem value=''>All Properties</MenuItem>
                  {uniqueProperties.map(prop => (
                    <MenuItem key={prop} value={prop}>
                      {prop}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Select Unit No</InputLabel>
                <Select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} label='Select Unit No'>
                  <MenuItem value=''>All Units</MenuItem>
                  {uniqueUnits.map(unit => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
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
              {table.getFilteredRowModel().rows.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                      No data available
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {table.getRowModel().rows.map(row => {
                    return (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    )
                  })}
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
            SelectProps={{
              inputProps: { 'aria-label': 'rows per page' }
            }}
            onPageChange={(_, page) => {
              table.setPageIndex(page)
            }}
            onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
          />
        </CardContent>
      </Card>
      {/* Add Expense Dialog */}
      <AddExpenseDrawer
        open={addExpenseOpen}
        handleClose={() => setAddExpenseOpen(false)}
        expenseData={data}
        setData={setData}
        mode='add'
      />

      {/* Edit Expense Dialog */}
      <AddExpenseDrawer
        open={editExpenseOpen}
        handleClose={() => {
          setEditExpenseOpen(false)
          setSelectedExpenseForEdit(null)
        }}
        expenseData={data}
        setData={setData}
        editData={getExpenseEditData(selectedExpenseForEdit)}
        mode='edit'
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteExpenseOpen}
        setOpen={setDeleteExpenseOpen}
        type='delete-expense'
        onConfirm={() => {
          if (selectedExpense) {
            handleDeleteExpense(selectedExpense.id)
          }
        }}
      />
    </>
  )
}

export default ExpensesListTable
