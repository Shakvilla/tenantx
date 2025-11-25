'use client'

// React Imports
import { useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'
import Box from '@mui/material/Box'

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
  status: 'Fixed' | 'Pending' | 'In Progress' | 'Rejected' | 'New'
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
  Rejected: 'error',
  New: 'info'
}

// Styled Filter Button
const FilterButton = styled(Box)<{ active?: boolean }>(({ theme, active }) => ({
  cursor: 'pointer',
  padding: theme.spacing(2, 3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  position: 'relative',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: 'var(--mui-palette-action-hover)'
  },
  ...(active && {
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '2px',
      backgroundColor: 'var(--mui-palette-primary-main)'
    }
  })
}))

// Sample data
const maintenanceData: MaintenanceRequest[] = [
  { id: 1, room: 'A-101', tenant: 'John Doe', issue: 'Leaking faucet', status: 'Fixed' },
  { id: 2, room: 'B-205', tenant: 'Jane Smith', issue: 'Broken AC', status: 'Pending' },
  { id: 3, room: 'C-301', tenant: 'Bob Johnson', issue: 'Electrical issue', status: 'In Progress' },
  { id: 4, room: 'A-102', tenant: 'Alice Brown', issue: 'Plumbing problem', status: 'Rejected' },
  { id: 5, room: 'D-401', tenant: 'Charlie Wilson', issue: 'Door lock', status: 'Fixed' },
  { id: 6, room: 'D-405', tenant: 'Charlie Wilson', issue: 'Door lock', status: 'Fixed' },
  { id: 7, room: 'D-408', tenant: 'Charlie Wilson', issue: 'Door lock', status: 'New' },
  { id: 8, room: 'E-501', tenant: 'David Lee', issue: 'Window repair', status: 'New' }
]

const columnHelper = createColumnHelper<MaintenanceRequest>()

type FilterType = 'all' | 'new' | 'pending' | 'completed'

const MaintenanceRequestsTable = () => {
  const [rowSelection, setRowSelection] = useState({})
  const [data] = useState(maintenanceData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

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
          <Chip variant='tonal' label={row.original.status} color={statusColorMap[row.original.status]} size='small' />
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

  // Calculate stats for each filter
  const filterStats = useMemo(() => {
    const all = data.length
    const newCount = data.filter(item => item.status === 'New').length
    const pendingCount = data.filter(item => item.status === 'Pending' || item.status === 'In Progress').length
    const completedCount = data.filter(item => item.status === 'Fixed').length

    return {
      all,
      new: newCount,
      pending: pendingCount,
      completed: completedCount
    }
  }, [data])

  const filteredData = useMemo(() => {
    if (activeFilter === 'all') return data
    if (activeFilter === 'new') return data.filter(item => item.status === 'New')
    if (activeFilter === 'pending')
      return data.filter(item => item.status === 'Pending' || item.status === 'In Progress')
    if (activeFilter === 'completed') return data.filter(item => item.status === 'Fixed')
    return data
  }, [data, activeFilter])

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
      <CardHeader title='Maintenance Requests' />
      <CardContent className='flex flex-col gap-4'>
        {/* Filter Component */}
        <Box className='flex items-center border-b border-divider'>
          <FilterButton active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>
            <Typography variant='h6' className='font-bold' color='text.primary'>
              {filterStats.all}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              All Requests
            </Typography>
          </FilterButton>
          <Divider orientation='vertical' flexItem sx={{ height: 48, borderColor: 'divider' }} />
          <FilterButton active={activeFilter === 'new'} onClick={() => setActiveFilter('new')}>
            <Typography variant='h6' className='font-bold' color='text.primary'>
              {filterStats.new}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              New Requests
            </Typography>
          </FilterButton>
          <Divider orientation='vertical' flexItem sx={{ height: 48, borderColor: 'divider' }} />
          <FilterButton active={activeFilter === 'pending'} onClick={() => setActiveFilter('pending')}>
            <Typography variant='h6' className='font-bold' color='text.primary'>
              {filterStats.pending}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Pending Requests
            </Typography>
          </FilterButton>
          <Divider orientation='vertical' flexItem sx={{ height: 48, borderColor: 'divider' }} />
          <FilterButton active={activeFilter === 'completed'} onClick={() => setActiveFilter('completed')}>
            <Typography variant='h6' className='font-bold' color='text.primary'>
              {filterStats.completed}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Completed Requests
            </Typography>
          </FilterButton>
        </Box>

        {/* Search and Export */}
        <Box className='flex items-center justify-end gap-2'>
          <TextField
            size='small'
            placeholder='Search Maintenance'
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className='is-[200px]'
          />
          <Button variant='outlined' size='small'>
            Export
          </Button>
        </Box>
      </CardContent>
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
