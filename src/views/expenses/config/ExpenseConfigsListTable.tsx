'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
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

// Component Imports
import OptionMenu from '@core/components/option-menu'
import PageBanner from '@components/banner/PageBanner'
import AddExpenseConfigDrawer from './AddExpenseConfigDrawer'

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
const sampleExpenseConfigs: ExpenseConfigType[] = [
  {
    id: 1,
    item: 'cheque books',
    category: 'Administrative'
  },
  {
    id: 2,
    item: 'demo item',
    category: ''
  },
  {
    id: 3,
    item: 'dispenser water',
    category: 'Occupancy'
  },
  {
    id: 4,
    item: 'Nummo',
    category: ''
  },
  {
    id: 5,
    item: 'other',
    category: ''
  },
  {
    id: 6,
    item: 'pass books',
    category: ''
  },
  {
    id: 7,
    item: 'pen',
    category: 'Administrative'
  },
  {
    id: 8,
    item: 'pes',
    category: 'Administrative'
  },
  {
    id: 9,
    item: 'rent',
    category: 'Occupancy'
  }
]

const ExpenseConfigsListTable = ({ tableData }: { tableData?: ExpenseConfigType[] }) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(tableData || sampleExpenseConfigs)
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [addExpenseConfigOpen, setAddExpenseConfigOpen] = useState(false)

  // Sync filteredData when data changes
  useEffect(() => {
    setFilteredData(data)
  }, [data])

  const handleExport = (format: string) => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`)
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
        header: () => <div className='text-right'>CATEGORY</div>,
        cell: ({ row }) => (
          <Typography color='text.primary' className='text-right'>
            {row.original.category || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('action', {
        header: () => <div className='text-right'>ACTION</div>,
        cell: ({ row }) => (
          <div className='flex justify-end'>
            <IconButton size='small' title='Edit'>
              <i className='ri-pencil-line text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  )

  const table = useReactTable({
    data: filteredData as ExpenseConfigType[],
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
        title='Explore and manage the Expense Configs'
        description='Welcome to the Expense Configs, where you can monitor and manage all expense item configurations efficiently.'
        image='/images/cards/trophy.png'
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Expense Configs'
          action={
            <div className='flex items-center gap-2'>
              <OptionMenu options={['Refresh', 'Share']} />
            </div>
          }
        />
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
                onClick={() => setAddExpenseConfigOpen(true)}
                startIcon={<i className='ri-add-line' />}
              >
                Add New Expense Item
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
      <AddExpenseConfigDrawer
        open={addExpenseConfigOpen}
        handleClose={() => setAddExpenseConfigOpen(false)}
        expenseConfigData={data}
        setData={setData}
      />
    </>
  )
}

export default ExpenseConfigsListTable

