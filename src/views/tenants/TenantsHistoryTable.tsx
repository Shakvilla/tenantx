'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import TablePagination from '@mui/material/TablePagination'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

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
import { getOccupants } from '@/lib/api/occupants'
import type { OccupantRecord } from '@/lib/api/occupants'
import { getStoredTenantId } from '@/lib/api/storage'

// Component Imports
import RowActions from '@components/table/RowActions'
import PageBanner from '@components/banner/PageBanner'
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { calculateLeasePeriod } from '@/utils/math'

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
  id: string          // UUID
  name: string
  email: string
  phone: string
  roomNo: string
  propertyName: string
  numberOfUnits: number
  leasePeriod?: string
  moveInDate?: string
  moveOutDate?: string
  status: 'active' | 'inactive' | 'pending'
  avatar?: string
}

type TenantWithAction = Tenant & { action?: string }

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

function mapRecord(r: OccupantRecord): Tenant {
  return {
    id: r.id,
    name: `${r.firstName} ${r.lastName}`,
    email: r.email,
    phone: r.phone,
    roomNo: r.unitNo || '-',
    propertyName: r.propertyName || r.property?.name || '-',
    numberOfUnits: 1,
    leasePeriod: calculateLeasePeriod(r.moveInDate, r.moveOutDate),
    moveInDate: r.moveInDate || undefined,
    moveOutDate: r.moveOutDate || undefined,
    status: r.status,
    avatar: r.avatar || undefined,
  }
}

const columnHelper = createColumnHelper<TenantWithAction>()

const TenantsHistoryTable = () => {
  const [data, setData]           = useState<Tenant[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('')
  const [unitFilter, setUnitFilter] = useState('')

  useEffect(() => {
    const tenantId = getStoredTenantId()

    if (!tenantId) {
      setError('No tenant session found. Please log in again.')
      setLoading(false)
      return
    }

    // History = former (inactive) occupants only
    getOccupants(tenantId, { size: 200, status: 'inactive' })
      .then(res => {
        if (!res.success || !res.data) {
          setError(res.error?.message ?? 'Failed to load occupant history')
          return
        }
        setData(res.data.map(mapRecord))
      })
      .catch(err => setError(err?.message ?? 'Failed to load occupant history'))
      .finally(() => setLoading(false))
  }, [])

  // Derive filter options from live data
  const uniqueProperties = useMemo(
    () => Array.from(new Set(data.map(t => t.propertyName).filter(p => p !== '-'))),
    [data]
  )
  const uniqueUnits = useMemo(
    () => Array.from(new Set(data.map(t => t.roomNo).filter(u => u !== '-'))),
    [data]
  )

  const filteredData = useMemo(() => {
    let filtered = data

    if (propertyFilter) filtered = filtered.filter(t => t.propertyName === propertyFilter)
    if (unitFilter)     filtered = filtered.filter(t => t.roomNo === unitFilter)

    return filtered
  }, [data, propertyFilter, unitFilter])

  const columns = useMemo<ColumnDef<TenantWithAction, any>[]>(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
        )
      }),
      columnHelper.accessor('name', {
        header: 'TENANT',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            {row.original.avatar ? (
              <Avatar src={row.original.avatar} sx={{ width: 34, height: 34 }} />
            ) : (
              <CustomAvatar skin='light' color='primary' size={34}>
                {getInitials(row.original.name)}
              </CustomAvatar>
            )}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.name}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {row.original.email}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('phone', {
        header: 'PHONE',
        cell: ({ row }) => <Typography>{row.original.phone}</Typography>
      }),
      columnHelper.accessor('roomNo', {
        header: 'UNIT',
        cell: ({ row }) => <Typography>{row.original.roomNo}</Typography>
      }),
      columnHelper.accessor('propertyName', {
        header: 'PROPERTY',
        cell: ({ row }) => <Typography>{row.original.propertyName}</Typography>
      }),
      columnHelper.accessor('leasePeriod', {
        header: 'LEASE PERIOD',
        cell: ({ row }) => <Typography>{row.original.leasePeriod || '-'}</Typography>
      }),
      columnHelper.accessor('moveOutDate', {
        header: 'VACATED',
        cell: ({ row }) => (
          <Typography>
            {row.original.moveOutDate
              ? new Date(row.original.moveOutDate).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })
              : '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={row.original.status}
            size='small'
            color={
              row.original.status === 'active'
                ? 'success'
                : row.original.status === 'pending'
                ? 'warning'
                : 'default'
            }
            className='capitalize'
          />
        )
      }),
      columnHelper.display({
        id: 'actions',
        header: 'ACTIONS',
        cell: ({ row }) => (
          <RowActions
            iconButtonProps={{ size: 'small' }}
            options={[
              {
                text: 'View History',
                icon: 'ri-time-line',
                href: `/tenants/history/${row.original.id}`
              }
            ]}
          />
        )
      })
    ],
    []
  )

  const table = useReactTable({
    data: filteredData,
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
        title='Tenants History'
        description='All former (past) occupants across your properties'
        icon='ri-history-line'
      />
      <Card className='mbs-6'>
        <CardHeader
          title='All Occupants'
          action={
            <div className='flex items-center gap-2'>
              <RowActions options={['Refresh', 'Export']} />
            </div>
          }
        />
        <CardContent className='flex flex-col gap-4'>
          {/* Filters */}
          <Box className='flex flex-col gap-4 p-4 rounded-lg'>
            <div className='grid grid-cols-1 md:grid-cols-2 items-center gap-2'>
              <TextField
                select
                size='small'
                label='Select Property'
                value={propertyFilter}
                onChange={e => setPropertyFilter(e.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value=''>All Properties</MenuItem>
                {uniqueProperties.map(prop => (
                  <MenuItem key={prop} value={prop}>{prop}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size='small'
                label='Select Unit'
                value={unitFilter}
                onChange={e => setUnitFilter(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value=''>All Units</MenuItem>
                {uniqueUnits.map(u => (
                  <MenuItem key={u} value={u}>{u}</MenuItem>
                ))}
              </TextField>
            </div>
            <Divider />
            <div className='flex items-center justify-between gap-2'>
              <TextField
                size='small'
                placeholder='Search'
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                className='flex-1 min-w-[200px]'
              />
              <div className='flex items-center gap-2 ml-auto'>
                <TextField
                  select
                  size='small'
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                  sx={{ minWidth: 100 }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </TextField>
                <Button variant='outlined' size='small' startIcon={<i className='ri-upload-2-line' />}>
                  Export
                </Button>
              </div>
            </div>
          </Box>

          {/* Loading / Error / Table */}
          {loading ? (
            <Box className='flex justify-center items-center' sx={{ minHeight: 200 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity='error' action={
              <Button color='inherit' size='small' onClick={() => window.location.reload()}>Retry</Button>
            }>
              {error}
            </Alert>
          ) : (
            <>
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
                          No occupants found
                        </td>
                      </tr>
                    </tbody>
                  ) : (
                    <tbody>
                      {table
                        .getRowModel()
                        .rows.slice(0, table.getState().pagination.pageSize)
                        .map(row => (
                          <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                            {row.getVisibleCells().map(cell => (
                              <td key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
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
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default TenantsHistoryTable
