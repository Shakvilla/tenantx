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
import Chip from '@mui/material/Chip'

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

type Unit = {
  id: string
  unitNumber: string
  propertyName: string
  propertyId: string
  tenantName: string | null
  status: 'occupied' | 'vacant' | 'maintenance'
  rent: string
  bedrooms: number
  bathrooms: number
  size: string
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })
  
return itemRank.passed
}

// Vars
const unitStatusObj: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  occupied: 'success',
  vacant: 'warning',
  maintenance: 'error'
}

// Sample data
const sampleUnits: Unit[] = [
  {
    id: '1',
    unitNumber: 'Unit 101',
    propertyName: 'Xorla House',
    propertyId: '1',
    tenantName: 'John Doe',
    status: 'occupied',
    rent: '₵1,200',
    bedrooms: 2,
    bathrooms: 1,
    size: '850 sqft'
  },
  {
    id: '2',
    unitNumber: 'Unit 102',
    propertyName: 'Xorla House',
    propertyId: '1',
    tenantName: 'Jane Smith',
    status: 'occupied',
    rent: '₵1,500',
    bedrooms: 3,
    bathrooms: 2,
    size: '1,200 sqft'
  },
  {
    id: '3',
    unitNumber: 'Unit 201',
    propertyName: 'Xorla House',
    propertyId: '1',
    tenantName: null,
    status: 'vacant',
    rent: '₵1,300',
    bedrooms: 2,
    bathrooms: 1,
    size: '900 sqft'
  },
  {
    id: '4',
    unitNumber: 'Unit 202',
    propertyName: 'Xorla House',
    propertyId: '1',
    tenantName: 'Mike Johnson',
    status: 'occupied',
    rent: '₵1,800',
    bedrooms: 3,
    bathrooms: 2,
    size: '1,350 sqft'
  },
  {
    id: '5',
    unitNumber: 'Unit 301',
    propertyName: 'Xorla House',
    propertyId: '1',
    tenantName: null,
    status: 'maintenance',
    rent: '₵1,400',
    bedrooms: 2,
    bathrooms: 1,
    size: '950 sqft'
  },
  {
    id: '6',
    unitNumber: 'Unit 401',
    propertyName: 'Sunset Apartments',
    propertyId: '2',
    tenantName: 'Sarah Williams',
    status: 'occupied',
    rent: '₵2,000',
    bedrooms: 4,
    bathrooms: 3,
    size: '1,500 sqft'
  },
  {
    id: '7',
    unitNumber: 'Unit 402',
    propertyName: 'Sunset Apartments',
    propertyId: '2',
    tenantName: null,
    status: 'vacant',
    rent: '₵1,900',
    bedrooms: 3,
    bathrooms: 2,
    size: '1,300 sqft'
  }
]

const columnHelper = createColumnHelper<Unit>()

// Sample properties for unit assignment
const sampleProperties = [
  { id: 1, name: 'Xorla House' },
  { id: 2, name: 'Sunset Apartments' },
  { id: 3, name: 'Green Valley' },
  { id: 4, name: 'Ocean View' },
  { id: 5, name: 'Mountain Heights' }
]

const UnitsListTable = () => {
  // States
  const [data, setData] = useState(sampleUnits)
  const [globalFilter, setGlobalFilter] = useState('')
  const [status, setStatus] = useState('')
  const [property, setProperty] = useState('')
  const [bedroom, setBedroom] = useState('')
  const [bathroom, setBathroom] = useState('')
  const [addUnitOpen, setAddUnitOpen] = useState(false)
  const [editUnitOpen, setEditUnitOpen] = useState(false)
  const [deleteUnitOpen, setDeleteUnitOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

  // Calculate stats
  const stats = useMemo(() => {
    return {
      allUnits: data.length,
      occupiedUnits: data.filter(u => u.status === 'occupied').length,
      vacantUnits: data.filter(u => u.status === 'vacant').length,
      maintenanceUnits: data.filter(u => u.status === 'maintenance').length
    }
  }, [data])

  // Get unique properties for filter
  const uniqueProperties = useMemo(() => {
    const properties = Array.from(new Set(data.map(u => u.propertyName)))

    
return properties
  }, [data])

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = data

    if (status) {
      filtered = filtered.filter(u => u.status === status)
    }

    if (property) {
      filtered = filtered.filter(u => u.propertyName === property)
    }

    if (bedroom) {
      filtered = filtered.filter(u => u.bedrooms === Number(bedroom))
    }

    if (bathroom) {
      filtered = filtered.filter(u => u.bathrooms === Number(bathroom))
    }

    return filtered
  }, [data, status, property, bedroom, bathroom])

  const columns = useMemo<ColumnDef<Unit, any>[]>(
    () => [
      columnHelper.accessor('unitNumber', {
        header: 'UNIT NUMBER',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.unitNumber}
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
      columnHelper.accessor('tenantName', {
        header: 'TENANT',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            {row.original.tenantName ? (
              <>
                <CustomAvatar skin='light' color='primary' size={34}>
                  {row.original.tenantName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </CustomAvatar>
                <Typography color='text.primary' className='font-medium'>
                  {row.original.tenantName}
                </Typography>
              </>
            ) : (
              <Typography color='text.secondary'>-</Typography>
            )}
          </div>
        )
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={row.original.status}
            size='small'
            color={unitStatusObj[row.original.status]}
            className='capitalize'
          />
        )
      }),
      columnHelper.accessor('rent', {
        header: 'RENT',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.rent}
          </Typography>
        )
      }),
      columnHelper.accessor('bedrooms', {
        header: 'BEDROOMS',
        cell: ({ row }) => <Typography>{row.original.bedrooms}</Typography>
      }),
      columnHelper.accessor('bathrooms', {
        header: 'BATHROOMS',
        cell: ({ row }) => <Typography>{row.original.bathrooms}</Typography>
      }),
      columnHelper.accessor('size', {
        header: 'SIZE',
        cell: ({ row }) => <Typography color='text.secondary'>{row.original.size}</Typography>
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
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
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
              <OptionMenu options={['Refresh', 'Share']} />
            </div>
          }
        />
        <CardContent className='flex flex-col gap-4'>
          {/* Filters Section */}
          <Box className='flex flex-col gap-4 p-4  rounded-lg'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 items-center gap-2 '>
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
                label='Status'
                value={status}
                onChange={e => setStatus(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value=''>All Status</MenuItem>
                <MenuItem value='occupied'>Occupied</MenuItem>
                <MenuItem value='vacant'>Vacant</MenuItem>
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
                <MenuItem value='5+'>5+</MenuItem>
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
                <MenuItem value='5+'>5+</MenuItem>
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
                  onClick={() => setAddUnitOpen(true)}
                >
                  Add Unit
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
      <AddUnitDialog
        open={addUnitOpen}
        handleClose={() => setAddUnitOpen(false)}
        properties={sampleProperties}
        unitsData={data}
        setData={setData}
        mode='add'
      />
      <AddUnitDialog
        open={editUnitOpen}
        handleClose={() => {
          setEditUnitOpen(false)
          setSelectedUnit(null)
        }}
        properties={sampleProperties}
        unitsData={data}
        setData={setData}
        mode='edit'
        editData={
          selectedUnit
            ? {
                id: selectedUnit.id,
                unitNumber: selectedUnit.unitNumber,
                propertyId: selectedUnit.propertyId,
                propertyName: selectedUnit.propertyName,
                status: selectedUnit.status,
                rent: selectedUnit.rent,
                bedrooms: selectedUnit.bedrooms,
                bathrooms: selectedUnit.bathrooms,
                size: selectedUnit.size,
                tenantName: selectedUnit.tenantName
              }
            : null
        }
      />
      <ConfirmationDialog
        open={deleteUnitOpen}
        setOpen={setDeleteUnitOpen}
        type='delete-unit'
        onConfirm={() => {
          if (selectedUnit) {
            setData(data.filter(unit => unit.id !== selectedUnit.id))
            setSelectedUnit(null)
          }
        }}
      />
    </>
  )
}

export default UnitsListTable
