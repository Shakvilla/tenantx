'use client'

// React Imports
import { useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'

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

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import OptionMenu from '@core/components/option-menu'

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

type Tenant = {
  id: number
  name: string
  roomNo: string
  phone: string
  numberOfUnits: number
  costPerMonth: string
  leasePeriod: string
  totalAmount: string
  avatar?: string
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

// Sample data
const tenantsData: Tenant[] = [
  {
    id: 1,
    name: 'Jordan Stevenson',
    roomNo: 'A-101',
    phone: '+1 234 567 8900',
    numberOfUnits: 2,
    costPerMonth: '₵1,200',
    leasePeriod: '12 Months',
    totalAmount: '₵14,400'
  },
  {
    id: 2,
    name: 'Jordan Stevenson',
    roomNo: 'B-205',
    phone: '+1 234 567 8901',
    numberOfUnits: 1,
    costPerMonth: '₵800',
    leasePeriod: '6 Months',
    totalAmount: '₵4,800'
  },
  {
    id: 3,
    name: 'Benedetto Rossiter',
    roomNo: 'C-301',
    phone: '+1 234 567 8902',
    numberOfUnits: 3,
    costPerMonth: '₵2,500',
    leasePeriod: '24 Months',
    totalAmount: '₵60,000'
  },
  {
    id: 4,
    name: 'Jordan Stevenson',
    roomNo: 'D-401',
    phone: '+1 234 567 8903',
    numberOfUnits: 1,
    costPerMonth: '₵950',
    leasePeriod: '12 Months',
    totalAmount: '₵11,400'
  },
  {
    id: 5,
    name: 'Benedetto Rossiter',
    roomNo: 'E-501',
    phone: '+1 234 567 8904',
    numberOfUnits: 2,
    costPerMonth: '₵1,500',
    leasePeriod: '18 Months',
    totalAmount: '₵27,000'
  }
]

const columnHelper = createColumnHelper<Tenant>()

const TenantsTable = () => {
  const [rowSelection, setRowSelection] = useState({})
  const [data] = useState(tenantsData)
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<Tenant, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'TENANTS',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <CustomAvatar skin='light' size={34}>
              {getInitials(row.original.name)}
            </CustomAvatar>
            <Typography color='text.primary' className='font-medium'>
              {row.original.name}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('roomNo', {
        header: 'ROOM NO',
        cell: ({ row }) => <Typography>{row.original.roomNo}</Typography>
      }),
      columnHelper.accessor('phone', {
        header: 'PHONE',
        cell: ({ row }) => <Typography>{row.original.phone}</Typography>
      }),
      columnHelper.accessor('numberOfUnits', {
        header: 'NUMBER OF UNITS',
        cell: ({ row }) => <Typography>{row.original.numberOfUnits}</Typography>
      }),
      columnHelper.accessor('costPerMonth', {
        header: 'COST PER MONTH',
        cell: ({ row }) => <Typography>{row.original.costPerMonth}</Typography>
      }),
      columnHelper.accessor('leasePeriod', {
        header: 'LEASE PERIOD',
        cell: ({ row }) => <Typography>{row.original.leasePeriod}</Typography>
      }),
      columnHelper.accessor('totalAmount', {
        header: 'TOTAL AMOUNT',
        cell: ({ row }) => <Typography className='font-medium'>{row.original.totalAmount}</Typography>
      }),
      columnHelper.display({
        id: 'actions',
        header: 'ACTION',
        cell: () => <OptionMenu iconButtonProps={{ size: 'small' }} options={['View', 'Edit', 'Delete']} />
      })
    ],
    []
  )

  const table = useReactTable({
    data,
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
    <Card>
      <CardHeader
        title='Tenants'
        action={
          <div className='flex items-center gap-2'>
            <TextField
              size='small'
              placeholder='Search'
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className='is-[200px]'
            />
            <TextField select size='small' defaultValue='10' className='is-[100px]'>
              <option value='10'>10</option>
              <option value='25'>25</option>
              <option value='50'>50</option>
            </TextField>
            <Button variant='outlined' size='small'>
              Export
            </Button>
            <Button variant='contained' color='primary' size='small'>
              + Add Tenant
            </Button>
          </div>
        }
      />
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
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                  No data available
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        component='div'
        count={table.getFilteredRowModel().rows.length}
        page={table.getState().pagination.pageIndex}
        rowsPerPage={table.getState().pagination.pageSize}
        onPageChange={(_, page) => table.setPageIndex(page)}
        onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </Card>
  )
}

export default TenantsTable
