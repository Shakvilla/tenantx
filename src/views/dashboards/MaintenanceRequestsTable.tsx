'use client'

// React Imports
import { useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
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
import OptionMenu from '@core/components/option-menu'

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

type MaintenanceRequest = {
  id: number
  room: string
  tenant: string
  issue: string
  status: 'Fixed' | 'Pending' | 'In Progress' | 'Rejected'
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const statusColorMap: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
  Fixed: 'success',
  Pending: 'warning',
  'In Progress': 'info',
  Rejected: 'error'
}

// Sample data
const maintenanceData: MaintenanceRequest[] = [
  { id: 1, room: 'A-101', tenant: 'John Doe', issue: 'Leaking faucet', status: 'Fixed' },
  { id: 2, room: 'B-205', tenant: 'Jane Smith', issue: 'Broken AC', status: 'Pending' },
  { id: 3, room: 'C-301', tenant: 'Bob Johnson', issue: 'Electrical issue', status: 'In Progress' },
  { id: 4, room: 'A-102', tenant: 'Alice Brown', issue: 'Plumbing problem', status: 'Rejected' },
  { id: 5, room: 'D-401', tenant: 'Charlie Wilson', issue: 'Door lock', status: 'Fixed' }
]

const columnHelper = createColumnHelper<MaintenanceRequest>()

const MaintenanceRequestsTable = () => {
  const [rowSelection, setRowSelection] = useState({})
  const [data] = useState(maintenanceData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const columns = useMemo<ColumnDef<MaintenanceRequest, any>[]>(
    () => [
      columnHelper.accessor('room', {
        header: 'ROOM',
        cell: ({ row }) => <Typography>{row.original.room}</Typography>
      }),
      columnHelper.accessor('tenant', {
        header: 'TENANT',
        cell: ({ row }) => <Typography>{row.original.tenant}</Typography>
      }),
      columnHelper.accessor('issue', {
        header: 'ISSUE',
        cell: ({ row }) => <Typography>{row.original.issue}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={row.original.status}
            color={statusColorMap[row.original.status]}
            size='small'
          />
        )
      }),
      columnHelper.display({
        id: 'actions',
        header: 'ACTION',
        cell: () => <OptionMenu iconButtonProps={{ size: 'small' }} options={['View', 'Edit', 'Delete']} />
      })
    ],
    []
  )

  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return data
    return data.filter(item => item.status === statusFilter)
  }, [data, statusFilter])

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
    <Card>
      <CardHeader
        title='Maintenance Requests'
        action={
          <div className='flex items-center gap-2'>
            <TextField
              size='small'
              placeholder='Search Maintenance'
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className='is-[200px]'
            />
            <TextField
              select
              size='small'
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className='is-[180px]'
            >
              <MenuItem value='all'>All Status</MenuItem>
              <MenuItem value='Fixed'>Fixed</MenuItem>
              <MenuItem value='Pending'>Pending</MenuItem>
              <MenuItem value='In Progress'>In Progress</MenuItem>
              <MenuItem value='Rejected'>Rejected</MenuItem>
            </TextField>
            <Button variant='outlined' size='small'>
              Export
            </Button>
          </div>
        }
        subheader={
          <div className='flex items-center gap-4 mt-2'>
            <Typography variant='body2'>230 All Requests</Typography>
            <Typography variant='body2' color='info.main'>56 New Requests</Typography>
            <Typography variant='body2' color='warning.main'>32 Pending Requests</Typography>
            <Typography variant='body2' color='success.main'>124 Completed Requests</Typography>
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

export default MaintenanceRequestsTable

