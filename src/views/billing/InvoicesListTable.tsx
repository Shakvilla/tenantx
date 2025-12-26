'use client'

// React Imports
import { useState, useMemo, useEffect, useCallback } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import TablePagination from '@mui/material/TablePagination'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
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

// Component Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'
import AddInvoiceDialog from './AddInvoiceDialog'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Helper function to format dates consistently
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  
return `${day}/${month}/${year}`
}

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type Invoice = {
  id: number
  invoiceNumber: string
  tenantName: string
  tenantEmail: string
  tenantAvatar?: string
  propertyName: string
  unitName: string
  amount: string
  issuedDate: string
  dueDate: string
  status: 'paid' | 'pending' | 'overdue' | 'draft' | 'cancelled'
  balance: string
}

type InvoiceWithAction = Invoice & {
  action?: string
}

type InvoiceStatusObj = {
  [key: string]: {
    icon: string
    color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
  }
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
  }, [value, debounce, onChange])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// Vars
const invoiceStatusObj: InvoiceStatusObj = {
  paid: { color: 'success', icon: 'ri-checkbox-circle-line' },
  pending: { color: 'warning', icon: 'ri-time-line' },
  overdue: { color: 'error', icon: 'ri-error-warning-line' },
  draft: { color: 'info', icon: 'ri-file-edit-line' },
  cancelled: { color: 'secondary', icon: 'ri-close-circle-line' }
}

// Sample data
const sampleInvoices: Invoice[] = [
  {
    id: 1,
    invoiceNumber: 'INV-2024-001',
    tenantName: 'John Doe',
    tenantEmail: 'john.doe@example.com',
    tenantAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    propertyName: 'Xorla House',
    unitName: 'Unit 101',
    amount: '₵1,450',
    issuedDate: '2024-07-01',
    dueDate: '2024-07-15',
    status: 'paid',
    balance: '₵0'
  },
  {
    id: 2,
    invoiceNumber: 'INV-2024-002',
    tenantName: 'Jane Smith',
    tenantEmail: 'jane.smith@example.com',
    tenantAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    propertyName: 'Xorla House',
    unitName: 'Unit 102',
    amount: '₵1,500',
    issuedDate: '2024-07-01',
    dueDate: '2024-07-15',
    status: 'pending',
    balance: '₵1,500'
  },
  {
    id: 3,
    invoiceNumber: 'INV-2024-003',
    tenantName: 'Mike Johnson',
    tenantEmail: 'mike.johnson@example.com',
    propertyName: 'Xorla House',
    unitName: 'Unit 201',
    amount: '₵2,400',
    issuedDate: '2024-06-25',
    dueDate: '2024-07-10',
    status: 'overdue',
    balance: '₵2,400'
  },
  {
    id: 4,
    invoiceNumber: 'INV-2024-004',
    tenantName: 'Sarah Williams',
    tenantEmail: 'sarah.williams@example.com',
    propertyName: 'Sunset Apartments',
    unitName: 'Unit 301',
    amount: '₵1,800',
    issuedDate: '2024-07-05',
    dueDate: '2024-07-20',
    status: 'paid',
    balance: '₵0'
  },
  {
    id: 5,
    invoiceNumber: 'INV-2024-005',
    tenantName: 'David Brown',
    tenantEmail: 'david.brown@example.com',
    propertyName: 'Xorla House',
    unitName: 'Unit 202',
    amount: '₵1,300',
    issuedDate: '2024-07-01',
    dueDate: '2024-07-15',
    status: 'draft',
    balance: '₵1,300'
  }
]

const columnHelper = createColumnHelper<InvoiceWithAction>()

const InvoicesListTable = () => {
  // States
  const [status, setStatus] = useState<string>('')
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(sampleInvoices)
  const [globalFilter, setGlobalFilter] = useState('')
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [newStatus, setNewStatus] = useState<Invoice['status']>('pending')
  const [addInvoiceOpen, setAddInvoiceOpen] = useState(false)
  const [editInvoiceOpen, setEditInvoiceOpen] = useState(false)
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState<Invoice | null>(null)

  // Get available status options based on current status
  const getAvailableStatuses = useCallback((currentStatus: Invoice['status']): Invoice['status'][] => {
    switch (currentStatus) {
      case 'draft':
        return ['pending', 'cancelled']
      case 'pending':
        return ['paid', 'overdue', 'cancelled']
      case 'overdue':
        return ['paid', 'cancelled']
      case 'paid':
        return ['cancelled']
      case 'cancelled':
        return [] // Final state, cannot be updated
      default:
        return []
    }
  }, [])

  // Handle edit click
  const handleEditClick = useCallback(
    (invoice: Invoice) => {
      setSelectedInvoice(invoice)
      const availableStatuses = getAvailableStatuses(invoice.status)

      if (availableStatuses.length > 0) {
        setNewStatus(availableStatuses[0])
        setUpdateDialogOpen(true)
      }
    },
    [getAvailableStatuses]
  )

  // Handle status update
  const handleStatusUpdate = () => {
    if (selectedInvoice) {
      setData(
        data.map(invoice =>
          invoice.id === selectedInvoice.id
            ? {
                ...invoice,
                status: newStatus,
                balance: newStatus === 'paid' ? '₵0' : invoice.amount
              }
            : invoice
        )
      )
      setUpdateDialogOpen(false)
      setSelectedInvoice(null)
    }
  }

  const columns = useMemo<ColumnDef<InvoiceWithAction, any>[]>(
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
      columnHelper.accessor('invoiceNumber', {
        header: 'INVOICE #',
        cell: ({ row }) => (
          <Typography component={Link} href={`/billing/invoices/${row.original.id}`} color='primary.main'>
            {row.original.invoiceNumber}
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
              <Tooltip
                title={
                  <div>
                    <Typography variant='body2' component='span' className='text-inherit'>
                      {row.original.status}
                    </Typography>
                    <br />
                    <Typography variant='body2' component='span' className='text-inherit'>
                      Balance: {row.original.balance}
                    </Typography>
                    <br />
                    <Typography variant='body2' component='span' className='text-inherit'>
                      Due Date: {formatDate(row.original.dueDate)}
                    </Typography>
                  </div>
                }
              >
                <CustomAvatar skin='light' color={invoiceStatusObj[row.original.status].color} size={28}>
                  <i className={classnames('text-base', invoiceStatusObj[row.original.status].icon)} />
                </CustomAvatar>
              </Tooltip>
              {canEdit && (
                <IconButton size='small' onClick={() => handleEditClick(row.original)} className='text-primary'>
                  <i className='ri-edit-line text-lg' />
                </IconButton>
              )}
            </div>
          )
        }
      }),
      columnHelper.accessor('tenantName', {
        header: 'TENANT',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            {row.original.tenantAvatar ? (
              <CustomAvatar src={row.original.tenantAvatar} skin='light' size={34} />
            ) : (
              <CustomAvatar skin='light' size={34}>
                {getInitials(row.original.tenantName)}
              </CustomAvatar>
            )}
            <div className='flex flex-col'>
              <Typography className='font-medium' color='text.primary'>
                {row.original.tenantName}
              </Typography>
              <Typography variant='body2'>{row.original.tenantEmail}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('propertyName', {
        header: 'PROPERTY',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography className='font-medium' color='text.primary'>
              {row.original.propertyName}
            </Typography>
            <Typography variant='body2'>{row.original.unitName}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('amount', {
        header: 'AMOUNT',
        cell: ({ row }) => <Typography className='font-medium'>{row.original.amount}</Typography>
      }),
      columnHelper.accessor('issuedDate', {
        header: 'ISSUED DATE',
        cell: ({ row }) => <Typography>{formatDate(row.original.issuedDate)}</Typography>
      }),
      columnHelper.accessor('dueDate', {
        header: 'DUE DATE',
        cell: ({ row }) => <Typography>{formatDate(row.original.dueDate)}</Typography>
      }),
      columnHelper.accessor('balance', {
        header: 'BALANCE',
        cell: ({ row }) => {
          return row.original.balance === '₵0' ? (
            <Chip variant='tonal' label='Paid' color='success' size='small' />
          ) : (
            <Typography color='text.primary' className='font-medium'>
              {row.original.balance}
            </Typography>
          )
        }
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
                href: `/billing/invoices/${row.original.id}`
              },
              {
                text: 'Download',
                icon: 'ri-download-line',
                menuItemProps: {
                  onClick: () => {
                    // Handle download
                    console.log('Download invoice', row.original.id)
                  }
                }
              },
              {
                text: 'Edit',
                icon: 'ri-pencil-line',
                menuItemProps: {
                  onClick: () => {
                    setSelectedInvoiceForEdit(row.original)
                    setEditInvoiceOpen(true)
                  }
                }
              }
            ]}
          />
        ),
        enableSorting: false
      })
    ],
    [getAvailableStatuses, handleEditClick]
  )

  // Filter by status
  const filteredData = useMemo(() => {
    if (!status) return data
    
return data.filter(invoice => invoice.status === status)
  }, [status, data])

  const table = useReactTable({
    data: filteredData as Invoice[],
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
      { id: '5', unitNumber: 'Unit 301', propertyId: '2', propertyName: 'Sunset Apartments' },
      { id: '6', unitNumber: 'Unit 401', propertyId: '2', propertyName: 'Sunset Apartments' }
    ],
    []
  )

  const tenants = useMemo(
    () => [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        roomNo: 'Unit 101',
        propertyName: 'Xorla House',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        roomNo: 'Unit 102',
        propertyName: 'Xorla House',
        avatar:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
      },
      {
        id: 3,
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        roomNo: 'Unit 201',
        propertyName: 'Xorla House'
      },
      {
        id: 4,
        name: 'Sarah Williams',
        email: 'sarah.williams@example.com',
        roomNo: 'Unit 301',
        propertyName: 'Sunset Apartments'
      },
      {
        id: 5,
        name: 'David Brown',
        email: 'david.brown@example.com',
        roomNo: 'Unit 202',
        propertyName: 'Xorla House'
      }
    ],
    []
  )

  return (
    <>
      <Card>
        <CardContent className='flex justify-between flex-col sm:flex-row gap-4 flex-wrap items-start sm:items-center'>
          <Button
            variant='contained'
            startIcon={<i className='ri-add-line' />}
            className='max-sm:is-full'
            onClick={() => setAddInvoiceOpen(true)}
          >
            Create Invoice
          </Button>
          <div className='flex items-center flex-col sm:flex-row max-sm:is-full gap-4'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search Invoice'
              className='max-sm:is-full min-is-[250px]'
            />
            <FormControl fullWidth size='small' className='max-sm:is-full min-is-[175px]'>
              <InputLabel id='status-select'>Invoice Status</InputLabel>
              <Select
                fullWidth
                id='select-status'
                value={status}
                onChange={e => setStatus(e.target.value)}
                label='Invoice Status'
                labelId='status-select'
              >
                <MenuItem value=''>All Status</MenuItem>
                <MenuItem value='paid'>Paid</MenuItem>
                <MenuItem value='pending'>Pending</MenuItem>
                <MenuItem value='overdue'>Overdue</MenuItem>
                <MenuItem value='draft'>Draft</MenuItem>
                <MenuItem value='cancelled'>Cancelled</MenuItem>
              </Select>
            </FormControl>
          </div>
        </CardContent>
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
          onPageChange={(_, page) => {
            table.setPageIndex(page)
          }}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle className='flex items-center justify-between'>
          <span>Update Invoice Status</span>
          <IconButton size='small' onClick={() => setUpdateDialogOpen(false)}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <div className='flex flex-col gap-4 mbs-4'>
            <Typography variant='body2' color='text.secondary'>
              Invoice: <span className='font-medium text-textPrimary'>{selectedInvoice?.invoiceNumber}</span>
            </Typography>
            <div className='flex items-center gap-2'>
              <Typography variant='body2' color='text.secondary' component='span'>
                Current Status:
              </Typography>
              <Chip
                variant='tonal'
                label={selectedInvoice?.status}
                size='small'
                color={selectedInvoice ? invoiceStatusObj[selectedInvoice.status].color : 'default'}
                className='capitalize'
              />
            </div>
            <FormControl fullWidth>
              <InputLabel id='status-update-label'>New Status</InputLabel>
              <Select
                labelId='status-update-label'
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as Invoice['status'])}
                label='New Status'
              >
                {selectedInvoice &&
                  getAvailableStatuses(selectedInvoice.status).map(status => (
                    <MenuItem key={status} value={status}>
                      <div className='flex items-center gap-2'>
                        <CustomAvatar skin='light' color={invoiceStatusObj[status].color} size={20}>
                          <i className={classnames('text-sm', invoiceStatusObj[status].icon)} />
                        </CustomAvatar>
                        <span className='capitalize'>{status}</span>
                      </div>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </div>
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

      {/* Add Invoice Dialog */}
      <AddInvoiceDialog
        open={addInvoiceOpen}
        handleClose={() => setAddInvoiceOpen(false)}
        properties={properties}
        units={units}
        tenants={tenants}
        invoicesData={data}
        setData={setData}
        mode='add'
      />

      {/* Edit Invoice Dialog */}
      <AddInvoiceDialog
        open={editInvoiceOpen}
        handleClose={() => {
          setEditInvoiceOpen(false)
          setSelectedInvoiceForEdit(null)
        }}
        properties={properties}
        units={units}
        tenants={tenants}
        invoicesData={data}
        setData={setData}
        mode='edit'
        editData={
          selectedInvoiceForEdit
            ? {
                id: selectedInvoiceForEdit.id,
                invoiceNumber: selectedInvoiceForEdit.invoiceNumber,
                tenantName: selectedInvoiceForEdit.tenantName,
                tenantEmail: selectedInvoiceForEdit.tenantEmail,
                propertyName: selectedInvoiceForEdit.propertyName,
                unitName: selectedInvoiceForEdit.unitName,
                amount: selectedInvoiceForEdit.amount,
                issuedDate: selectedInvoiceForEdit.issuedDate,
                dueDate: selectedInvoiceForEdit.dueDate,
                status: selectedInvoiceForEdit.status,
                balance: selectedInvoiceForEdit.balance
              }
            : null
        }
      />
    </>
  )
}

export default InvoicesListTable
