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
import RowActions from '@components/table/RowActions'
import PageBanner from '@components/banner/PageBanner'
import OccupantsStatsCard from './OccupantsStatsCard'
import CustomAvatar from '@core/components/mui/Avatar'
import AddOccupantDialog from './AddOccupantDialog'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'

// API Imports
import { getOccupants, deleteOccupant, getOccupantStats, type OccupantRecord } from '@/lib/api/occupants'
import { getProperties } from '@/lib/api/properties'
import { getStoredTenantId } from '@/lib/api/storage'

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

type OccupantWithAction = OccupantRecord & { action?: string }
type Property = { id: string; name: string }

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const columnHelper = createColumnHelper<OccupantWithAction>()

const OccupantsListTable = () => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<OccupantRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [status, setStatus] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(0)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [cursorHistory, setCursorHistory] = useState<string[]>([])

  // Dialog states
  const [addOccupantOpen, setAddOccupantOpen] = useState(false)
  const [editOccupantOpen, setEditOccupantOpen] = useState(false)
  const [deleteOccupantOpen, setDeleteOccupantOpen] = useState(false)
  const [selectedOccupant, setSelectedOccupant] = useState<OccupantRecord | null>(null)

  // Properties for filter dropdown + name lookup
  const [properties, setProperties] = useState<Property[]>([])

  // Accurate per-status counts fetched independently (no backend stats endpoint)
  const [statusStats, setStatusStats] = useState({ active: 0, inactive: 0, pending: 0 })

  // Fetch occupants from API
  const fetchOccupants = useCallback(
    async (cursorOverride?: string | null) => {
      try {
        const tenantId = getStoredTenantId()

        if (!tenantId) return

        setLoading(true)
        setError(null)

        const response = await getOccupants(tenantId, {
          size: pageSize,
          sort: 'id,asc',
          search: globalFilter || undefined,
          status: status || undefined,
          propertyId: propertyFilter || undefined,
          cursor: cursorOverride ?? undefined
        })

        setData(response?.data || [])
        setTotal(response?.meta?.pagination?.total || response?.data?.length || 0)
        setCursor(response?.meta?.pagination?.cursor ?? null)
        setHasNext(response?.meta?.pagination?.hasNext ?? false)
      } catch (err) {
        console.error('Failed to load occupants:', err)
        setError(err instanceof Error ? err.message : 'Failed to load occupants')
        setData([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    },
    [pageSize, globalFilter, status, propertyFilter]
  )

  // Fetch properties for filter dropdown
  const fetchProperties = useCallback(async () => {
    try {
      const tenantId = getStoredTenantId()

      if (!tenantId) return

      const response = await getProperties(tenantId, { size: 100 })

      if (response?.data) {
        setProperties(response.data.map(p => ({ id: p.id, name: p.name })))
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err)
    }
  }, [])

  // Fetch accurate global counts from the dedicated stats endpoint
  const fetchStats = useCallback(async () => {
    try {
      const tenantId = getStoredTenantId()

      if (!tenantId) return

      const stats = await getOccupantStats(tenantId)

      setStatusStats({
        active: stats.active,
        inactive: stats.inactive,
        pending: stats.pending
      })
      // Also update total from stats for accuracy when no filter is active
      if (!status && !propertyFilter && !globalFilter) {
        setTotal(stats.total)
      }
    } catch (err) {
      console.error('Failed to fetch occupant stats:', err)
    }
  }, [status, propertyFilter, globalFilter])

  // Load data on mount and when filters change
  useEffect(() => {
    setCursor(null)
    setCursorHistory([])
    setPage(0)
    fetchOccupants(null)
  }, [fetchOccupants])

  useEffect(() => {
    fetchProperties()
    fetchStats()
  }, [fetchProperties, fetchStats])

  // Handle delete
  const handleDelete = async () => {
    if (!selectedOccupant) return

    try {
      const tenantId = getStoredTenantId()

      if (!tenantId) return

      await deleteOccupant(tenantId, selectedOccupant.id)
      setSelectedOccupant(null)
      setDeleteOccupantOpen(false)
      fetchOccupants(null)
      fetchStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete occupant')
    }
  }

  // Handle edit
  const handleEditOccupant = (occupant: OccupantRecord) => {
    setSelectedOccupant(occupant)
    setEditOccupantOpen(true)
  }

  // Property id → name lookup for the table column (backend doesn't join property name)
  const propertyMap = useMemo(
    () => Object.fromEntries(properties.map(p => [p.id, p.name])),
    [properties]
  )

  // Stats use accurate global counts from fetchStats, not page-local data
  const stats = useMemo(
    () => ({ total, ...statusStats }),
    [total, statusStats]
  )

  const columns = useMemo<ColumnDef<OccupantWithAction, any>[]>(
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
      columnHelper.accessor('firstName', {
        header: 'OCCUPANT',
        cell: ({ row }) => {
          const fullName = `${row.original.firstName} ${row.original.lastName}`

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
      columnHelper.accessor('unitNo', {
        header: 'UNIT NO',
        cell: ({ row }) => <Typography>{row.original.unitNo || '-'}</Typography>
      }),
      columnHelper.accessor('property', {
        header: 'PROPERTY',
        cell: ({ row }) => {
          // prefer propertyName from response, then propertyMap lookup, then dash
          const name = row.original.propertyName || row.original.property?.name || propertyMap[row.original.propertyId ?? ''] || '-'

          return <Typography>{name}</Typography>
        }
      }),
      columnHelper.accessor('moveInDate', {
        header: 'MOVE IN',
        cell: ({ row }) => (
          <Typography>
            {row.original.moveInDate ? new Date(row.original.moveInDate).toLocaleDateString() : '-'}
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
              row.original.status === 'active' ? 'success' : row.original.status === 'pending' ? 'warning' : 'default'
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
                text: 'View',
                icon: 'ri-eye-line',
                href: `/occupants/${row.original.id}`
              },
              {
                text: 'Edit',
                icon: 'ri-pencil-line',
                menuItemProps: { onClick: () => handleEditOccupant(row.original) }
              },
              {
                text: 'Delete',
                icon: 'ri-delete-bin-line',
                menuItemProps: {
                  onClick: () => {
                    setSelectedOccupant(row.original)
                    setDeleteOccupantOpen(true)
                  },
                  sx: { color: 'error.main' }
                }
              }
            ]}
          />
        )
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [propertyMap]
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { rowSelection, globalFilter },
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
        title='Occupants Overview'
        description='Manage and view all your occupants in one place'
        icon='ri-group-line'
      />
      <OccupantsStatsCard
        total={stats.total}
        active={stats.active}
        inactive={stats.inactive}
        pending={stats.pending}
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Occupants List'
          action={
            <div className='flex items-center gap-2'>
              <Button
                size='small'
                startIcon={<i className='ri-refresh-line' />}
                onClick={() => {
                  fetchOccupants(null)
                  fetchStats()
                }}
              >
                Refresh
              </Button>
              <RowActions options={['Share', 'Export']} />
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

            <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
              <TextField
                size='small'
                placeholder='Search occupants...'
                value={globalFilter}
                onChange={e => {
                  setGlobalFilter(e.target.value)
                  setPage(0)
                }}
                className='w-full sm:min-w-[200px]'
              />

              <div className='flex items-center gap-2 sm:ml-auto'>
                <TextField
                  select
                  size='small'
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value))
                    setPage(0)
                    setCursor(null)
                    setCursorHistory([])
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
                  onClick={() => setAddOccupantOpen(true)}
                >
                  Add Occupant
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
                        No occupants found
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            )}
          </div>

          {/* Cursor-based Pagination */}
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
                setCursorHistory(prev => [...prev, cursor])
                fetchOccupants(cursor)
                setPage(newPage)
              } else if (newPage < page) {
                const newHistory = [...cursorHistory]
                const prevCursor = newHistory.pop() ?? null

                setCursorHistory(newHistory)
                fetchOccupants(prevCursor)
                setPage(newPage)
              }
            }}
            onRowsPerPageChange={e => {
              setPageSize(Number(e.target.value))
              setPage(0)
              setCursor(null)
              setCursorHistory([])
              fetchOccupants(null)
            }}
          />
        </CardContent>
      </Card>

      {/* Add Occupant Dialog */}
      <AddOccupantDialog
        open={addOccupantOpen}
        handleClose={() => {
          setAddOccupantOpen(false)
          fetchOccupants(null)
          fetchStats()
        }}
        properties={properties}
        mode='add'
      />

      {/* Edit Occupant Dialog */}
      <AddOccupantDialog
        open={editOccupantOpen}
        handleClose={() => {
          setEditOccupantOpen(false)
          setSelectedOccupant(null)
          fetchOccupants(null)
          fetchStats()
        }}
        properties={properties}
        editData={selectedOccupant}
        mode='edit'
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteOccupantOpen}
        setOpen={setDeleteOccupantOpen}
        type='delete-unit'
        onConfirm={handleDelete}
      />
    </>
  )
}

export default OccupantsListTable
