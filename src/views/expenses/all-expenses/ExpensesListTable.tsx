'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'
import Grid from '@mui/material/Grid2'

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
import type { ExpenseType } from '@/types/expenses/expenseTypes'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import TableFilters from './TableFilters'
import PageBanner from '@components/banner/PageBanner'
import AddExpenseDrawer from './AddExpenseDrawer'
import ExpenseStatsCard from './ExpenseStatsCard'

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

// Styled Components
const Icon = styled('i')({})

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
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
  // States
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

// Sample data - replace with actual data from API
const sampleExpenses: ExpenseType[] = [
  {
    id: 1,
    item: 'Booklets',
    amount: 1124.0,
    date: '2023-02-24',
    comment: 'This is here now'
  },
  {
    id: 2,
    item: 'Repairs',
    amount: 9048.0,
    date: '2023-02-22',
    comment: 'Expenses for Repairs'
  },
  {
    id: 3,
    item: 'Key Card',
    amount: 765.0,
    date: '2023-02-26',
    comment: 'Payment for Key card'
  },
  {
    id: 4,
    item: 'Booklet',
    amount: 676.0,
    date: '2023-02-27',
    comment: 'This is the expenses for the day'
  },
  {
    id: 5,
    item: 'Repairs',
    amount: 122.0,
    date: '2023-04-07',
    comment: 'For the repairs on the tables'
  },
  {
    id: 6,
    item: 'cheque books',
    amount: 232.0,
    date: '2023-04-07',
    comment: 'For the bank'
  },
  {
    id: 7,
    item: '',
    amount: 200.0,
    date: '2023-04-18',
    comment: 'For upkeep'
  },
  {
    id: 8,
    item: 'test',
    amount: 10.0,
    date: '2023-04-21',
    comment: 'Test'
  },
  {
    id: 9,
    item: 'Repairs',
    amount: 20.0,
    date: '2023-04-21',
    comment: 'Agent Phone'
  },
  {
    id: 10,
    item: 'rent',
    amount: 10.0,
    date: '2023-06-05',
    comment: 'cool'
  },
  {
    id: 11,
    item: 'Nummo',
    amount: 10.0,
    date: '2023-06-05',
    comment: 'Masa'
  },
  {
    id: 12,
    item: 'dispenser water',
    amount: 200.0,
    date: '2023-10-04',
    comment: 'water'
  },
  {
    id: 13,
    item: 'dispenser water',
    amount: 40.0,
    date: '2023-11-22',
    comment: 'water'
  }
]

const ExpensesListTable = ({ tableData }: { tableData?: ExpenseType[] }) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(tableData || sampleExpenses)
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)

  // Sync filteredData when data changes
  useEffect(() => {
    setFilteredData(data)
  }, [data])

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return filteredData.reduce((sum, expense) => sum + expense.amount, 0)
  }, [filteredData])

  const columnHelper = createColumnHelper<ExpenseTypeWithAction>()

  const handleExport = (format: string) => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`)
  }

  const columns = useMemo<ColumnDef<ExpenseTypeWithAction, any>[]>(
    () => [
      columnHelper.accessor('item', {
        header: 'ITEM',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.item || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('amount', {
        header: 'AMOUNT',
        cell: ({ row }) => (
          <Typography color='text.primary'>{row.original.amount.toFixed(2)}</Typography>
        )
      }),
      columnHelper.accessor('date', {
        header: 'DATE',
        cell: ({ row }) => <Typography>{row.original.date}</Typography>
      }),
      columnHelper.accessor('comment', {
        header: 'COMMENT',
        cell: ({ row }) => <Typography color='text.secondary'>{row.original.comment}</Typography>
      }),
      columnHelper.accessor('action', {
        header: 'ACTION',
        cell: ({ row }) => (
          <IconButton size='small' title='Edit'>
            <i className='ri-pencil-line text-textSecondary' />
          </IconButton>
        ),
        enableSorting: false
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  )

  const table = useReactTable({
    data: filteredData as ExpenseType[],
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
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  return (
    <>
      <PageBanner
        title='Explore and manage the Expenses List'
        description='Welcome to the Expenses List, where you can monitor and manage all expense records efficiently.'
        image='/images/cards/trophy.png'
      />
      <ExpenseStatsCard totalExpenses={totalExpenses} />
      <Card className='mbs-6'>
        <CardHeader
          title='Expenses List'
          action={
            <div className='flex items-center gap-2'>
              <OptionMenu options={['Refresh', 'Share']} />
            </div>
          }
        />
        <CardHeader title='Filters' className='pbe-4' />
        <TableFilters setData={setFilteredData} tableData={data} />
        <Divider />
        <CardContent className='flex flex-col gap-4'>
          {/* Export Buttons and Search */}
          <div className='flex justify-between gap-4 flex-col items-start sm:flex-row sm:items-center'>
            <div className='flex items-center gap-2 flex-wrap'>
              <Button variant='contained' color='primary' size='small' onClick={() => handleExport('copy')}>
                Copy
              </Button>
              <Button variant='contained' color='primary' size='small' onClick={() => handleExport('csv')}>
                CSV
              </Button>
              <Button variant='contained' color='primary' size='small' onClick={() => handleExport('excel')}>
                Excel
              </Button>
              <Button variant='contained' color='primary' size='small' onClick={() => handleExport('pdf')}>
                PDF
              </Button>
              <Button variant='contained' color='primary' size='small' onClick={() => handleExport('print')}>
                Print
              </Button>
            </div>
            <div className='flex items-center gap-2'>
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
                onClick={() => setAddExpenseOpen(true)}
                startIcon={<i className='ri-add-line' />}
              >
                Add New Expense
              </Button>
            </div>
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
                  {table
                    .getRowModel()
                    .rows.slice(0, table.getState().pagination.pageSize)
                    .map(row => {
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
      <AddExpenseDrawer
        open={addExpenseOpen}
        handleClose={() => setAddExpenseOpen(false)}
        expenseData={data}
        setData={setData}
      />
    </>
  )
}

export default ExpensesListTable

