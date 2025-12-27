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
import Switch from '@mui/material/Switch'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import TablePagination from '@mui/material/TablePagination'
import Checkbox from '@mui/material/Checkbox'
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

// Type Imports
import type { ThemeColor } from '@core/types'
import type { Property, PropertyStats } from '@/types/property'

// API Imports
import { getProperties, getPropertyStats, deleteProperty } from '@/lib/api/properties'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import PageBanner from '@components/banner/PageBanner'
import PropertiesStatsCard from './PropertiesStatsCard'
import CustomAvatar from '@core/components/mui/Avatar'
import AddPropertyDialog from './AddPropertyDialog'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'

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

type PropertyWithAction = Property & {
  action?: string
}

type PropertyTypeObj = {
  [key: string]: {
    icon: string
    color: ThemeColor
  }
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })
  
return itemRank.passed
}

// Vars
const propertyTypeObj: PropertyTypeObj = {
  house: { icon: 'ri-home-line', color: 'primary' },
  apartment: { icon: 'ri-building-line', color: 'info' },
  residential: { icon: 'ri-home-2-line', color: 'success' },
  commercial: { icon: 'ri-store-line', color: 'warning' },
  mixed: { icon: 'ri-community-line', color: 'secondary' }
}

const columnHelper = createColumnHelper<PropertyWithAction>()

const PropertiesListTable = () => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<Property[]>([])
  const [stats, setStats] = useState<PropertyStats>({
    total: 0,
    active: 0,
    inactive: 0,
    maintenance: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    occupancyRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [bedroom, setBedroom] = useState('')
  const [bathroom, setBathroom] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [addPropertyOpen, setAddPropertyOpen] = useState(false)
  const [editPropertyOpen, setEditPropertyOpen] = useState(false)
  const [deletePropertyOpen, setDeletePropertyOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getProperties({
        page: page + 1,
        pageSize,
        search: globalFilter || undefined,
        type: propertyType || undefined,
        status: statusFilter || undefined,
      })

      // Handle response with defensive checks
      setData(response?.data || [])
      setTotal(response?.pagination?.total || 0)
    } catch (err) {
      console.error('Failed to load properties:', err)
      setError(err instanceof Error ? err.message : 'Failed to load properties')
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, globalFilter, propertyType, statusFilter])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await getPropertyStats()
      if (response.data) {
        setStats(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [])

  // Load data on mount and when filters change
  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Handle delete
  const handleDelete = async () => {
    if (!selectedProperty) return

    try {
      await deleteProperty(selectedProperty.id)
      await fetchProperties()
      await fetchStats()
      setSelectedProperty(null)
      setDeletePropertyOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete property')
    }
  }

  // Filter data locally for bedrooms/bathrooms (since these may not be in API yet)
  const filteredData = useMemo(() => {
    let filtered = data

    if (bedroom) {
      filtered = filtered.filter(p => p.bedrooms === Number(bedroom))
    }

    if (bathroom) {
      filtered = filtered.filter(p => p.bathrooms === Number(bathroom))
    }

    return filtered
  }, [data, bedroom, bathroom])

  const columns = useMemo<ColumnDef<PropertyWithAction, any>[]>(
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
        header: 'PROPERTY NAME',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Avatar 
              variant='rounded' 
              sx={{ width: 30, height: 30 }} 
              src={row.original.images?.[row.original.thumbnail_index ?? 0]} 
            />
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.name}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {row.original.address?.city || row.original.district}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('type', {
        header: 'PROPERTY TYPE',
        cell: ({ row }) => {
          const typeKey = row.original.type?.toLowerCase() || 'residential'
          const propertyTypeConfig = propertyTypeObj[typeKey] || {
            icon: 'ri-building-line',
            color: 'secondary' as ThemeColor
          }

          
return (
            <div className='flex items-center gap-3'>
              <CustomAvatar skin='light' color={propertyTypeConfig.color} size={30}>
                <i className={classnames(propertyTypeConfig.icon, 'text-lg')} />
              </CustomAvatar>
              <Typography color='text.primary' className='capitalize'>{row.original.type}</Typography>
            </div>
          )
        }
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => {
          const statusColors: Record<string, ThemeColor> = {
            active: 'success',
            inactive: 'secondary',
            maintenance: 'warning'
          }

          return (
            <Typography 
              variant='body2' 
              className='capitalize'
              color={`${statusColors[row.original.status] || 'secondary'}.main`}
            >
              {row.original.status}
            </Typography>
          )
        }
      }),
      columnHelper.accessor('address', {
        header: 'ADDRESS',
        cell: ({ row }) => (
          <Typography>
            {row.original.gps_code || row.original.address?.street || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('total_units', {
        header: 'UNITS',
        cell: ({ row }) => (
          <Typography>
            {row.original.occupied_units}/{row.original.total_units}
          </Typography>
        )
      }),
      columnHelper.accessor('bedrooms', {
        header: 'BEDROOM',
        cell: ({ row }) => <Typography>{row.original.bedrooms || '-'}</Typography>
      }),
      columnHelper.accessor('bathrooms', {
        header: 'BATHROOM',
        cell: ({ row }) => <Typography>{row.original.bathrooms || '-'}</Typography>
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
                href: `/properties/${row.original.id}`
              },
              {
                text: 'Edit',
                icon: 'ri-pencil-line',
                menuItemProps: {
                  onClick: () => {
                    setSelectedProperty(row.original)
                    setEditPropertyOpen(true)
                  }
                }
              },
              {
                text: 'Delete',
                icon: 'ri-delete-bin-line',
                menuItemProps: {
                  onClick: () => {
                    setSelectedProperty(row.original)
                    setDeletePropertyOpen(true)
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
        title='Properties Overview'
        description='Manage and view all your properties in one place'
        icon='ri-building-line'
      />
      <PropertiesStatsCard
        allProperties={stats.total}
        occupiedUnits={stats.occupiedUnits}
        vacantUnits={stats.totalUnits - stats.occupiedUnits}
        damagedUnits={stats.maintenance}
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Properties List'
          action={
            <div className='flex items-center gap-2'>
              <Button 
                size='small' 
                startIcon={<i className='ri-refresh-line' />}
                onClick={() => {
                  fetchProperties()
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
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 items-center gap-2'>
              <TextField
                select
                size='small'
                label='Property Type'
                value={propertyType}
                onChange={e => {
                  setPropertyType(e.target.value)
                  setPage(0)
                }}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value=''>All Types</MenuItem>
                <MenuItem value='house'>House</MenuItem>
                <MenuItem value='apartment'>Apartment</MenuItem>
                <MenuItem value='residential'>Residential</MenuItem>
                <MenuItem value='commercial'>Commercial</MenuItem>
                <MenuItem value='mixed'>Mixed</MenuItem>
              </TextField>
              <TextField
                select
                size='small'
                label='Status'
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value)
                  setPage(0)
                }}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value=''>All Status</MenuItem>
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
                <MenuItem value='maintenance'>Maintenance</MenuItem>
              </TextField>
              <TextField
                select
                size='small'
                label='Bedroom'
                value={bedroom}
                onChange={e => setBedroom(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='1'>1</MenuItem>
                <MenuItem value='2'>2</MenuItem>
                <MenuItem value='3'>3</MenuItem>
                <MenuItem value='4'>4</MenuItem>
                <MenuItem value='5'>5+</MenuItem>
              </TextField>
              <TextField
                select
                size='small'
                label='Bathroom'
                value={bathroom}
                onChange={e => setBathroom(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='1'>1</MenuItem>
                <MenuItem value='2'>2</MenuItem>
                <MenuItem value='3'>3</MenuItem>
                <MenuItem value='4'>4</MenuItem>
                <MenuItem value='5'>5+</MenuItem>
              </TextField>
            </div>
            <Divider />

            <div className='flex items-center justify-between gap-2'>
              <div>
                <TextField
                  size='small'
                  placeholder='Search properties...'
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
                  onClick={() => setAddPropertyOpen(true)}
                >
                  Add Property
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
                {filteredData.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                        No properties found
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
      <AddPropertyDialog
        open={addPropertyOpen}
        handleClose={() => {
          setAddPropertyOpen(false)
          fetchProperties()
          fetchStats()
        }}
        propertyData={data}
        setData={setData}
        mode='add'
      />
      <AddPropertyDialog
        open={editPropertyOpen}
        handleClose={() => {
          setEditPropertyOpen(false)
          setSelectedProperty(null)
          fetchProperties()
          fetchStats()
        }}
        propertyData={data}
        setData={setData}
        mode='edit'
        editData={
          selectedProperty
            ? {
                id: selectedProperty.id,
                name: selectedProperty.name,
                type: selectedProperty.type,
                region: selectedProperty.region || '',
                district: selectedProperty.district || '',
                city: selectedProperty.address?.city || '',
                gpsCode: selectedProperty.gps_code || '',
                description: selectedProperty.description || '',
                bedrooms: selectedProperty.bedrooms || 0,
                bathrooms: selectedProperty.bathrooms || 0,
                rooms: selectedProperty.rooms || 0,
                condition: selectedProperty.condition || '',
                amenities: selectedProperty.amenities?.reduce((acc, amenity) => {
                  acc[amenity] = true
                  return acc
                }, {} as Record<string, boolean>),
                images: selectedProperty.images || [],
                thumbnailIndex: selectedProperty.thumbnail_index
              }
            : null
        }
      />
      <ConfirmationDialog
        open={deletePropertyOpen}
        setOpen={setDeletePropertyOpen}
        type='delete-property'
        onConfirm={handleDelete}
      />
    </>
  )
}

export default PropertiesListTable
