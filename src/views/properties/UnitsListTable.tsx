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
import Chip from '@mui/material/Chip'
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
import type { Unit } from '@/types/property'

// API Imports
import { getAvailableUnits, deleteUnit } from '@/lib/api/units'
import { getProperties } from '@/lib/api/properties'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import PageBanner from '@components/banner/PageBanner'
import UnitsStatsCard from './UnitsStatsCard'
import CustomAvatar from '@core/components/mui/Avatar'
import AddUnitDialog from './AddUnitDialog'
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

type UnitWithExtras = Unit & {
  propertyName: string
  formattedRent: string
  formattedSize: string
}

interface PropertyOption {
  id: string
  name: string
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })
  
return itemRank.passed
}

// Vars
const unitStatusObj: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  occupied: 'success',
  available: 'warning',
  maintenance: 'error',
  reserved: 'info'
}

const columnHelper = createColumnHelper<UnitWithExtras>()

const UnitsListTable = () => {
  // States
  const [data, setData] = useState<UnitWithExtras[]>([])
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [status, setStatus] = useState('')
  const [property, setProperty] = useState('')
  const [bedroom, setBedroom] = useState('')
  const [bathroom, setBathroom] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [addUnitOpen, setAddUnitOpen] = useState(false)
  const [editUnitOpen, setEditUnitOpen] = useState(false)
  const [deleteUnitOpen, setDeleteUnitOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<UnitWithExtras | null>(null)

  // Fetch available units
  const fetchUnits = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getAvailableUnits({
        page: page + 1,
        pageSize,
        propertyId: property || undefined,
      })

      // Handle response with defensive checks
      const responseData = response?.data || []
      
      // Transform data for display
      const transformedData: UnitWithExtras[] = responseData.map(unit => ({
        ...unit,
        propertyName: unit.property?.name || 'Unknown Property',
        formattedRent: `₵${unit.rent.toLocaleString()}`,
        formattedSize: unit.size_sqft ? `${unit.size_sqft.toLocaleString()} sqft` : '-'
      }))

      setData(transformedData)
      setTotal(response?.pagination?.total || 0)
    } catch (err) {
      console.error('Failed to load units:', err)
      setError(err instanceof Error ? err.message : 'Failed to load units')
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, property])

  // Fetch properties for filter
  const fetchProperties = useCallback(async () => {
    try {
      const response = await getProperties({ pageSize: 100 })
      const responseData = response?.data || []
      setProperties(responseData.map(p => ({ id: p.id, name: p.name })))
    } catch (err) {
      console.error('Failed to fetch properties:', err)
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    fetchUnits()
  }, [fetchUnits])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  // Handle delete
  const handleDelete = async () => {
    if (!selectedUnit) return

    try {
      await deleteUnit(selectedUnit.id)
      await fetchUnits()
      setSelectedUnit(null)
      setDeleteUnitOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete unit')
    }
  }

  // Calculate stats
  const stats = useMemo(() => {
    return {
      allUnits: total,
      occupiedUnits: data.filter(u => u.status === 'occupied').length,
      vacantUnits: data.filter(u => u.status === 'available').length,
      maintenanceUnits: data.filter(u => u.status === 'maintenance').length
    }
  }, [data, total])

  // Filter data locally for bedrooms/bathrooms
  const filteredData = useMemo(() => {
    let filtered = data

    if (status) {
      filtered = filtered.filter(u => u.status === status)
    }

    if (bedroom) {
      filtered = filtered.filter(u => u.bedrooms === Number(bedroom))
    }

    if (bathroom) {
      filtered = filtered.filter(u => u.bathrooms === Number(bathroom))
    }

    return filtered
  }, [data, status, bedroom, bathroom])

  const columns = useMemo<ColumnDef<UnitWithExtras, any>[]>(
    () => [
      columnHelper.accessor('unit_no', {
        header: 'UNIT NUMBER',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.unit_no}
          </Typography>
        )
      }),
      columnHelper.accessor('propertyName', {
        header: 'PROPERTY',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.propertyName}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={row.original.status === 'available' ? 'vacant' : row.original.status}
            size='small'
            color={unitStatusObj[row.original.status] || 'secondary'}
            className='capitalize'
          />
        )
      }),
      columnHelper.accessor('formattedRent', {
        header: 'RENT',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.formattedRent}
          </Typography>
        )
      }),
      columnHelper.accessor('bedrooms', {
        header: 'BEDROOMS',
        cell: ({ row }) => <Typography>{row.original.bedrooms || '-'}</Typography>
      }),
      columnHelper.accessor('bathrooms', {
        header: 'BATHROOMS',
        cell: ({ row }) => <Typography>{row.original.bathrooms || '-'}</Typography>
      }),
      columnHelper.accessor('formattedSize', {
        header: 'SIZE',
        cell: ({ row }) => <Typography color='text.secondary'>{row.original.formattedSize}</Typography>
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
                href: `/properties/units/${row.original.id}`
              },
              {
                text: 'Edit',
                icon: 'ri-pencil-line',
                menuItemProps: {
                  onClick: () => {
                    setSelectedUnit(row.original)
                    setEditUnitOpen(true)
                  }
                }
              },
              {
                text: 'Delete',
                icon: 'ri-delete-bin-line',
                menuItemProps: {
                  onClick: () => {
                    setSelectedUnit(row.original)
                    setDeleteUnitOpen(true)
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
      globalFilter
    },
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <PageBanner
        title='Units Overview'
        description='Manage and view all units across your properties'
        icon='ri-home-line'
      />
      <UnitsStatsCard
        allUnits={stats.allUnits}
        occupiedUnits={stats.occupiedUnits}
        vacantUnits={stats.vacantUnits}
        maintenanceUnits={stats.maintenanceUnits}
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Units List'
          action={
            <div className='flex items-center gap-2'>
              <Button 
                size='small' 
                startIcon={<i className='ri-refresh-line' />}
                onClick={() => fetchUnits()}
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
                label='Select Property'
                value={property}
                onChange={e => {
                  setProperty(e.target.value)
                  setPage(0)
                }}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value=''>All Properties</MenuItem>
                {properties.map(prop => (
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
                onChange={e => setStatus(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value=''>All Status</MenuItem>
                <MenuItem value='occupied'>Occupied</MenuItem>
                <MenuItem value='available'>Vacant</MenuItem>
                <MenuItem value='maintenance'>Maintenance</MenuItem>
                <MenuItem value='reserved'>Reserved</MenuItem>
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
                  placeholder='Search units...'
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
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
                  onClick={() => setAddUnitOpen(true)}
                >
                  Add Unit
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
                        No units found
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody>
                    {table.getRowModel().rows.map(row => {
                      return (
                        <tr key={row.id}>
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
      <AddUnitDialog
        open={addUnitOpen}
        handleClose={() => {
          setAddUnitOpen(false)
          fetchUnits()
        }}
        properties={properties}
        unitsData={data}
        setData={setData as any}
        mode='add'
      />
      <AddUnitDialog
        open={editUnitOpen}
        handleClose={() => {
          setEditUnitOpen(false)
          setSelectedUnit(null)
          fetchUnits()
        }}
        properties={properties}
        unitsData={data}
        setData={setData as any}
        mode='edit'
        editData={
          selectedUnit
            ? {
                id: selectedUnit.id,
                unitNumber: selectedUnit.unit_no,
                propertyId: selectedUnit.property_id,
                propertyName: selectedUnit.propertyName,
                status: selectedUnit.status === 'available' 
                  ? 'vacant' 
                  : selectedUnit.status === 'reserved' 
                    ? 'vacant' 
                    : selectedUnit.status as 'occupied' | 'maintenance' | 'vacant',
                rent: selectedUnit.formattedRent,
                bedrooms: selectedUnit.bedrooms || 0,
                bathrooms: selectedUnit.bathrooms || 0,
                size: selectedUnit.formattedSize,
                tenantName: null
              }
            : null
        }
      />
      <ConfirmationDialog
        open={deleteUnitOpen}
        setOpen={setDeleteUnitOpen}
        type='delete-unit'
        onConfirm={handleDelete}
      />
    </>
  )
}

export default UnitsListTable
