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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

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
import AddUnitDialog from './AddUnitDialog'

// API Imports
import { getPropertyUnits, deleteUnit, type PropertyUnit } from '@/lib/api/properties'

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
  status: 'occupied' | 'vacant' | 'maintenance'
  rent: string
  bedrooms: number
  bathrooms: number
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
  return units.map((unit) => ({
    id: unit.id,
    unitNumber: unit.unit_no,
    tenantName: unit.tenant_record
      ? `${unit.tenant_record.first_name} ${unit.tenant_record.last_name}`
      : null,
    status: unit.status === 'available' ? 'vacant' : (unit.status as 'occupied' | 'vacant' | 'maintenance'),
    rent: `₵${unit.rent?.toLocaleString() || '0'}`,
    bedrooms: unit.bedrooms || 0,
    bathrooms: unit.bathrooms || 0,
    size: unit.size_sqft ? `${unit.size_sqft.toLocaleString()} sqft` : '-',
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

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editUnit, setEditUnit] = useState<PropertyUnit | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<UnitType | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch units
  const fetchUnits = useCallback(async () => {
    if (!propertyId) {
      setLoading(false)
      setError('No property ID provided')
      
return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await getPropertyUnits(propertyId)

      if (response.success && response.data) {
        setData(transformUnits(response.data))
      } else {
        setError('Failed to load units')
      }
    } catch (err) {
      console.error('Error fetching units:', err)
      setError(err instanceof Error ? err.message : 'Failed to load units')
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchUnits()
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

    setDeleting(true)

    try {
      await deleteUnit(unitToDelete.id)
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
          <Typography color="text.primary" className="font-medium">
            {row.original.unitNumber}
          </Typography>
        )
      }),
      columnHelper.accessor('tenantName', {
        header: 'TENANT',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.tenantName ? (
              <>
                <CustomAvatar skin="light" color="primary" size={34}>
                  {row.original.tenantName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </CustomAvatar>
                <Typography color="text.primary" className="font-medium">
                  {row.original.tenantName}
                </Typography>
              </>
            ) : (
              <Typography color="text.secondary">-</Typography>
            )}
          </div>
        )
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => (
          <Chip
            variant="tonal"
            label={row.original.status}
            size="small"
            color={unitStatusObj[row.original.status] || 'default'}
            className="capitalize"
          />
        )
      }),
      columnHelper.accessor('rent', {
        header: 'RENT',
        cell: ({ row }) => (
          <Typography color="text.primary" className="font-medium">
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
        cell: ({ row }) => <Typography color="text.secondary">{row.original.size}</Typography>
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
    initialState: { pagination: { pageSize: 10 } },
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
    <>
      <Card>
        <CardHeader
          title="Property Units"
          action={
            <Button
              variant="contained"
              size="small"
              startIcon={<i className="ri-add-line" />}
              onClick={() => setAddDialogOpen(true)}
            >
              Add Unit
            </Button>
          }
        />
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <Typography color="error">{error}</Typography>
            </Box>
          ) : (
            <div className="overflow-x-auto">
              <table className={tableStyles.table}>
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
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
                                asc: <i className="ri-arrow-up-s-line text-xl" />,
                                desc: <i className="ri-arrow-down-s-line text-xl" />
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
                      <td colSpan={table.getVisibleFlatColumns().length} className="text-center">
                        No units available
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody className="border-be">
                    {table
                      .getRowModel()
                      .rows.slice(0, table.getState().pagination.pageSize)
                      .map((row) => (
                        <tr key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="first:is-14">
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
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Unit</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {unitToDelete?.unitNumber}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : null}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default PropertyUnitsTable
