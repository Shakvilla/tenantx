// Documentation: /docs/agreement/agreement-module.md

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
import AgreementsStatsCard from './AgreementsStatsCard'
import CustomAvatar from '@core/components/mui/Avatar'
import AddAgreementDialog from './AddAgreementDialog'
import ViewAgreementDialog from './ViewAgreementDialog'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'

// Type Imports
import type { Agreement, AgreementWithAction } from '@/types/agreement/agreementTypes'

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

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

// Sample data
const sampleAgreements: Agreement[] = [
  {
    id: 1,
    agreementNumber: 'AGR-001',
    type: 'lease',
    status: 'active',
    tenantName: 'John Doe',
    tenantAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    propertyName: 'Xorla House',
    unitNo: 'Unit 101',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    signedDate: '2023-12-15',
    amount: '₵14,400',
    rent: '₵1,200',
    securityDeposit: '₵2,400',
    lateFee: '₵50',
    paymentFrequency: 'monthly',
    duration: '12 months'
  },
  {
    id: 2,
    agreementNumber: 'AGR-002',
    type: 'lease',
    status: 'active',
    tenantName: 'Jane Smith',
    tenantAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    propertyName: 'Xorla House',
    unitNo: 'Unit 102',
    startDate: '2024-02-01',
    endDate: '2024-07-31',
    signedDate: '2024-01-20',
    amount: '₵9,000',
    rent: '₵1,500',
    securityDeposit: '₵3,000',
    lateFee: '₵75',
    paymentFrequency: 'monthly',
    duration: '6 months'
  },
  {
    id: 3,
    agreementNumber: 'AGR-003',
    type: 'contract',
    status: 'active',
    tenantName: 'Mike Johnson',
    tenantAvatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    propertyName: 'Xorla House',
    unitNo: 'Unit 201',
    startDate: '2023-06-01',
    endDate: '2025-05-31',
    signedDate: '2023-05-15',
    amount: '₵57,600',
    rent: '₵2,400',
    securityDeposit: '₵4,800',
    lateFee: '₵100',
    paymentFrequency: 'monthly',
    duration: '24 months'
  },
  {
    id: 4,
    agreementNumber: 'AGR-004',
    type: 'lease',
    status: 'expired',
    tenantName: 'Sarah Williams',
    tenantAvatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    propertyName: 'Sunset Apartments',
    unitNo: 'Unit 301',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    signedDate: '2022-12-10',
    amount: '₵21,600',
    rent: '₵1,800',
    securityDeposit: '₵3,600',
    lateFee: '₵60',
    paymentFrequency: 'monthly',
    duration: '12 months'
  },
  {
    id: 5,
    agreementNumber: 'AGR-005',
    type: 'lease',
    status: 'pending',
    tenantName: 'David Brown',
    tenantAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    propertyName: 'Xorla House',
    unitNo: 'Unit 202',
    startDate: '2024-03-01',
    endDate: '2024-08-31',
    signedDate: '',
    amount: '₵7,800',
    rent: '₵1,300',
    securityDeposit: '₵2,600',
    lateFee: '₵55',
    paymentFrequency: 'monthly',
    duration: '6 months'
  }
]

const columnHelper = createColumnHelper<AgreementWithAction>()

const AgreementsListTable = () => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(sampleAgreements)
  const [globalFilter, setGlobalFilter] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [property, setProperty] = useState('')
  const [addAgreementOpen, setAddAgreementOpen] = useState(false)
  const [editAgreementOpen, setEditAgreementOpen] = useState(false)
  const [viewAgreementOpen, setViewAgreementOpen] = useState(false)
  const [deleteAgreementOpen, setDeleteAgreementOpen] = useState(false)
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null)

  // Calculate stats
  const stats = useMemo(() => {
    const activeAgreements = data.filter(a => a.status === 'active').length
    const expiredAgreements = data.filter(a => a.status === 'expired').length
    const pendingAgreements = data.filter(a => a.status === 'pending').length
    const totalRevenue = data
      .filter(a => a.status === 'active' && a.amount)
      .reduce((sum, agreement) => {
        const amount = parseFloat((agreement.amount || '0').replace(/[₵,]/g, ''))
        return sum + amount
      }, 0)

    return {
      totalAgreements: data.length,
      activeAgreements,
      expiredAgreements,
      pendingAgreements,
      totalRevenue: `₵${totalRevenue.toLocaleString()}`
    }
  }, [data])

  // Get unique values for filters
  const uniqueProperties = useMemo(() => {
    const properties = Array.from(new Set(data.map(a => a.propertyName)))
    return properties
  }, [data])

  // Sample properties, units, and tenants data (in a real app, these would come from API)
  const properties = useMemo(
    () => [
      { id: 1, name: 'Xorla House' },
      { id: 2, name: 'Sunset Apartments' }
    ],
    []
  )

  const units = useMemo(
    () => [
      { id: '1', unitNumber: 'Unit 101', propertyId: '1', propertyName: 'Xorla House' },
      { id: '2', unitNumber: 'Unit 102', propertyId: '1', propertyName: 'Xorla House' },
      { id: '3', unitNumber: 'Unit 201', propertyId: '1', propertyName: 'Xorla House' },
      { id: '4', unitNumber: 'Unit 202', propertyId: '1', propertyName: 'Xorla House' },
      { id: '5', unitNumber: 'Unit 301', propertyId: '2', propertyName: 'Sunset Apartments' }
    ],
    []
  )

  const tenants = useMemo(
    () => [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
      { id: 3, name: 'Mike Johnson' },
      { id: 4, name: 'Sarah Williams' },
      { id: 5, name: 'David Brown' }
    ],
    []
  )

  const handleDeleteAgreement = (agreementId: number) => {
    setData(data.filter(a => a.id !== agreementId))
    setDeleteAgreementOpen(false)
    setSelectedAgreement(null)
  }

  const handleEditAgreement = (agreement: Agreement) => {
    setSelectedAgreement(agreement)
    setEditAgreementOpen(true)
  }

  const handleViewAgreement = (agreement: Agreement) => {
    setSelectedAgreement(agreement)
    setViewAgreementOpen(true)
  }

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = data

    if (status) {
      filtered = filtered.filter(a => a.status === status)
    }
    if (type) {
      filtered = filtered.filter(a => a.type === type)
    }
    if (property) {
      filtered = filtered.filter(a => a.propertyName === property)
    }

    return filtered
  }, [data, status, type, property])

  const columns = useMemo<ColumnDef<AgreementWithAction, any>[]>(
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
      columnHelper.accessor('agreementNumber', {
        header: 'AGREEMENT #',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.agreementNumber}
          </Typography>
        )
      }),
      columnHelper.accessor('type', {
        header: 'TYPE',
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={row.original.type}
            size='small'
            color={row.original.type === 'lease' ? 'primary' : 'info'}
            className='capitalize'
          />
        )
      }),
      columnHelper.accessor('tenantName', {
        header: 'TENANT',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            {row.original.tenantAvatar ? (
              <Avatar src={row.original.tenantAvatar} sx={{ width: 34, height: 34 }} />
            ) : (
              <CustomAvatar skin='light' color='primary' size={34}>
                {getInitials(row.original.tenantName)}
              </CustomAvatar>
            )}
            <Typography color='text.primary' className='font-medium'>
              {row.original.tenantName}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('propertyName', {
        header: 'PROPERTY/UNIT',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.propertyName}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {row.original.unitNo}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => {
          const statusColors: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
            active: 'success',
            expired: 'warning',
            pending: 'info',
            terminated: 'error'
          }
          return (
            <Chip
              variant='tonal'
              label={row.original.status}
              size='small'
              color={statusColors[row.original.status] || 'default'}
              className='capitalize'
            />
          )
        }
      }),
      columnHelper.accessor('startDate', {
        header: 'START DATE',
        cell: ({ row }) => {
          const date = new Date(row.original.startDate)
          return <Typography>{date.toLocaleDateString()}</Typography>
        }
      }),
      columnHelper.accessor('endDate', {
        header: 'END DATE',
        cell: ({ row }) => {
          const date = new Date(row.original.endDate)
          return <Typography>{date.toLocaleDateString()}</Typography>
        }
      }),
      columnHelper.accessor('amount', {
        header: 'AMOUNT',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.amount}
          </Typography>
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
                menuItemProps: {
                  onClick: () => handleViewAgreement(row.original)
                }
              },
              {
                text: 'Edit',
                icon: 'ri-pencil-line',
                menuItemProps: {
                  onClick: () => handleEditAgreement(row.original)
                }
              },
              {
                text: 'Download',
                icon: 'ri-download-line',
                menuItemProps: {
                  onClick: () => {
                    // Handle download
                    console.log('Download agreement:', row.original.agreementNumber)
                  }
                }
              },
              {
                text: 'Delete',
                icon: 'ri-delete-bin-line',
                menuItemProps: {
                  onClick: () => {
                    setSelectedAgreement(row.original)
                    setDeleteAgreementOpen(true)
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
        title='Agreements Overview'
        description='Manage and view all your agreements in one place'
        icon='ri-file-contract-line'
      />
      <AgreementsStatsCard
        totalAgreements={stats.totalAgreements}
        activeAgreements={stats.activeAgreements}
        expiredAgreements={stats.expiredAgreements}
        pendingAgreements={stats.pendingAgreements}
        totalRevenue={stats.totalRevenue}
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Agreements List'
          action={
            <div className='flex items-center gap-2'>
              <OptionMenu options={['Refresh', 'Share']} />
            </div>
          }
        />
        <CardContent className='flex flex-col gap-4'>
          {/* Filters Section */}
          <Box className='flex flex-col gap-4 p-4 rounded-lg'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-center gap-2'>
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
                label='Type'
                value={type}
                onChange={e => setType(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value=''>All Types</MenuItem>
                <MenuItem value='lease'>Lease</MenuItem>
                <MenuItem value='contract'>Contract</MenuItem>
                <MenuItem value='other'>Other</MenuItem>
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
                <MenuItem value='expired'>Expired</MenuItem>
                <MenuItem value='pending'>Pending</MenuItem>
                <MenuItem value='terminated'>Terminated</MenuItem>
              </TextField>
            </div>
            <Divider />

            <div className='flex items-center justify-between gap-2'>
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
                  onClick={() => setAddAgreementOpen(true)}
                >
                  Add Agreement
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

      {/* Add Agreement Dialog */}
      <AddAgreementDialog
        open={addAgreementOpen}
        handleClose={() => setAddAgreementOpen(false)}
        properties={properties}
        units={units}
        tenants={tenants}
        agreementsData={data}
        setData={setData}
        mode='add'
      />

      {/* Edit Agreement Dialog */}
      <AddAgreementDialog
        open={editAgreementOpen}
        handleClose={() => {
          setEditAgreementOpen(false)
          setSelectedAgreement(null)
        }}
        properties={properties}
        units={units}
        tenants={tenants}
        agreementsData={data}
        setData={setData}
        editData={selectedAgreement}
        mode='edit'
      />

      {/* View Agreement Dialog */}
      <ViewAgreementDialog
        open={viewAgreementOpen}
        handleClose={() => {
          setViewAgreementOpen(false)
          setSelectedAgreement(null)
        }}
        agreement={selectedAgreement}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteAgreementOpen}
        setOpen={setDeleteAgreementOpen}
        type='delete-tenant'
        onConfirm={() => {
          if (selectedAgreement) {
            handleDeleteAgreement(selectedAgreement.id)
          }
        }}
      />
    </>
  )
}

export default AgreementsListTable

