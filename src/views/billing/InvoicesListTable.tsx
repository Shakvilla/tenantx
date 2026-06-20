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
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'
import CircularProgress from '@mui/material/CircularProgress'
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

// API Imports
import {
  getInvoices,
  updateInvoiceStatus,
  deleteInvoice,
  type Invoice
} from '@/lib/api/invoices'

// Component Imports
import RowActions from '@components/table/RowActions'
import CustomAvatar from '@core/components/mui/Avatar'
import AddInvoiceDialog from './AddInvoiceDialog'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const formatCurrency = (amount: number, currency = 'GHS'): string => {
  const symbol = currency === 'GHS' ? '₵' : currency
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type InvoiceWithAction = Invoice & { action?: string }

type StatusConfig = {
  icon: string
  color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
}

const invoiceStatusObj: Record<string, StatusConfig> = {
  PAID:      { color: 'success',   icon: 'ri-checkbox-circle-line' },
  PENDING:   { color: 'warning',   icon: 'ri-time-line' },
  OVERDUE:   { color: 'error',     icon: 'ri-error-warning-line' },
  DRAFT:     { color: 'info',      icon: 'ri-file-edit-line' },
  CANCELLED: { color: 'secondary', icon: 'ri-close-circle-line' }
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

  useEffect(() => { setValue(initialValue) }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => { onChange(value) }, debounce)
    return () => clearTimeout(timeout)
  }, [value, debounce, onChange])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

const getAvailableStatuses = (current: string): string[] => {
  switch (current) {
    case 'DRAFT':   return ['PENDING', 'CANCELLED']
    case 'PENDING': return ['PAID', 'OVERDUE', 'CANCELLED']
    case 'OVERDUE': return ['PAID', 'CANCELLED']
    default:        return []
  }
}

const columnHelper = createColumnHelper<InvoiceWithAction>()

const InvoicesListTable = () => {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')

  // Status update dialog
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [newStatus, setNewStatus] = useState<string>('PENDING')
  const [updating, setUpdating] = useState(false)

  // Add/Edit dialog
  const [addInvoiceOpen, setAddInvoiceOpen] = useState(false)
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getInvoices(statusFilter ? { status: statusFilter } : undefined)
      setData(Array.isArray(result) ? result : [])
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const handleEditClick = useCallback((invoice: Invoice) => {
    const available = getAvailableStatuses(invoice.status)
    if (available.length > 0) {
      setSelectedInvoice(invoice)
      setNewStatus(available[0])
      setUpdateDialogOpen(true)
    }
  }, [])

  const handleStatusUpdate = async () => {
    if (!selectedInvoice) return
    setUpdating(true)
    try {
      const updated = await updateInvoiceStatus(selectedInvoice.id, newStatus)
      setData(prev => prev.map(inv => inv.id === updated.id ? updated : inv))
      setUpdateDialogOpen(false)
      setSelectedInvoice(null)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleSaved = (saved: Invoice) => {
    setData(prev => {
      const idx = prev.findIndex(i => i.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteInvoice(id)
      setData(prev => prev.filter(inv => inv.id !== id))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete invoice')
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
          const cfg = invoiceStatusObj[row.original.status] ?? { color: 'secondary', icon: 'ri-question-line' }
          const available = getAvailableStatuses(row.original.status)
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
                      Balance: {formatCurrency(row.original.balance, row.original.currency)}
                    </Typography>
                    <br />
                    <Typography variant='body2' component='span' className='text-inherit'>
                      Due: {formatDate(row.original.dueDate)}
                    </Typography>
                  </div>
                }
              >
                <CustomAvatar skin='light' color={cfg.color} size={28}>
                  <i className={classnames('text-base', cfg.icon)} />
                </CustomAvatar>
              </Tooltip>
              {available.length > 0 && (
                <IconButton size='small' onClick={() => handleEditClick(row.original)} className='text-primary'>
                  <i className='ri-edit-line text-lg' />
                </IconButton>
              )}
            </div>
          )
        }
      }),
      columnHelper.accessor('occupantName', {
        header: 'TENANT',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <CustomAvatar skin='light' size={34}>
              {getInitials(row.original.occupantName ?? 'N A')}
            </CustomAvatar>
            <div className='flex flex-col'>
              <Typography className='font-medium' color='text.primary'>
                {row.original.occupantName ?? '-'}
              </Typography>
              <Typography variant='body2'>{row.original.occupantEmail ?? ''}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('propertyName', {
        header: 'PROPERTY',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography className='font-medium' color='text.primary'>
              {row.original.propertyName ?? '-'}
            </Typography>
            <Typography variant='body2'>{row.original.unitNo ?? ''}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('amount', {
        header: 'AMOUNT',
        cell: ({ row }) => (
          <Typography className='font-medium'>
            {formatCurrency(row.original.amount, row.original.currency)}
          </Typography>
        )
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
        cell: ({ row }) =>
          row.original.balance === 0 ? (
            <Chip variant='tonal' label='Paid' color='success' size='small' />
          ) : (
            <Typography color='text.primary' className='font-medium'>
              {formatCurrency(row.original.balance, row.original.currency)}
            </Typography>
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
                href: `/billing/invoices/${row.original.id}`
              },
              {
                text: 'Edit',
                icon: 'ri-pencil-line',
                menuItemProps: {
                  onClick: () => {
                    setEditInvoice(row.original)
                    setAddInvoiceOpen(true)
                  }
                }
              },
              {
                text: 'Delete',
                icon: 'ri-delete-bin-line',
                menuItemProps: {
                  onClick: () => handleDelete(row.original.id),
                  sx: { color: 'error.main' }
                }
              }
            ]}
          />
        ),
        enableSorting: false
      })
    ],
    [handleEditClick]
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { rowSelection, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
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
      <Card>
        <CardContent className='flex justify-between flex-col sm:flex-row gap-4 flex-wrap items-start sm:items-center'>
          <div className='flex items-center gap-2'>
            <Button
              variant='contained'
              startIcon={<i className='ri-add-line' />}
              className='max-sm:is-full'
              onClick={() => { setEditInvoice(null); setAddInvoiceOpen(true) }}
            >
              Create Invoice
            </Button>
            <IconButton onClick={fetchInvoices} title='Refresh'>
              <i className='ri-refresh-line' />
            </IconButton>
          </div>
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
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                label='Invoice Status'
                labelId='status-select'
              >
                <MenuItem value=''>All Status</MenuItem>
                <MenuItem value='PAID'>Paid</MenuItem>
                <MenuItem value='PENDING'>Pending</MenuItem>
                <MenuItem value='OVERDUE'>Overdue</MenuItem>
                <MenuItem value='DRAFT'>Draft</MenuItem>
                <MenuItem value='CANCELLED'>Cancelled</MenuItem>
              </Select>
            </FormControl>
          </div>
        </CardContent>

        {error && (
          <CardContent>
            <Alert severity='error' onClose={() => setError(null)}>{error}</Alert>
          </CardContent>
        )}

        <div className='overflow-x-auto'>
          {loading ? (
            <div className='p-4 flex flex-col gap-3'>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant='text' height={48} />
              ))}
            </div>
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
              {table.getFilteredRowModel().rows.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                      No invoices found
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

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          className='border-bs'
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
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
              {selectedInvoice && (
                <Chip
                  variant='tonal'
                  label={selectedInvoice.status}
                  size='small'
                  color={invoiceStatusObj[selectedInvoice.status]?.color ?? 'default'}
                />
              )}
            </div>
            <FormControl fullWidth>
              <InputLabel id='status-update-label'>New Status</InputLabel>
              <Select
                labelId='status-update-label'
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                label='New Status'
              >
                {selectedInvoice &&
                  getAvailableStatuses(selectedInvoice.status).map(s => (
                    <MenuItem key={s} value={s}>
                      <div className='flex items-center gap-2'>
                        <CustomAvatar skin='light' color={invoiceStatusObj[s]?.color ?? 'secondary'} size={20}>
                          <i className={classnames('text-sm', invoiceStatusObj[s]?.icon)} />
                        </CustomAvatar>
                        <span className='capitalize'>{s.toLowerCase()}</span>
                      </div>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions className='gap-2 pbs-4'>
          <Button variant='outlined' color='secondary' onClick={() => setUpdateDialogOpen(false)} disabled={updating}>
            Cancel
          </Button>
          <Button
            variant='contained'
            color='primary'
            onClick={handleStatusUpdate}
            disabled={updating}
            startIcon={updating ? <CircularProgress size={16} color='inherit' /> : undefined}
          >
            {updating ? 'Updating…' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Invoice Dialog */}
      <AddInvoiceDialog
        open={addInvoiceOpen}
        handleClose={() => { setAddInvoiceOpen(false); setEditInvoice(null) }}
        editInvoice={editInvoice}
        onSaved={handleSaved}
      />
    </>
  )
}

export default InvoicesListTable
