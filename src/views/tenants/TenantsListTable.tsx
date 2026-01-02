'use client'

// React Imports
import { useState, useMemo, useEffect, useCallback } from 'react'

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

// Component Imports
import OptionMenu from '@core/components/option-menu'
import PageBanner from '@components/banner/PageBanner'
import TenantsStatsCard from './TenantsStatsCard'
import CustomAvatar from '@core/components/mui/Avatar'
import AddTenantDialog from './AddTenantDialog'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'

// API Imports
import { 
  getTenants, 
  getTenantStats, 
  deleteTenant,
  type TenantRecord,
  type TenantStats 
} from '@/lib/api/tenants'
import { getProperties } from '@/lib/api/properties'

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

type TenantWithAction = TenantRecord & {
  action?: string
}

import type { Unit } from '@/types/property'

// Property type for dropdown
type Property = {
  id: string
  name: string
}


const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })
  
return itemRank.passed
}

const columnHelper = createColumnHelper<TenantWithAction>()

const TenantsListTable = () => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<TenantRecord[]>([])
  const [stats, setStats] = useState<TenantStats>({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [status, setStatus] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  
  // Dialog states
  const [addTenantOpen, setAddTenantOpen] = useState(false)
  const [editTenantOpen, setEditTenantOpen] = useState(false)
  const [deleteTenantOpen, setDeleteTenantOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<TenantRecord | null>(null)
  
  // Properties and units for dropdowns
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])

  // Fetch tenants from API
  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getTenants({
        page: page + 1,
        pageSize,
        search: globalFilter || undefined,
        status: status || undefined,
        propertyId: propertyFilter || undefined,
      })

      setData(response?.data || [])
      setTotal(response?.pagination?.total || 0)
    } catch (err) {
      console.error('Failed to load tenants:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tenants')
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, globalFilter, status, propertyFilter])

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    try {
      const response = await getTenantStats()
      if (response.data) {
        setStats(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [])

  // Fetch properties for filter dropdown
  const fetchProperties = useCallback(async () => {
    try {
      const response = await getProperties({ pageSize: 100 })
      if (response?.data) {
        setProperties(response.data.map(p => ({ id: p.id, name: p.name })))
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err)
    }
  }, [])

  // Load data on mount and when filters change
  useEffect(() => {
    fetchTenants()
  }, [fetchTenants])

  useEffect(() => {
    fetchStats()
    fetchProperties()
  }, [fetchStats, fetchProperties])

  // Handle delete
  const handleDelete = async () => {
    if (!selectedTenant) return

    try {
      await deleteTenant(selectedTenant.id)
      await fetchTenants()
      await fetchStats()
      setSelectedTenant(null)
      setDeleteTenantOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tenant')
    }
  }

  // Handle edit
  const handleEditTenant = (tenant: TenantRecord) => {
    setSelectedTenant(tenant)
    setEditTenantOpen(true)
  }

  // Convert TenantRecord to TenantEditData format for AddTenantDialog
  const getTenantEditData = (tenant: TenantRecord | null) => {
    if (!tenant) return null

    return {
      id: tenant.id,
      firstName: tenant.first_name,
      lastName: tenant.last_name,
      email: tenant.email,
      phone: tenant.phone,
      propertyId: tenant.property_id || '',
      unitId: tenant.unit_id || '',
      roomNo: tenant.unit_no || '',
      propertyName: tenant.property?.name || '',
      leaseStartDate: tenant.move_in_date || '',
      leaseEndDate: tenant.move_out_date || '',
      avatar: tenant.avatar || undefined,
    }
  }

  // Get unique properties from current data for quick filter
  const uniqueProperties = useMemo(() => {
    const propMap = new Map<string, string>()
    data.forEach(t => {
      if (t.property?.id && t.property?.name) {
        propMap.set(t.property.id, t.property.name)
      }
    })
    return Array.from(propMap.entries()).map(([id, name]) => ({ id, name }))
  }, [data])

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
        cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
      }),
      columnHelper.accessor('first_name', {
        header: 'TENANT',
        cell: ({ row }) => {
          const fullName = `${row.original.first_name} ${row.original.last_name}`
          return (
            <div className='flex items-center gap-3'>
              {row.original.avatar ? (
                <Avatar src={row.original.avatar} sx={{ width: 34, height: 34 }} />
              ) : (
                <CustomAvatar skin='light' color='primary' size={34}>
                  {getInitials(fullName)}
                </CustomAvatar>
              )}
              <div className='flex flex-col'>
                <Typography color='text.primary' className='font-medium'>
                  {fullName}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {row.original.email}
                </Typography>
              </div>
            </div>
          )
        }
      }),
      columnHelper.accessor('phone', {
        header: 'PHONE',
        cell: ({ row }) => <Typography>{row.original.phone}</Typography>
      }),
      columnHelper.accessor('unit_no', {
        header: 'ROOM NO',
        cell: ({ row }) => <Typography>{row.original.unit_no || row.original.unit?.unit_no || '-'}</Typography>
      }),
      columnHelper.accessor('property', {
        header: 'PROPERTY',
        cell: ({ row }) => <Typography>{row.original.property?.name || '-'}</Typography>
      }),
      columnHelper.accessor('move_in_date', {
        header: 'MOVE IN',
        cell: ({ row }) => (
          <Typography>
            {row.original.move_in_date 
              ? new Date(row.original.move_in_date).toLocaleDateString() 
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
          <OptionMenu
            iconButtonProps={{ size: 'small' }}
            options={[
              {
                text: 'View',
                icon: 'ri-eye-line',
                href: `/tenants/${row.original.id}`
              },
              {
                text: 'Edit',
                icon: 'ri-pencil-line',
                menuItemProps: {
                  onClick: () => handleEditTenant(row.original)
                }
              },
              {
                text: 'Delete',
                icon: 'ri-delete-bin-line',
                menuItemProps: {
                  onClick: () => {
                    setSelectedTenant(row.original)
                    setDeleteTenantOpen(true)
                  }
                }
              }
            ]}
          />
        )
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
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
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
        title='Tenants Overview'
        description='Manage and view all your tenants in one place'
        icon='ri-group-line'
      />
      <TenantsStatsCard
        allTenants={stats.total}
        activeTenants={stats.active}
        inactiveTenants={stats.inactive}
        totalRevenue={`₵${stats.pending}`}
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Tenants List'
          action={
            <div className='flex items-center gap-2'>
              <Button 
                size='small' 
                startIcon={<i className='ri-refresh-line' />}
                onClick={() => {
                  fetchTenants()
                  fetchStats()
                }}
              >
                Refresh
              </Button>
              <OptionMenu options={['Share', 'Export']} />
            </div>
          }
        />
        <CardContent className='flex flex-col gap-4'>
          {error && (
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Filters Section */}
          <Box className='flex flex-col gap-4 p-4 rounded-lg'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-center gap-2'>
              <TextField
                select
                size='small'
                label='Select Property'
                value={propertyFilter}
                onChange={e => {
                  setPropertyFilter(e.target.value)
                  setPage(0)
                }}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value=''>All Properties</MenuItem>
                {(properties.length > 0 ? properties : uniqueProperties).map(prop => (
                  <MenuItem key={prop.id} value={prop.id}>
                    {prop.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size='small'
                label='Status'
                value={status}
                onChange={e => {
                  setStatus(e.target.value)
                  setPage(0)
                }}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value=''>All Status</MenuItem>
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
                <MenuItem value='pending'>Pending</MenuItem>
              </TextField>
            </div>
            <Divider />

            <div className='flex items-center justify-between gap-2'>
              <div>
                <TextField
                  size='small'
                  placeholder='Search tenants...'
                  value={globalFilter}
                  onChange={e => {
                    setGlobalFilter(e.target.value)
                    setPage(0)
                  }}
                  className='flex-1 min-w-[200px]'
                />
              </div>

              <div className='flex items-center gap-2 ml-auto'>
                <TextField
                  select
                  size='small'
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value))
                    setPage(0)
                  }}
                  sx={{ minWidth: 100 }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </TextField>
                <Button variant='outlined' size='small' startIcon={<i className='ri-upload-2-line' />}>
                  Export
                </Button>
                <Button
                  variant='contained'
                  color='primary'
                  size='small'
                  startIcon={<i className='ri-add-line' />}
                  onClick={() => setAddTenantOpen(true)}
                >
                  Add Tenant
                </Button>
              </div>
            </div>
          </Box>

          {/* Table */}
          <div className='overflow-x-auto'>
            {loading ? (
              <Box className='flex justify-center items-center py-10'>
                <CircularProgress />
              </Box>
            ) : (
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
                {data.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                        No tenants found
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
            )}
          </div>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component='div'
            className='border-bs'
            count={total}
            rowsPerPage={pageSize}
            page={page}
            SelectProps={{
              inputProps: { 'aria-label': 'rows per page' }
            }}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={e => {
              setPageSize(Number(e.target.value))
              setPage(0)
            }}
          />
        </CardContent>
      </Card>

      {/* Add Tenant Dialog */}
      <AddTenantDialog
        open={addTenantOpen}
        handleClose={() => {
          setAddTenantOpen(false)
          fetchTenants()
          fetchStats()
        }}
        properties={properties.map(p => ({ id: p.id, name: p.name }))}
        units={units}
        tenantsData={data}
        setData={setData}
        mode='add'
      />

      {/* Edit Tenant Dialog */}
      <AddTenantDialog
        open={editTenantOpen}
        handleClose={() => {
          setEditTenantOpen(false)
          setSelectedTenant(null)
          fetchTenants()
          fetchStats()
        }}
        properties={properties.map(p => ({ id: p.id, name: p.name }))}
        units={units}
        tenantsData={data}
        setData={setData}
        editData={getTenantEditData(selectedTenant)}
        mode='edit'
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteTenantOpen}
        setOpen={setDeleteTenantOpen}
        type='delete-tenant'
        onConfirm={handleDelete}
      />
    </>
  )
}

export default TenantsListTable
