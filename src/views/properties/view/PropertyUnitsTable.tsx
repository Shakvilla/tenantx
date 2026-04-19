'use client'

// React Imports
import { useState, useMemo, useEffect, useCallback } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import TablePagination from '@mui/material/TablePagination'

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

// Component Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'
import AddUnitDialog from './AddUnitDialog'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'

// API Imports
import { getUnitsByProperty as getPropertyUnits, deleteUnit } from '@/lib/api/units'
import { getStoredTenantId } from '@/lib/api/storage'
import type { Unit as PropertyUnit } from '@/types/property'
import { formatCurrency } from '@/utils/currency'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

type UnitType = {
  id: string
  unitNumber: string
  tenantName: string | null
  type: string
  status: 'occupied' | 'vacant' | 'maintenance' | string
  rent: number
  formattedRent: string
  bedrooms: number | string
  bathrooms: number | string
  size: string
  originalData: PropertyUnit
}

const unitStatusObj: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  occupied: 'success',
  available: 'warning',
  vacant: 'warning',
  maintenance: 'error',
  reserved: 'info'
}

function transformUnits(units: PropertyUnit[]): UnitType[] {
  return units.map(unit => ({
    id: unit.id,
    unitNumber: unit.unitNo,
    type: unit.type,
    status: unit.status,
    bedrooms: unit.bedrooms || '-',
    bathrooms: unit.bathrooms || '-',
    rent: unit.rent,
    formattedRent: formatCurrency(unit.rent),
    size: unit.sizeSqft ? `${unit.sizeSqft.toLocaleString()} sqft` : '-',
    tenantName: unit.tenantRecordId ? 'Has Tenant' : 'Vacant',
    originalData: unit
  }))
}

const columnHelper = createColumnHelper<UnitType>()

interface Props {
  propertyId?: string
}

const PropertyUnitsTable = ({ propertyId }: Props) => {
  // States
  const [data, setData] = useState<UnitType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')

  // Pagination states
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [cursorHistory, setCursorHistory] = useState<string[]>([])

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editUnit, setEditUnit] = useState<PropertyUnit | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<UnitType | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch units
  const fetchUnits = useCallback(
    async (cursorOverride?: string | null) => {
      if (!propertyId) {
        setLoading(false)
        setError('No property ID provided')

        return
      }

      try {
        const tenantId = getStoredTenantId()

        if (!tenantId) return

        setLoading(true)
        setError(null)

        const response = await getPropertyUnits(tenantId, propertyId, {
          size: pageSize,
          sort: 'id,asc',
          cursor: cursorOverride ?? undefined
        })

        if (response.success && response.data) {
          setData(transformUnits(response.data))
          setTotal(response.meta?.pagination?.total || response.data.length || 0)
          setCursor(response.meta?.pagination?.cursor ?? null)
          setHasNext(response.meta?.pagination?.hasNext ?? false)
        } else {
          setError('Failed to load units')
        }
      } catch (err) {
        console.error('Error fetching units:', err)
        setError(err instanceof Error ? err.message : 'Failed to load units')
        setData([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    },
    [propertyId, pageSize]
  )

  useEffect(() => {
    setCursor(null)
    setCursorHistory([])
    setPage(0)
    fetchUnits(null)
  }, [fetchUnits])

  // Handle add success
  const handleAddSuccess = () => {
    fetchUnits()
  }

  // Handle edit
  const handleEdit = (unit: UnitType) => {
    setEditUnit(unit.originalData)
    setAddDialogOpen(true)
  }

  // Handle delete click
  const handleDeleteClick = (unit: UnitType) => {
    setUnitToDelete(unit)
    setDeleteDialogOpen(true)
  }

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!unitToDelete) return

    const tenantId = getStoredTenantId()

    if (!tenantId) return

    setDeleting(true)

    try {
      await deleteUnit(tenantId, unitToDelete.id)
      setDeleteDialogOpen(false)
      setUnitToDelete(null)
      fetchUnits()
    } catch (err) {
      console.error('Error deleting unit:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete unit')
    } finally {
      setDeleting(false)
    }
  }

  // Close dialogs
  const handleDialogClose = () => {
    setAddDialogOpen(false)
    setEditUnit(null)
  }

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
            color={unitStatusObj[row.original.status] || 'default'}
            className='capitalize'
          />
        )
      }),
      columnHelper.accessor('rent', {
        header: 'RENT',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.formattedRent}
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
                text: 'Edit',
                icon: 'ri-pencil-line',
                menuItemProps: { onClick: () => handleEdit(row.original) }
              },
              {
                text: 'Delete',
                icon: 'ri-delete-bin-line',
                menuItemProps: {
                  onClick: () => handleDeleteClick(row.original),
                  sx: { color: 'error.main' }
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
    data: data as UnitType[],
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
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
      <Card>
        <CardHeader
          title='Property Units'
          action={
            <Button
              variant='contained'
              size='small'
              startIcon={<i className='ri-add-line' />}
              onClick={() => setAddDialogOpen(true)}
            >
              Add Unit
            </Button>
          }
        />
        <CardContent>
          {loading ? (
            <Box display='flex' justifyContent='center' alignItems='center' minHeight={200}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box display='flex' justifyContent='center' alignItems='center' minHeight={200}>
              <Typography color='error'>{error}</Typography>
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
                        No units available
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody className='border-be'>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className='first:is-14'>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          )}
          {!loading && !error && (
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component='div'
              className='border-bs'
              count={hasNext ? (page + 2) * pageSize : (page + 1) * pageSize}
              rowsPerPage={pageSize}
              page={page}
              SelectProps={{
                inputProps: { 'aria-label': 'rows per page' }
              }}
              onPageChange={(_, newPage) => {
                if (newPage > page && hasNext && cursor) {
                  // Going forward
                  setCursorHistory(prev => [...prev, cursor])
                  fetchUnits(cursor)
                  setPage(newPage)
                } else if (newPage < page) {
                  // Going backward
                  const newHistory = [...cursorHistory]
                  const prevCursor = newHistory.pop() ?? null

                  setCursorHistory(newHistory)
                  fetchUnits(prevCursor === cursorHistory[0] ? null : prevCursor)
                  setPage(newPage)
                }
              }}
              onRowsPerPageChange={e => {
                setPageSize(Number(e.target.value))
                setPage(0)
                setCursor(null)
                setCursorHistory([])
                fetchUnits(null)
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Unit Dialog */}
      {propertyId && (
        <AddUnitDialog
          open={addDialogOpen}
          onClose={handleDialogClose}
          propertyId={propertyId}
          editUnit={editUnit}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        type='delete-unit'
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}

export default PropertyUnitsTable
