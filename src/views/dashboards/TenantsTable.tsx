'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import TablePagination from '@mui/material/TablePagination'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'

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
import { getOccupants, type OccupantRecord } from '@/lib/api/occupants'
import { getStoredTenantId } from '@/lib/api/storage'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'secondary'> = {
  active: 'success',
  inactive: 'error',
  pending: 'warning'
}

const columnHelper = createColumnHelper<OccupantRecord>()

const TenantsTable = () => {
  const [occupants, setOccupants] = useState<OccupantRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')

  useEffect(() => {
    const tenantId = getStoredTenantId()
    if (!tenantId) { setLoading(false); return }

    getOccupants(tenantId, { size: 50 })
      .then(res => setOccupants(res.data ?? []))
      .catch(() => setOccupants([]))
      .finally(() => setLoading(false))
  }, [])

  const columns = useMemo<ColumnDef<OccupantRecord, any>[]>(() => [
    columnHelper.accessor(row => `${row.firstName} ${row.lastName}`, {
      id: 'name',
      header: 'OCCUPANT',
      cell: ({ row }) => {
        const fullName = `${row.original.firstName} ${row.original.lastName}`
        return (
          <Link href={`/occupants/${row.original.id}`} style={{ textDecoration: 'none' }}>
            <div className='flex items-center gap-3'>
              <CustomAvatar skin='light' size={34} src={row.original.avatar}>
                {!row.original.avatar ? getInitials(fullName) : undefined}
              </CustomAvatar>
              <div>
                <Typography color='text.primary' className='font-medium hover:text-primary'>
                  {fullName}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {row.original.email}
                </Typography>
              </div>
            </div>
          </Link>
        )
      }
    }),
    columnHelper.accessor('unitNo', {
      header: 'UNIT',
      cell: ({ row }) => (
        <Typography variant='body2'>{row.original.unitNo ?? '-'}</Typography>
      )
    }),
    columnHelper.accessor('phone', {
      header: 'PHONE',
      cell: ({ row }) => (
        <Typography variant='body2'>{row.original.phone ?? '-'}</Typography>
      )
    }),
    columnHelper.accessor('status', {
      header: 'STATUS',
      cell: ({ row }) => {
        const status = row.original.status ?? 'inactive'
        return (
          <Chip
            variant='tonal'
            label={status}
            color={STATUS_COLOR[status] ?? 'secondary'}
            size='small'
            className='capitalize'
          />
        )
      }
    }),
    columnHelper.accessor('moveInDate', {
      header: 'MOVE IN',
      cell: ({ row }) => {
        const d = row.original.moveInDate
        if (!d) return <Typography variant='body2'>-</Typography>
        const date = new Date(d)
        return (
          <Typography variant='body2'>
            {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Typography>
        )
      }
    })
  ], [])

  const table = useReactTable({
    data: occupants,
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
    <Card>
      <CardHeader
        title='Recent Occupants'
        action={
          <div className='flex items-center gap-2'>
            <TextField
              size='small'
              placeholder='Search'
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className='is-[200px]'
            />
            <Link href='/occupants' style={{ textDecoration: 'none' }}>
              <Typography variant='body2' color='primary' className='cursor-pointer'>
                View All
              </Typography>
            </Link>
          </div>
        }
      />
      {loading ? (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} variant='rectangular' height={52} />)}
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
                    <Typography color='text.secondary'>No occupants found</Typography>
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
