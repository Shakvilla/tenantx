'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'

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
import type { MaintenanceRequestType } from '@/types/maintenance/maintenanceRequestTypes'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import PageBanner from '@components/banner/PageBanner'
import CustomAvatar from '@core/components/mui/Avatar'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import AddMaintenanceRequestDialog from './AddMaintenanceRequestDialog'
import ViewMaintenanceRequestDialog from './ViewMaintenanceRequestDialog'

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

type MaintenanceRequestTypeWithAction = MaintenanceRequestType & {
  action?: string
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const day = date.getDate()
  const month = date.toLocaleString('en-US', { month: 'long' })
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

// Sample data
const sampleRequests: MaintenanceRequestType[] = [
  {
    id: 1,
    propertyName: 'A living room with mexican mansion blue',
    propertyImage:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 3',
    tenantName: 'John Doe',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    issue: 'Leaking faucet',
    description: 'Kitchen faucet is leaking continuously',
    priority: 'high',
    status: 'in-progress',
    assignedTo: 'John Smith',
    assignedToAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    requestedDate: '2024-11-15',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0'
    ]
  },
  {
    id: 2,
    propertyName: 'Rendering of a modern villa',
    propertyImage:
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=2148&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 6',
    tenantName: 'Jane Smith',
    tenantAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    issue: 'Broken AC',
    description: 'Air conditioning unit not working',
    priority: 'urgent',
    status: 'pending',
    requestedDate: '2024-11-20',
    images: []
  },
  {
    id: 3,
    propertyName: 'Beautiful modern style luxury home exterior sunset',
    propertyImage:
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 2',
    tenantName: 'Bob Johnson',
    tenantAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    issue: 'Electrical issue',
    description: 'Power outlet not working in bedroom',
    priority: 'high',
    status: 'new',
    requestedDate: '2024-11-25',
    images: []
  },
  {
    id: 4,
    propertyName: 'A house with a lot of windows and a lot of plants',
    propertyImage:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 4',
    tenantName: 'Alice Brown',
    tenantAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    issue: 'Plumbing problem',
    description: 'Toilet not flushing properly',
    priority: 'medium',
    status: 'completed',
    assignedTo: 'Sarah Johnson',
    assignedToAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    requestedDate: '2024-11-10',
    completedDate: '2024-11-12',
    images: []
  },
  {
    id: 5,
    propertyName: 'Design of a modern house as mansion blue couch',
    propertyImage:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 11',
    tenantName: 'Charlie Wilson',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    issue: 'Door lock',
    description: 'Front door lock is jammed',
    priority: 'medium',
    status: 'completed',
    assignedTo: 'Michael Brown',
    assignedToAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    requestedDate: '2024-11-08',
    completedDate: '2024-11-09',
    images: []
  },
  {
    id: 6,
    propertyName: 'A living room with mexican mansion blue',
    propertyImage:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 1',
    tenantName: 'David Lee',
    tenantAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    issue: 'Window repair',
    description: 'Bedroom window glass is cracked',
    priority: 'low',
    status: 'rejected',
    requestedDate: '2024-11-05',
    images: []
  },
  {
    id: 7,
    propertyName: 'Rendering of a modern villa',
    propertyImage:
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=2148&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 7',
    tenantName: 'Emily Davis',
    tenantAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    issue: 'Heating issue',
    description: 'Heater not working in living room',
    priority: 'high',
    status: 'pending',
    requestedDate: '2024-11-22',
    images: []
  },
  {
    id: 8,
    propertyName: 'Beautiful modern style luxury home exterior sunset',
    propertyImage:
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 5',
    tenantName: 'Frank Miller',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    issue: 'Paint touch-up',
    description: 'Wall paint is peeling in bathroom',
    priority: 'low',
    status: 'new',
    requestedDate: '2024-11-26',
    images: []
  }
]

const MaintenanceRequestsListTable = ({
  tableData
}: {
  tableData?: MaintenanceRequestType[]
}) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(tableData || sampleRequests)
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedPriority, setSelectedPriority] = useState<string>('')
  const [deleteRequestOpen, setDeleteRequestOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequestType | null>(null)
  const [addRequestOpen, setAddRequestOpen] = useState(false)
  const [editRequestOpen, setEditRequestOpen] = useState(false)
  const [viewRequestOpen, setViewRequestOpen] = useState(false)
  const [requestToEdit, setRequestToEdit] = useState<MaintenanceRequestType | null>(null)
  const [requestToView, setRequestToView] = useState<MaintenanceRequestType | null>(null)

  // Filter data
  useEffect(() => {
    let filtered = data

    if (globalFilter) {
      filtered = filtered.filter(
        request =>
          request.issue?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          request.propertyName?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          request.unitNo?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          request.tenantName?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          request.description?.toLowerCase().includes(globalFilter.toLowerCase())
      )
    }

    if (selectedStatus) {
      filtered = filtered.filter(request => request.status === selectedStatus)
    }

    if (selectedPriority) {
      filtered = filtered.filter(request => request.priority === selectedPriority)
    }

    setFilteredData(filtered)
  }, [data, globalFilter, selectedStatus, selectedPriority])

  // Handle delete request
  const handleDeleteRequest = (requestId: number) => {
    setData(data.filter(request => request.id !== requestId))
    setDeleteRequestOpen(false)
    setSelectedRequest(null)
    setRowSelection({})
  }

  const columnHelper = createColumnHelper<MaintenanceRequestTypeWithAction>()

  // Status color mapping
  const requestStatusObj: {
    [key: string]: {
      color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
    }
  } = {
    new: { color: 'info' },
    pending: { color: 'warning' },
    'in-progress': { color: 'primary' },
    completed: { color: 'success' },
    rejected: { color: 'error' }
  }

  // Priority color mapping
  const priorityObj: {
    [key: string]: {
      color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
    }
  } = {
    low: { color: 'info' },
    medium: { color: 'warning' },
    high: { color: 'error' },
    urgent: { color: 'error' }
  }

  const columns = useMemo<ColumnDef<MaintenanceRequestTypeWithAction, any>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            indeterminate={row.getIsSomeSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      },
      columnHelper.display({
        id: 'sl',
        header: 'SL',
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex
          const pageSize = table.getState().pagination.pageSize
          return <Typography>{pageIndex * pageSize + row.index + 1}.</Typography>
        }
      }),
      columnHelper.accessor('propertyName', {
        header: 'Property',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <CustomAvatar
              src={row.original.propertyImage}
              skin='light'
              size={34}
              variant='rounded'
            >
              {getInitials(row.original.propertyName || 'P')}
            </CustomAvatar>
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.propertyName || '-'}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {row.original.unitNo || '-'}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('tenantName', {
        header: 'Tenant',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <CustomAvatar src={row.original.tenantAvatar} skin='light' size={28}>
              {getInitials(row.original.tenantName)}
            </CustomAvatar>
            <Typography color='text.primary' className='font-medium'>
              {row.original.tenantName || '-'}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('issue', {
        header: 'Issue',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.issue || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('priority', {
        header: 'Priority',
        cell: ({ row }) => {
          const priority = row.original.priority
          const priorityConfig = priorityObj[priority] || { color: 'secondary' }

          return (
            <Chip
              variant='tonal'
              label={priority}
              size='small'
              color={priorityConfig.color}
              className='capitalize'
            />
          )
        }
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          const statusConfig = requestStatusObj[status] || { color: 'secondary' }

          return (
            <Chip
              variant='tonal'
              label={status.replace('-', ' ')}
              size='small'
              color={statusConfig.color}
              className='capitalize'
            />
          )
        }
      }),
      columnHelper.accessor('assignedTo', {
        header: 'Assigned To',
        cell: ({ row }) => {
          if (row.original.assignedTo) {
            return (
              <div className='flex items-center gap-2'>
                <CustomAvatar src={row.original.assignedToAvatar} skin='light' size={28}>
                  {getInitials(row.original.assignedTo)}
                </CustomAvatar>
                <Typography color='text.primary' className='font-medium'>
                  {row.original.assignedTo}
                </Typography>
              </div>
            )
          }
          return <Typography color='text.secondary'>-</Typography>
        }
      }),
      columnHelper.accessor('requestedDate', {
        header: 'Requested Date',
        cell: ({ row }) => (
          <Typography color='text.primary'>{formatDate(row.original.requestedDate)}</Typography>
        )
      }),
      columnHelper.display({
        id: 'action',
        header: 'Action',
        cell: ({ row }) => {
          return (
            <OptionMenu
              iconButtonProps={{ size: 'small' }}
              options={[
                {
                  text: 'View',
                  icon: 'ri-eye-line',
                  menuItemProps: {
                    onClick: () => {
                      setRequestToView(row.original)
                      setViewRequestOpen(true)
                    }
                  }
                },
                {
                  text: 'Edit',
                  icon: 'ri-pencil-line',
                  menuItemProps: {
                    onClick: () => {
                      setRequestToEdit(row.original)
                      setEditRequestOpen(true)
                    }
                  }
                },
                {
                  text: 'Delete',
                  icon: 'ri-delete-bin-line',
                  menuItemProps: {
                    onClick: () => {
                      setSelectedRequest(row.original)
                      setDeleteRequestOpen(true)
                    }
                  }
                }
              ]}
            />
          )
        },
        enableSorting: false
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        title='Maintenance Requests'
        description='Manage and track maintenance requests from tenants'
        icon='ri-tools-line'
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Maintenance Requests List'
          action={
            <div className='flex items-center gap-2'>
              {Object.keys(rowSelection).length > 0 && (
                <Button
                  variant='outlined'
                  color='error'
                  startIcon={<i className='ri-delete-bin-line' />}
                  onClick={() => {
                    const selectedIds = Object.keys(rowSelection)
                      .map(key => filteredData[parseInt(key)]?.id)
                      .filter(Boolean) as number[]
                    if (selectedIds.length > 0) {
                      setSelectedRequest({ id: selectedIds[0] } as MaintenanceRequestType)
                      setDeleteRequestOpen(true)
                    }
                  }}
                >
                  Delete Selected ({Object.keys(rowSelection).length})
                </Button>
              )}
              <Button
                variant='contained'
                color='primary'
                startIcon={<i className='ri-add-line' />}
                onClick={() => setAddRequestOpen(true)}
              >
                Add Request
              </Button>
              <OptionMenu options={['Refresh', 'Share']} />
            </div>
          }
        />
        <Divider />
        <CardContent className='flex flex-col gap-4'>
          {/* Filters */}
          <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
            <div className='flex flex-wrap gap-4 items-center'>
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} label='Status'>
                  <MenuItem value=''>All Status</MenuItem>
                  <MenuItem value='new'>New</MenuItem>
                  <MenuItem value='pending'>Pending</MenuItem>
                  <MenuItem value='in-progress'>In Progress</MenuItem>
                  <MenuItem value='completed'>Completed</MenuItem>
                  <MenuItem value='rejected'>Rejected</MenuItem>
                </Select>
              </FormControl>
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Priority</InputLabel>
                <Select value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)} label='Priority'>
                  <MenuItem value=''>All Priority</MenuItem>
                  <MenuItem value='low'>Low</MenuItem>
                  <MenuItem value='medium'>Medium</MenuItem>
                  <MenuItem value='high'>High</MenuItem>
                  <MenuItem value='urgent'>Urgent</MenuItem>
                </Select>
              </FormControl>
            </div>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search:'
              className='sm:is-auto min-is-[200px]'
            />
          </div>

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

      {/* Add Request Dialog */}
      <AddMaintenanceRequestDialog
        open={addRequestOpen}
        handleClose={() => setAddRequestOpen(false)}
        requestData={data}
        setData={setData}
        mode='add'
      />

      {/* Edit Request Dialog */}
      <AddMaintenanceRequestDialog
        open={editRequestOpen}
        handleClose={() => {
          setEditRequestOpen(false)
          setRequestToEdit(null)
        }}
        requestData={data}
        setData={setData}
        editData={requestToEdit}
        mode='edit'
      />

      {/* View Request Dialog */}
      <ViewMaintenanceRequestDialog
        open={viewRequestOpen}
        setOpen={setViewRequestOpen}
        request={requestToView}
        onEdit={() => {
          setViewRequestOpen(false)
          setRequestToEdit(requestToView)
          setEditRequestOpen(true)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteRequestOpen}
        setOpen={setDeleteRequestOpen}
        type='delete-maintenance-request'
        onConfirm={() => {
          if (selectedRequest) {
            const selectedIds = Object.keys(rowSelection).length > 0
              ? (Object.keys(rowSelection)
                  .map(key => filteredData[parseInt(key)]?.id)
                  .filter(Boolean) as number[])
              : [selectedRequest.id]

            if (selectedIds.length > 0) {
              setData(data.filter(request => !selectedIds.includes(request.id)))
              setRowSelection({})
            }
            setDeleteRequestOpen(false)
            setSelectedRequest(null)
          }
        }}
      />
    </>
  )
}

export default MaintenanceRequestsListTable

