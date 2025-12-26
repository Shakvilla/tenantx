'use client'

// React Imports
import { useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import TablePagination from '@mui/material/TablePagination'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'

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

type PaymentRecord = {
  id: number
  sl: number
  property: string
  propertyImage: string
  unitNo: string
  month: string
  invoice: string
  issuesDate: string
  dueDate: string
  amount: string
  status: 'paid' | 'unpaid' | 'refunded'
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })
  
return itemRank.passed
}

// Sample payment history data
const samplePayments: PaymentRecord[] = [
  {
    id: 1,
    sl: 1,
    property: 'A living room with mexican mansion blue',
    propertyImage:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    unitNo: 'Unit no 3',
    month: 'July',
    invoice: '60584',
    issuesDate: '09/07/2024',
    dueDate: '10/07/2024',
    amount: '₵1,450',
    status: 'unpaid'
  },
  {
    id: 2,
    sl: 2,
    property: 'Rendering of a modern villa',
    propertyImage:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    unitNo: 'Unit no 4',
    month: 'June',
    invoice: '60583',
    issuesDate: '07/06/2024',
    dueDate: '10/07/2024',
    amount: '₵2,500',
    status: 'paid'
  },
  {
    id: 3,
    sl: 3,
    property: 'Beautiful modern style luxury home exterior sunset',
    propertyImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    unitNo: 'Unit no 2',
    month: 'May',
    invoice: '60582',
    issuesDate: '08/05/2024',
    dueDate: '10/07/2024',
    amount: '₵2,999',
    status: 'unpaid'
  },
  {
    id: 4,
    sl: 4,
    property: 'A house with a lot of windows and a lot of plants',
    propertyImage:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    unitNo: 'Unit no 6',
    month: 'April',
    invoice: '60581',
    issuesDate: '05/04/2024',
    dueDate: '10/07/2024',
    amount: '₵3,600',
    status: 'paid'
  },
  {
    id: 5,
    sl: 5,
    property: 'Rendering of a modern villa',
    propertyImage:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    unitNo: 'Unit no 1',
    month: 'March',
    invoice: '60580',
    issuesDate: '05/03/2024',
    dueDate: '10/07/2024',
    amount: '₵4,000',
    status: 'paid'
  },
  {
    id: 6,
    sl: 6,
    property: 'Rendering of a modern villa',
    propertyImage:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    unitNo: 'Unit no 5',
    month: 'February',
    invoice: '60579',
    issuesDate: '09/02/2024',
    dueDate: '10/07/2024',
    amount: '₵1,000',
    status: 'paid'
  },
  {
    id: 7,
    sl: 7,
    property: 'Design of a modern house as mansion blue couch',
    propertyImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    unitNo: 'Unit no 7',
    month: 'January',
    invoice: '60578',
    issuesDate: '07/01/2024',
    dueDate: '10/07/2024',
    amount: '₵1,500',
    status: 'paid'
  },
  {
    id: 8,
    sl: 8,
    property: 'Depending on the location and design',
    propertyImage:
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    unitNo: 'Unit no 8',
    month: 'December',
    invoice: '60577',
    issuesDate: '08/12/2023',
    dueDate: '10/07/2023',
    amount: '₵3,000',
    status: 'unpaid'
  }
]

const columnHelper = createColumnHelper<PaymentRecord>()

const PaymentHistoryTab = () => {
  // States
  const [data, setData] = useState(samplePayments)
  const [globalFilter, setGlobalFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)
  const [newStatus, setNewStatus] = useState<'paid' | 'unpaid' | 'refunded'>('paid')

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = data

    if (monthFilter) {
      filtered = filtered.filter(p => p.month === monthFilter)
    }

    return filtered
  }, [data, monthFilter])

  const columns = useMemo<ColumnDef<PaymentRecord, any>[]>(
    () => [
      columnHelper.accessor('sl', {
        header: 'SL',
        cell: ({ row }) => <Typography>{row.original.sl}.</Typography>
      }),
      columnHelper.accessor('property', {
        header: 'PROPERTY',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium max-w-[200px]'>
            {row.original.property}
          </Typography>
        )
      }),
      columnHelper.display({
        id: 'image',
        header: 'IMAGE',
        cell: ({ row }) => (
          <Avatar
            src={row.original.propertyImage}
            alt={row.original.property}
            variant='rounded'
            sx={{ width: 50, height: 50 }}
          />
        )
      }),
      columnHelper.accessor('unitNo', {
        header: 'UNIT NO',
        cell: ({ row }) => <Typography>{row.original.unitNo}</Typography>
      }),
      columnHelper.accessor('month', {
        header: 'MONTH',
        cell: ({ row }) => <Typography>{row.original.month}</Typography>
      }),
      columnHelper.accessor('invoice', {
        header: 'INVOICE',
        cell: ({ row }) => <Typography>{row.original.invoice}</Typography>
      }),
      columnHelper.accessor('issuesDate', {
        header: 'ISSUES DATE',
        cell: ({ row }) => <Typography>{row.original.issuesDate}</Typography>
      }),
      columnHelper.accessor('dueDate', {
        header: 'DUE DATE',
        cell: ({ row }) => <Typography>{row.original.dueDate}</Typography>
      }),
      columnHelper.accessor('amount', {
        header: 'AMOUNT',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.amount}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => {
          const availableStatuses = getAvailableStatuses(row.original.status)
          const canEdit = availableStatuses.length > 0

          return (
            <div className='flex items-center gap-2'>
              <Chip
                variant='tonal'
                label={row.original.status}
                size='small'
                color={
                  row.original.status === 'paid' ? 'success' : row.original.status === 'refunded' ? 'error' : 'warning'
                }
                className='capitalize'
              />
              {canEdit && (
                <IconButton size='small' onClick={() => handleEditClick(row.original)} className='text-primary'>
                  <i className='ri-edit-line text-lg' />
                </IconButton>
              )}
            </div>
          )
        }
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
        pageSize: 8
      }
    },
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  // Get unique months for filter
  const uniqueMonths = useMemo(() => {
    const months = Array.from(new Set(data.map(p => p.month)))

    
return months.sort()
  }, [data])

  // Get available status options based on current status
  const getAvailableStatuses = (currentStatus: PaymentRecord['status']): PaymentRecord['status'][] => {
    if (currentStatus === 'paid') {
      return ['refunded']
    } else if (currentStatus === 'unpaid') {
      return ['paid']
    } else {
      // refunded - no further updates allowed
      return []
    }
  }

  // Handle status update
  const handleStatusUpdate = () => {
    if (selectedPayment) {
      setData(data.map(payment => (payment.id === selectedPayment.id ? { ...payment, status: newStatus } : payment)))
      setUpdateDialogOpen(false)
      setSelectedPayment(null)
    }
  }

  // Handle edit click
  const handleEditClick = (payment: PaymentRecord) => {
    setSelectedPayment(payment)
    const availableStatuses = getAvailableStatuses(payment.status)

    if (availableStatuses.length > 0) {
      setNewStatus(availableStatuses[0])
      setUpdateDialogOpen(true)
    }
  }

  return (
    <Card>
      <CardHeader
        title='Payment History'
        action={
          <TextField
            select
            size='small'
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            sx={{ minWidth: 150 }}
            defaultValue=''
          >
            <MenuItem value=''>This Month</MenuItem>
            {uniqueMonths.map(month => (
              <MenuItem key={month} value={month}>
                {month}
              </MenuItem>
            ))}
          </TextField>
        }
      />
      <CardContent className='flex flex-col gap-4'>
        {/* Table Controls */}
        <Box className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-2'>
            <Typography variant='body2'>Show</Typography>
            <TextField
              select
              size='small'
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              sx={{ minWidth: 80 }}
            >
              <MenuItem value={8}>08</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </TextField>
            <Typography variant='body2'>entries</Typography>
          </div>
          <TextField
            size='small'
            placeholder='Search'
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className='min-w-[200px]'
            InputProps={{
              startAdornment: <i className='ri-search-line text-lg mie-2' />
            }}
          />
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
                    No payment records available
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

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[8, 10, 25, 50]}
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

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle className='flex items-center justify-between'>
          <span>Update Payment Status</span>
          <IconButton size='small' onClick={() => setUpdateDialogOpen(false)}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 mbs-4'>
            <Box>
              <Typography variant='body2' color='text.secondary' className='mbe-1'>
                Invoice Number
              </Typography>
              <Typography variant='body1' className='font-medium'>
                {selectedPayment?.invoice}
              </Typography>
            </Box>
            <Box>
              <Typography variant='body2' color='text.secondary' className='mbe-1'>
                Current Status
              </Typography>
              <Chip
                variant='tonal'
                label={selectedPayment?.status}
                size='small'
                color={
                  selectedPayment?.status === 'paid'
                    ? 'success'
                    : selectedPayment?.status === 'refunded'
                      ? 'error'
                      : 'warning'
                }
                className='capitalize'
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel id='status-select-label'>New Status</InputLabel>
              <Select
                labelId='status-select-label'
                label='New Status'
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as PaymentRecord['status'])}
              >
                {getAvailableStatuses(selectedPayment?.status || 'unpaid').map(status => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions className='gap-2 pbs-4'>
          <Button variant='outlined' color='secondary' onClick={() => setUpdateDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant='contained' color='primary' onClick={handleStatusUpdate}>
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default PaymentHistoryTab
