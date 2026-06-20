'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'
import TablePagination from '@mui/material/TablePagination'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import { styled } from '@mui/material/styles'
import MenuItem from '@mui/material/MenuItem'
import Link from 'next/link'

// Third-party Imports
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

// API Imports
import { getMaintenanceRequests, type MaintenanceRequest } from '@/lib/api/maintenance'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'info' | 'error' | 'secondary'> = {
  NEW: 'info',
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  ON_HOLD: 'secondary',
  COMPLETED: 'success',
  CANCELLED: 'secondary',
  REJECTED: 'error'
}

const PRIORITY_COLOR: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  urgent: 'error'
}

// Styled Filter Button
const FilterButton = styled(Box, {
  shouldForwardProp: prop => prop !== 'active'
})<{ active?: boolean }>(({ theme, active }) => ({
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

type FilterType = 'all' | 'new' | 'pending' | 'completed'

const columnHelper = createColumnHelper<MaintenanceRequest>()

const MaintenanceRequestsTable = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  useEffect(() => {
    getMaintenanceRequests({ size: 50 })
      .then(res => setRequests(res.data ?? []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredData = useMemo(() => {
    if (activeFilter === 'all') return requests
    if (activeFilter === 'new') return requests.filter(r => r.status === 'NEW')
    if (activeFilter === 'pending') return requests.filter(r => ['PENDING', 'IN_PROGRESS', 'ON_HOLD'].includes(r.status))
    if (activeFilter === 'completed') return requests.filter(r => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status))
    return requests
  }, [requests, activeFilter])

  const filterStats = useMemo(() => ({
    all: requests.length,
    new: requests.filter(r => r.status === 'NEW').length,
    pending: requests.filter(r => ['PENDING', 'IN_PROGRESS', 'ON_HOLD'].includes(r.status)).length,
    completed: requests.filter(r => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status)).length
  }), [requests])

  const columns = useMemo<ColumnDef<MaintenanceRequest, any>[]>(() => [
    columnHelper.accessor('requestNumber', {
      header: 'REQ #',
      cell: ({ row }) => (
        <Typography variant='body2' className='font-medium' color='text.secondary'>
          {row.original.requestNumber ?? '-'}
        </Typography>
      )
    }),
    columnHelper.accessor('title', {
      header: 'TITLE',
      cell: ({ row }) => (
        <Typography variant='body2' className='font-medium max-w-[200px] truncate'>
          {row.original.title}
        </Typography>
      )
    }),
    columnHelper.accessor('priority', {
      header: 'PRIORITY',
      cell: ({ row }) => (
        <Chip
          variant='tonal'
          label={row.original.priority}
          color={PRIORITY_COLOR[row.original.priority?.toLowerCase()] ?? 'secondary'}
          size='small'
          className='capitalize'
        />
      )
    }),
    columnHelper.accessor('status', {
      header: 'STATUS',
      cell: ({ row }) => (
        <Chip
          variant='tonal'
          label={row.original.status?.replace(/_/g, ' ')}
          color={STATUS_COLOR[row.original.status] ?? 'secondary'}
          size='small'
          className='capitalize'
        />
      )
    })
  ], [])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title='Maintenance Requests'
        action={
          <Link href='/maintenance/requests' style={{ textDecoration: 'none' }}>
            <Typography variant='body2' color='primary' className='cursor-pointer'>
              View All
            </Typography>
          </Link>
        }
      />
      <CardContent className='flex flex-col gap-4'>
        {/* Filter tabs */}
        <Box className='flex items-center'>
          {(['all', 'new', 'pending', 'completed'] as FilterType[]).map((filter, idx, arr) => (
            <Box key={filter} className='flex items-center'>
              <FilterButton active={activeFilter === filter} onClick={() => setActiveFilter(filter)}>
                <Typography variant='h6' className='font-bold' color='text.primary'>
                  {loading ? <Skeleton width={24} /> : filterStats[filter]}
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ textTransform: 'capitalize' }}>
                  {filter === 'all' ? 'All' : filter === 'new' ? 'New' : filter === 'pending' ? 'In Progress' : 'Resolved'}
                </Typography>
              </FilterButton>
              {idx < arr.length - 1 && <Divider orientation='vertical' flexItem sx={{ height: 48, borderColor: 'divider' }} />}
            </Box>
          ))}
        </Box>

        {/* Search */}
        <Box className='flex items-center justify-between gap-2'>
          <TextField
            size='small'
            placeholder='Search requests'
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className='is-[200px]'
          />
          <TextField
            select
            size='small'
            value={activeFilter}
            onChange={e => setActiveFilter(e.target.value as FilterType)}
            sx={{ minWidth: 160 }}
            label='Filter'
          >
            <MenuItem value='all'>All</MenuItem>
            <MenuItem value='new'>New</MenuItem>
            <MenuItem value='pending'>In Progress</MenuItem>
            <MenuItem value='completed'>Resolved</MenuItem>
          </TextField>
        </Box>
      </CardContent>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} variant='rectangular' height={40} />)}
          </Box>
        ) : (
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={classnames({ 'flex items-center': header.column.getIsSorted(), 'cursor-pointer select-none': header.column.getCanSort() })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{ asc: <i className='ri-arrow-up-s-line text-xl' />, desc: <i className='ri-arrow-down-s-line text-xl' /> }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
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
                    <td colSpan={columns.length} className='text-center py-8'>
                      <Typography color='text.secondary'>No maintenance requests found</Typography>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Box>

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
