'use client'

// React Imports
import { useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

type UnitType = {
  id: string
  unitNumber: string
  tenantName: string | null
  status: 'occupied' | 'vacant' | 'maintenance'
  rent: string
  bedrooms: number
  bathrooms: number
  size: string
}

const sampleUnits: UnitType[] = [
  {
    id: '1',
    unitNumber: 'Unit 101',
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
    tenantName: null,
    status: 'maintenance',
    rent: '₵1,400',
    bedrooms: 2,
    bathrooms: 1,
    size: '950 sqft'
  }
]

const unitStatusObj: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  occupied: 'success',
  vacant: 'warning',
  maintenance: 'error'
}

// Column Definitions
const columnHelper = createColumnHelper<UnitType>()

const PropertyUnitsTable = ({ unitsData }: { unitsData?: UnitType[] }) => {
  // States
  const [data] = useState(unitsData || sampleUnits)
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<UnitType, any>[]>(
    () => [
      columnHelper.accessor('unitNumber', {
        header: 'UNIT NUMBER',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.unitNumber}
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
              { text: 'View', icon: 'ri-eye-line' },
              { text: 'Edit', icon: 'ri-pencil-line' },
              { text: 'Delete', icon: 'ri-delete-bin-line' }
            ]}
          />
        )
      })
    ],
    []
  )

  const table = useReactTable({
    data: data as UnitType[],
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
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  return (
    <Card>
      <CardHeader
        title='Property Units'
        action={
          <Button variant='contained' size='small' startIcon={<i className='ri-add-line' />}>
            Add Unit
          </Button>
        }
      />
      <CardContent>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <>
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
                        </>
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
                    No units available
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className='border-be'>
                {table
                  .getRowModel()
                  .rows.slice(0, table.getState().pagination.pageSize)
                  .map(row => {
                    return (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className='first:is-14'>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
              </tbody>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default PropertyUnitsTable

