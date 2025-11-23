'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
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
import type { ThemeColor } from '@core/types'
import type { CustomerType } from '@/types/members/customerTypes'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import OptionMenu from '@core/components/option-menu'
import TableFilters from './TableFilters'
import PageBanner from '@components/banner/PageBanner'
import AddCustomerDrawer from './AddCustomerDrawer'

// Util Imports
import { getInitials } from '@/utils/getInitials'

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

type CustomerTypeWithAction = CustomerType & {
  action?: string
}

type CustomerStatusType = {
  [key: string]: ThemeColor
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

// Vars
const customerStatusObj: CustomerStatusType = {
  active: 'success',
  suspend: 'error',
  inactive: 'secondary'
}

// Column Definitions
const columnHelper = createColumnHelper<CustomerTypeWithAction>()

// Sample data - replace with actual data from API
const sampleCustomers: CustomerType[] = [
  {
    id: 1,
    name: 'abena sarpong',
    phoneNumber: '233247999135',
    ussdCode: '747062',
    status: 'active',
    agent: 'Agent Admin',
    rate: 20,
    registrationDate: '2023-10-30 11:19:51'
  },
  {
    id: 2,
    name: 'Aboki Debugger',
    phoneNumber: '233247353942',
    ussdCode: '978156',
    status: 'active',
    agent: 'Emmanuel Ani',
    rate: 2,
    registrationDate: '2024-03-19 14:43:09'
  },
  {
    id: 3,
    name: 'Ama Bessah na',
    phoneNumber: '233552825746',
    ussdCode: '9PYF',
    status: 'suspend',
    rate: 0,
    registrationDate: '2023-02-23 14:32:32'
  },
  {
    id: 4,
    name: 'Alex',
    phoneNumber: '233247999135',
    ussdCode: 'ZQ8J',
    status: 'active',
    agent: 'Nana',
    rate: 0,
    registrationDate: '2023-10-30 11:19:51'
  },
  {
    id: 5,
    name: 'Danso 2',
    phoneNumber: '233558656543',
    ussdCode: 'I00M',
    status: 'active',
    agent: 'Emmanuel Ani',
    rate: 0,
    registrationDate: '2023-03-21 11:15:22'
  }
]

const CustomersListTable = ({ tableData }: { tableData?: CustomerType[] }) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(tableData || sampleCustomers)
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [addCustomerOpen, setAddCustomerOpen] = useState(false)

  // Sync filteredData when data changes
  useEffect(() => {
    setFilteredData(data)
  }, [data])

  const handleExport = (format: string) => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`)
  }

  const columns = useMemo<ColumnDef<CustomerTypeWithAction, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'NAME',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <CustomAvatar skin='light' color='primary' size={34}>
              {getInitials(row.original.name)}
            </CustomAvatar>
            <Typography color='text.primary' className='font-medium capitalize'>
              {row.original.name}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('phoneNumber', {
        header: 'PHONE NUMBER',
        cell: ({ row }) => <Typography>{row.original.phoneNumber}</Typography>
      }),
      columnHelper.accessor('ussdCode', {
        header: 'USSD CODE',
        cell: ({ row }) => <Typography>{row.original.ussdCode}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={row.original.status}
            size='small'
            color={customerStatusObj[row.original.status]}
            className='capitalize'
          />
        )
      }),
      columnHelper.accessor('agent', {
        header: 'AGENT',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.agent || '-'}</Typography>
      }),
      columnHelper.accessor('rate', {
        header: 'RATE',
        cell: ({ row }) => (
          <Typography color='text.primary'>{row.original.rate !== undefined ? row.original.rate : '-'}</Typography>
        )
      }),
      columnHelper.accessor('registrationDate', {
        header: 'REGISTRATION DATE',
        cell: ({ row }) => (
          <Typography
            className='px-2 py-1 rounded text-sm'
            style={{
              backgroundColor: 'rgba(30, 136, 229, 0.12)',
              color: 'var(--mui-palette-info-main)'
            }}
          >
            {row.original.registrationDate}
          </Typography>
        )
      }),
      columnHelper.accessor('action', {
        header: 'ACTION',
        cell: ({ row }) => (
          <div className='flex items-center gap-1'>
            <IconButton size='small' title='View'>
              <i className='ri-eye-line text-textSecondary' />
            </IconButton>
            <IconButton size='small' title='Edit'>
              <i className='ri-pencil-line text-textSecondary' />
            </IconButton>
            <IconButton size='small' title='Change Agent'>
              <i className='ri-user-add-line text-textSecondary' />
            </IconButton>
            <IconButton size='small' title='Accountss'>
              <i className='ri-device-line text-textSecondary' />
            </IconButton>
            <IconButton
              size='small'
              title='Delete'
              className={classnames({
                'text-error': row.original.status === 'suspend'
              })}
            >
              <i
                className={classnames('ri-user-unfollow-line', {
                  'text-error': row.original.status === 'suspend',
                  'text-textSecondary': row.original.status !== 'suspend'
                })}
              />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, filteredData]
  )

  const table = useReactTable({
    data: filteredData as CustomerType[],
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
        title='Explore and manage the Customers List'
        description='Welcome to the Customers List, where you can monitor and manage all customer information efficiently.'
        image='/images/cards/trophy.png'
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Customers List'
          action={
            <div className='flex items-center gap-2'>
              <Link href='#' className='flex items-center gap-1 text-primary no-underline'>
                <i className='ri-download-line' />
                <Typography variant='body2' color='primary'>
                  Download List of All Customers
                </Typography>
              </Link>
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
                onClick={() => setAddCustomerOpen(true)}
                startIcon={<i className='ri-user-add-line' />}
              >
                Add New Customer
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
      <AddCustomerDrawer
        open={addCustomerOpen}
        handleClose={() => setAddCustomerOpen(false)}
        customerData={data}
        setData={setData}
      />
    </>
  )
}

export default CustomersListTable
