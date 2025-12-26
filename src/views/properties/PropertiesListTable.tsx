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
import Switch from '@mui/material/Switch'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import TablePagination from '@mui/material/TablePagination'
import Checkbox from '@mui/material/Checkbox'
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

// Type Imports
import type { ThemeColor } from '@core/types'

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

type Property = {
  id: number
  name: string
  location: string
  image?: string
  type: string
  stock: boolean
  address: string
  price: string
  bedroom: number
  bathroom: number
  facilities: string[]
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
  House: { icon: 'ri-home-line', color: 'primary' },
  Apartment: { icon: 'ri-building-line', color: 'info' }
}

// Sample data
const sampleProperties: Property[] = [
  {
    id: 1,
    name: 'Xorla House',
    location: 'Adenta',
    type: 'House',
    stock: true,
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    address: 'GD-081-0392',
    price: '₵92500',
    bedroom: 4,
    bathroom: 3,
    facilities: ['wifi', 'bed', 'light']
  },
  {
    id: 2,
    name: 'Xorla House',
    location: 'Adenta',
    type: 'House',
    stock: true,
    address: 'GD-081-0392',
    price: '₵1500',
    image:
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=2148&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',

    bedroom: 4,
    bathroom: 3,
    facilities: ['wifi', 'bed', 'light']
  },
  {
    id: 3,
    name: 'Xorla House',
    location: 'Adenta',
    type: 'House',
    stock: true,

    address: 'GD-081-0392',
    price: '₵67500',
    bedroom: 4,
    image:
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    bathroom: 3,
    facilities: ['wifi', 'bed', 'light']
  },
  {
    id: 4,
    name: 'Xorla House',
    location: 'Adenta',
    type: 'House',
    stock: true,
    address: 'GD-081-0392',
    price: '₵45900',
    bedroom: 4,
    image:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    bathroom: 3,
    facilities: ['wifi', 'bed', 'light']
  },
  {
    id: 5,
    name: 'Xorla House',
    location: 'Adenta',
    type: 'Apartment',
    stock: true,
    image:
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1760&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    address: 'GD-081-0392',
    price: '₵12500',
    bedroom: 4,
    bathroom: 3,
    facilities: ['wifi', 'bed', 'light']
  }
]

const columnHelper = createColumnHelper<PropertyWithAction>()

const PropertiesListTable = () => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(sampleProperties)
  const [globalFilter, setGlobalFilter] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [facilities, setFacilities] = useState('')
  const [stock, setStock] = useState('')
  const [bedroom, setBedroom] = useState('')
  const [bathroom, setBathroom] = useState('')
  const [addPropertyOpen, setAddPropertyOpen] = useState(false)
  const [editPropertyOpen, setEditPropertyOpen] = useState(false)
  const [deletePropertyOpen, setDeletePropertyOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  // Calculate stats
  const stats = useMemo(() => {
    return {
      allProperties: data.length,
      occupiedUnits: data.filter(p => p.stock).length,
      vacantUnits: data.filter(p => !p.stock).length,
      damagedUnits: 0
    }
  }, [data])

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = data

    if (propertyType) {
      filtered = filtered.filter(p => p.type === propertyType)
    }

    if (stock !== '') {
      filtered = filtered.filter(p => p.stock === (stock === 'true'))
    }

    if (bedroom) {
      filtered = filtered.filter(p => p.bedroom === Number(bedroom))
    }

    if (bathroom) {
      filtered = filtered.filter(p => p.bathroom === Number(bathroom))
    }

    return filtered
  }, [data, propertyType, stock, bedroom, bathroom])

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
            <Avatar variant='rounded' sx={{ width: 30, height: 30 }} src={row.original.image} />
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.name}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {row.original.location}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('type', {
        header: 'PROPERTY TYPE',
        cell: ({ row }) => {
          const propertyType = propertyTypeObj[row.original.type] || {
            icon: 'ri-building-line',
            color: 'secondary' as ThemeColor
          }

          
return (
            <div className='flex items-center gap-3'>
              <CustomAvatar skin='light' color={propertyType.color} size={30}>
                <i className={classnames(propertyType.icon, 'text-lg')} />
              </CustomAvatar>
              <Typography color='text.primary'>{row.original.type}</Typography>
            </div>
          )
        }
      }),
      columnHelper.accessor('stock', {
        header: 'STOCK',
        cell: ({ row }) => (
          <Switch
            checked={row.original.stock}
            size='small'
            onChange={e => {
              const updatedData = data.map(property =>
                property.id === row.original.id ? { ...property, stock: e.target.checked } : property
              )

              setData(updatedData)
            }}
          />
        ),
        enableSorting: false
      }),
      columnHelper.accessor('address', {
        header: 'ADDRESS',
        cell: ({ row }) => <Typography>{row.original.address}</Typography>
      }),
      columnHelper.accessor('price', {
        header: 'PRICE',
        cell: ({ row }) => <Typography className='font-medium'>{row.original.price}</Typography>
      }),
      columnHelper.accessor('bedroom', {
        header: 'BEDROOM',
        cell: ({ row }) => <Typography>{row.original.bedroom}</Typography>
      }),
      columnHelper.accessor('bathroom', {
        header: 'BATHROOM',
        cell: ({ row }) => <Typography>{row.original.bathroom}</Typography>
      }),
      columnHelper.accessor('facilities', {
        header: 'FACILITIES',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            {row.original.facilities.map((facility, idx) => (
              <i
                key={idx}
                className={`ri-${facility === 'wifi' ? 'wifi' : facility === 'bed' ? 'bed' : 'lightbulb'}-line`}
              />
            ))}
          </div>
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
        title='Properties Overview'
        description='Manage and view all your properties in one place'
        icon='ri-building-line'
      />
      <PropertiesStatsCard
        allProperties={stats.allProperties}
        occupiedUnits={stats.occupiedUnits}
        vacantUnits={stats.vacantUnits}
        damagedUnits={stats.damagedUnits}
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Properties List'
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
                label='Select Property Type'
                value={propertyType}
                onChange={e => setPropertyType(e.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value=''>All Types</MenuItem>
                <MenuItem value='House'>House</MenuItem>
                <MenuItem value='Apartment'>Apartment</MenuItem>
              </TextField>
              <TextField
                select
                size='small'
                label='Facilities'
                value={facilities}
                onChange={e => setFacilities(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value=''>All Facilities</MenuItem>
                <MenuItem value='wifi'>WiFi</MenuItem>
                <MenuItem value='bed'>Bed</MenuItem>
                <MenuItem value='light'>Light</MenuItem>
              </TextField>
              <TextField
                select
                size='small'
                label='Stock'
                value={stock}
                onChange={e => setStock(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='true'>In Stock</MenuItem>
                <MenuItem value='false'>Out of Stock</MenuItem>
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
                  onClick={() => setAddPropertyOpen(true)}
                >
                  Add Property
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
      <AddPropertyDialog
        open={addPropertyOpen}
        handleClose={() => setAddPropertyOpen(false)}
        propertyData={data}
        setData={setData}
        mode='add'
      />
      <AddPropertyDialog
        open={editPropertyOpen}
        handleClose={() => {
          setEditPropertyOpen(false)
          setSelectedProperty(null)
        }}
        propertyData={data}
        setData={setData}
        mode='edit'
        editData={
          selectedProperty
            ? {
                id: selectedProperty.id.toString(),
                name: selectedProperty.name,
                type: selectedProperty.type,
                address: selectedProperty.address,
                price: selectedProperty.price,
                bedrooms: selectedProperty.bedroom,
                bathrooms: selectedProperty.bathroom
              }
            : null
        }
      />
      <ConfirmationDialog
        open={deletePropertyOpen}
        setOpen={setDeletePropertyOpen}
        type='delete-property'
        onConfirm={() => {
          if (selectedProperty) {
            setData(data.filter(property => property.id !== selectedProperty.id))
            setSelectedProperty(null)
          }
        }}
      />
    </>
  )
}

export default PropertiesListTable
