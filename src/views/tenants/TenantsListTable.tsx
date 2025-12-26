'use client'

// React Imports
import { useState, useMemo } from 'react'

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
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

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
  firstName?: string
  lastName?: string
  email: string
  phone: string
  occupation?: string
  age?: number
  familyMembers?: number
  password?: string
  roomNo: string
  propertyName: string
  propertyId?: string
  numberOfUnits: number
  costPerMonth?: string
  leasePeriod?: string
  totalAmount?: string
  status: 'active' | 'inactive'
  avatar?: string
  previousAddress?: {
    country: string
    state: string
    city: string
    zipCode: string
    address: string
  }
  permanentAddress?: {
    country: string
    state: string
    city: string
    zipCode: string
    address: string
  }
  leaseStartDate?: string
  leaseEndDate?: string
  ghanaCardFront?: string
  ghanaCardBack?: string
}

type TenantWithAction = Tenant & {
  action?: string
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })
  
return itemRank.passed
}

// Sample data
const sampleTenants: Tenant[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+233 24 123 4567',
    roomNo: 'Unit 101',
    propertyName: 'Xorla House',
    numberOfUnits: 1,
    costPerMonth: '₵1,200',
    leasePeriod: '12 months',
    totalAmount: '₵14,400',
    status: 'active',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+233 24 234 5678',
    roomNo: 'Unit 102',
    propertyName: 'Xorla House',
    numberOfUnits: 1,
    costPerMonth: '₵1,500',
    leasePeriod: '6 months',
    totalAmount: '₵9,000',
    status: 'active',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    phone: '+233 24 345 6789',
    roomNo: 'Unit 201',
    propertyName: 'Xorla House',
    numberOfUnits: 2,
    costPerMonth: '₵2,400',
    leasePeriod: '24 months',
    totalAmount: '₵57,600',
    status: 'active',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
  },
  {
    id: 4,
    name: 'Sarah Williams',
    email: 'sarah.williams@example.com',
    phone: '+233 24 456 7890',
    roomNo: 'Unit 301',
    propertyName: 'Sunset Apartments',
    numberOfUnits: 1,
    costPerMonth: '₵1,800',
    leasePeriod: '12 months',
    totalAmount: '₵21,600',
    status: 'active',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
  },
  {
    id: 5,
    name: 'David Brown',
    email: 'david.brown@example.com',
    phone: '+233 24 567 8901',
    roomNo: 'Unit 202',
    propertyName: 'Xorla House',
    numberOfUnits: 1,
    costPerMonth: '₵1,300',
    leasePeriod: '6 months',
    totalAmount: '₵7,800',
    status: 'inactive',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
  }
]

const columnHelper = createColumnHelper<TenantWithAction>()

const TenantsListTable = () => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(sampleTenants)
  const [globalFilter, setGlobalFilter] = useState('')
  const [status, setStatus] = useState('')
  const [property, setProperty] = useState('')
  const [unit, setUnit] = useState('')
  const [addTenantOpen, setAddTenantOpen] = useState(false)
  const [editTenantOpen, setEditTenantOpen] = useState(false)
  const [deleteTenantOpen, setDeleteTenantOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  // Calculate stats
  const stats = useMemo(() => {
    const activeTenants = data.filter(t => t.status === 'active').length
    const inactiveTenants = data.filter(t => t.status === 'inactive').length

    const totalRevenue = data
      .filter(t => t.status === 'active' && t.costPerMonth)
      .reduce((sum, tenant) => {
        const amount = parseFloat((tenant.costPerMonth || '0').replace(/[₵,]/g, ''))

        
return sum + amount
      }, 0)

    return {
      allTenants: data.length,
      activeTenants,
      inactiveTenants,
      totalRevenue: `₵${totalRevenue.toLocaleString()}`
    }
  }, [data])

  // Get unique properties for filter
  const uniqueProperties = useMemo(() => {
    const properties = Array.from(new Set(data.map(t => t.propertyName)))

    
return properties
  }, [data])

  // Get unique units for filter
  const uniqueUnits = useMemo(() => {
    const units = Array.from(new Set(data.map(t => t.roomNo)))

    
return units
  }, [data])

  // Sample properties and units data (in a real app, these would come from API)
  const properties = useMemo(
    () => [
      { id: 1, name: 'Xorla House' },
      { id: 2, name: 'Sunset Apartments' },
      { id: 3, name: 'Beautiful modern style luxury home exterior at sunset' }
    ],
    []
  )

  const units = useMemo(
    () => [
      { id: '1', unitNumber: 'Unit 101', propertyId: '1', propertyName: 'Xorla House' },
      { id: '2', unitNumber: 'Unit 102', propertyId: '1', propertyName: 'Xorla House' },
      { id: '3', unitNumber: 'Unit 201', propertyId: '1', propertyName: 'Xorla House' },
      { id: '4', unitNumber: 'Unit 202', propertyId: '1', propertyName: 'Xorla House' },
      { id: '5', unitNumber: 'Unit 301', propertyId: '2', propertyName: 'Sunset Apartments' },
      { id: '6', unitNumber: 'Unit 401', propertyId: '2', propertyName: 'Sunset Apartments' },
      {
        id: '7',
        unitNumber: 'Unite 4',
        propertyId: '3',
        propertyName: 'Beautiful modern style luxury home exterior at sunset'
      }
    ],
    []
  )

  const handleDeleteTenant = (tenantId: number) => {
    setData(data.filter(t => t.id !== tenantId))
    setDeleteTenantOpen(false)
    setSelectedTenant(null)
  }

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setEditTenantOpen(true)
  }

  // Convert Tenant to TenantEditData format
  const getTenantEditData = (tenant: Tenant | null) => {
    if (!tenant) return null

    // Find propertyId from propertyName if not set
    const propertyId = tenant.propertyId || properties.find(p => p.name === tenant.propertyName)?.id.toString() || ''

    // Find unitId from roomNo
    const unit = units.find(u => u.unitNumber === tenant.roomNo)
    const unitId = unit?.id.toString() || ''

    // Split name into firstName and lastName if not already split
    let firstName = tenant.firstName || ''
    let lastName = tenant.lastName || ''

    if (!firstName && !lastName && tenant.name) {
      const nameParts = tenant.name.split(' ')

      firstName = nameParts[0] || ''
      lastName = nameParts.slice(1).join(' ') || ''
    }

    return {
      id: tenant.id,
      firstName,
      lastName,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      occupation: tenant.occupation || '',
      age: tenant.age,
      familyMembers: tenant.familyMembers,
      password: tenant.password || '',
      roomNo: tenant.roomNo,
      propertyName: tenant.propertyName,
      propertyId,
      unitId,
      numberOfUnits: tenant.numberOfUnits,
      costPerMonth: tenant.costPerMonth || '',
      leasePeriod: tenant.leasePeriod || '',
      totalAmount: tenant.totalAmount || '',
      status: tenant.status,
      avatar: tenant.avatar,
      previousAddress: tenant.previousAddress,
      permanentAddress: tenant.permanentAddress,
      leaseStartDate: tenant.leaseStartDate || '',
      leaseEndDate: tenant.leaseEndDate || '',
      ghanaCardFront: tenant.ghanaCardFront,
      ghanaCardBack: tenant.ghanaCardBack
    }
  }

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = data

    if (status) {
      filtered = filtered.filter(t => t.status === status)
    }

    if (property) {
      filtered = filtered.filter(t => t.propertyName === property)
    }

    if (unit) {
      filtered = filtered.filter(t => t.roomNo === unit)
    }

    return filtered
  }, [data, status, property, unit])

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
        header: 'ROOM NO',
        cell: ({ row }) => <Typography>{row.original.roomNo}</Typography>
      }),
      columnHelper.accessor('propertyName', {
        header: 'PROPERTY',
        cell: ({ row }) => <Typography>{row.original.propertyName}</Typography>
      }),
      columnHelper.accessor('numberOfUnits', {
        header: 'UNITS',
        cell: ({ row }) => <Typography>{row.original.numberOfUnits}</Typography>
      }),
      columnHelper.accessor('costPerMonth', {
        header: 'COST/MONTH',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.costPerMonth}
          </Typography>
        )
      }),
      columnHelper.accessor('leasePeriod', {
        header: 'LEASE PERIOD',
        cell: ({ row }) => <Typography>{row.original.leasePeriod}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={row.original.status}
            size='small'
            color={row.original.status === 'active' ? 'success' : 'warning'}
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
    <>
      <PageBanner
        title='Tenants Overview'
        description='Manage and view all your tenants in one place'
        icon='ri-group-line'
      />
      <TenantsStatsCard
        allTenants={stats.allTenants}
        activeTenants={stats.activeTenants}
        inactiveTenants={stats.inactiveTenants}
        totalRevenue={stats.totalRevenue}
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Tenants List'
          action={
            <div className='flex items-center gap-2'>
              <OptionMenu options={['Refresh', 'Share']} />
            </div>
          }
        />
        <CardContent className='flex flex-col gap-4'>
          {/* Filters Section */}
          <Box className='flex flex-col gap-4 p-4  rounded-lg'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-center gap-2 '>
              <TextField
                select
                size='small'
                label='Select Property'
                value={property}
                onChange={e => setProperty(e.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value=''>All Properties</MenuItem>
                {uniqueProperties.map(prop => (
                  <MenuItem key={prop} value={prop}>
                    {prop}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size='small'
                label='Select Unit'
                value={unit}
                onChange={e => setUnit(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value=''>All Units</MenuItem>
                {uniqueUnits.map(unitOption => (
                  <MenuItem key={unitOption} value={unitOption}>
                    {unitOption}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size='small'
                label='Status'
                value={status}
                onChange={e => setStatus(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value=''>All Status</MenuItem>
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
              </TextField>
            </div>
            <Divider />

            <div className='flex items-center  justify-between gap-2'>
              <div>
                <TextField
                  size='small'
                  placeholder='Search'
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  className='flex-1 min-w-[200px]'
                />
              </div>

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

      {/* Add Tenant Dialog */}
      <AddTenantDialog
        open={addTenantOpen}
        handleClose={() => setAddTenantOpen(false)}
        properties={properties}
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
        }}
        properties={properties}
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
        onConfirm={() => {
          if (selectedTenant) {
            handleDeleteTenant(selectedTenant.id)
          }
        }}
      />
    </>
  )
}

export default TenantsListTable
