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
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
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
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Component Imports
import RowActions from '@components/table/RowActions'
import PageBanner from '@components/banner/PageBanner'
import AgreementsStatsCard from './AgreementsStatsCard'
import CustomAvatar from '@core/components/mui/Avatar'
import AddAgreementDialog from './AddAgreementDialog'
import ViewAgreementDialog from './ViewAgreementDialog'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'

// API Imports
import {
  getAgreements,
  deleteAgreement,
  updateAgreementStatus,
  exportAgreementsCsv,
  renewAgreement,
  terminateAgreement,
  type Agreement,
  type AgreementStatus
} from '@/lib/api/agreements'

// Auth Imports
import { useAuth } from '@/contexts/AuthContext'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { formatCurrency } from '@/utils/currency'

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

type AgreementWithAction = Agreement & { action?: string }

const columnHelper = createColumnHelper<AgreementWithAction>()

const agreementStatusObj: Record<AgreementStatus, { label: string; color: 'success' | 'warning' | 'info' | 'error' }> = {
  ACTIVE:     { label: 'Active',     color: 'success' },
  PENDING:    { label: 'Pending',    color: 'info'    },
  EXPIRED:    { label: 'Expired',    color: 'warning' },
  TERMINATED: { label: 'Terminated', color: 'error'   }
}

const agreementTypeObj: Record<string, { label: string; color: 'primary' | 'info' | 'secondary' }> = {
  LEASE:    { label: 'Lease',    color: 'primary'   },
  CONTRACT: { label: 'Contract', color: 'info'      },
  OTHER:    { label: 'Other',    color: 'secondary' }
}

const AgreementsListTable = () => {
  const { user } = useAuth()
  const isOccupant = user?.userType === 'OCCUPANT'

  const [data, setData] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [editAgreement, setEditAgreement] = useState<Agreement | null>(null)
  const [viewAgreement, setViewAgreement] = useState<Agreement | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<AgreementStatus | ''>('')
  const [statusUpdating, setStatusUpdating] = useState(false)

  // ── Renewal workflow (gap #5) ──────────────────────────────────────────────
  const [renewFor, setRenewFor]           = useState<Agreement | null>(null)
  const [renewStartDate, setRenewStartDate] = useState('')
  const [renewEndDate, setRenewEndDate]   = useState('')
  const [renewRent, setRenewRent]         = useState('')
  const [renewNotes, setRenewNotes]       = useState('')
  const [terminateFor, setTerminateFor] = useState<Agreement | null>(null)
  const [terminateNotes, setTerminateNotes] = useState('')
  const [decisionBusy, setDecisionBusy]     = useState(false)
  const [decisionError, setDecisionError]   = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true)
    setApiError(null)
    const params: { status?: string; type?: string; occupantId?: string } = {}

    if (statusFilter) params.status = statusFilter
    if (typeFilter) params.type = typeFilter
    if (isOccupant && user?.id) params.occupantId = user.id
    getAgreements(params)
      .then(setData)
      .catch(err => setApiError(err?.message ?? 'Failed to load agreements'))
      .finally(() => setLoading(false))
  }, [statusFilter, typeFilter, isOccupant, user?.id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSaved = (agreement: Agreement) => {
    setData(prev => {
      const idx = prev.findIndex(a => a.id === agreement.id)

      
return idx >= 0 ? prev.map(a => a.id === agreement.id ? agreement : a) : [agreement, ...prev]
    })
  }

  const handleDeleteConfirm = async () => {
    if (!selectedAgreement) return
    setDeleting(true)

    try {
      await deleteAgreement(selectedAgreement.id)
      setData(prev => prev.filter(a => a.id !== selectedAgreement.id))
      setDeleteOpen(false)
      setSelectedAgreement(null)
    } catch (err: any) {
      // Rethrow: ConfirmationDialog awaits this and reports the outcome.
      // Swallowing it makes the dialog announce a success that did not happen.
      throw err instanceof Error ? err : new Error(err?.message ?? 'Failed to delete agreement')
    } finally {
      setDeleting(false)
    }
  }

  const handleRenewConfirm = async () => {
    if (!renewFor || !renewEndDate) return
    setDecisionBusy(true)
    setDecisionError(null)

    try {
      const successor = await renewAgreement(renewFor.id, {
        startDate: renewStartDate || undefined,
        endDate: renewEndDate,
        rent: renewRent ? Number(renewRent) : undefined,
        notes: renewNotes || undefined
      })


      // The predecessor is now RENEWED; the successor is a brand-new PENDING agreement.
      setData(prev => [
        successor,
        ...prev.map(a => (a.id === renewFor.id ? { ...a, renewalDecision: 'RENEWED' as const } : a))
      ])
      setRenewFor(null)
      setRenewStartDate(''); setRenewEndDate(''); setRenewRent(''); setRenewNotes('')
    } catch (err: any) {
      setDecisionError(err?.response?.data?.message ?? err?.message ?? 'Failed to renew agreement')
    } finally {
      setDecisionBusy(false)
    }
  }

  const handleTerminateConfirm = async () => {
    if (!terminateFor) return
    setDecisionBusy(true)
    setDecisionError(null)

    try {
      const updated = await terminateAgreement(terminateFor.id, terminateNotes || undefined)

      setData(prev => prev.map(a => (a.id === updated.id ? updated : a)))
      setTerminateFor(null)
      setTerminateNotes('')
    } catch (err: any) {
      setDecisionError(err?.response?.data?.message ?? err?.message ?? 'Failed to terminate agreement')
    } finally {
      setDecisionBusy(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedAgreement || !pendingStatus) return
    setStatusUpdating(true)

    try {
      const updated = await updateAgreementStatus(selectedAgreement.id, pendingStatus)

      handleSaved(updated)
      setStatusUpdateOpen(false)
      setSelectedAgreement(null)
      setPendingStatus('')
    } catch (err: any) {
      setApiError(err?.message ?? 'Failed to update status')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)

    try {
      await exportAgreementsCsv()
    } catch (err: any) {
      setApiError(err?.message ?? 'Failed to export agreements')
    } finally {
      setExporting(false)
    }
  }

  const columns = useMemo<ColumnDef<AgreementWithAction, any>[]>(
    () => [
      ...(!isOccupant ? [columnHelper.display({
        id: 'select',
        header: ({ table }: any) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }: any) => (
          <Checkbox checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
        )
      })] : []),
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
        cell: ({ row }) => {
          const t = agreementTypeObj[row.original.type] ?? { label: row.original.type, color: 'default' }

          
return <Chip variant='tonal' label={t.label} size='small' color={t.color} />
        }
      }),
      columnHelper.accessor('occupantName', {
        header: 'OCCUPANT',
        cell: ({ row }) => {
          const name = row.original.occupantName ?? '—'

          
return (
            <div className='flex items-center gap-3'>
              <CustomAvatar skin='light' color='primary' size={34}>
                {getInitials(name)}
              </CustomAvatar>
              <Typography color='text.primary' className='font-medium'>
                {name}
              </Typography>
            </div>
          )
        }
      }),
      columnHelper.accessor('propertyName', {
        header: 'PROPERTY / UNIT',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.propertyName ?? '—'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {row.original.unitNo ?? ''}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => {
          const s = agreementStatusObj[row.original.status] ?? { label: row.original.status, color: 'default' }
          const decision = row.original.renewalDecision

          return (
            <div className='flex items-center gap-1'>
              <Chip variant='tonal' label={s.label} size='small' color={s.color} />
              {decision && (
                <Chip
                  variant='tonal'
                  size='small'
                  label={decision === 'RENEWED' ? 'Renewed' : 'Terminated'}
                  color={decision === 'RENEWED' ? 'success' : 'error'}
                />
              )}
            </div>
          )
        }
      }),
      columnHelper.accessor('startDate', {
        header: 'START',
        cell: ({ row }) => (
          <Typography>{row.original.startDate ? new Date(row.original.startDate).toLocaleDateString() : '—'}</Typography>
        )
      }),
      columnHelper.accessor('endDate', {
        header: 'END',
        cell: ({ row }) => (
          <Typography>{row.original.endDate ? new Date(row.original.endDate).toLocaleDateString() : '—'}</Typography>
        )
      }),
      columnHelper.accessor('totalAmount', {
        header: 'AMOUNT',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.totalAmount != null || row.original.rent != null
              ? formatCurrency(row.original.totalAmount ?? row.original.rent ?? undefined)
              : '—'}
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
                menuItemProps: { onClick: () => setViewAgreement(row.original) }
              },
              ...(!isOccupant ? [
                {
                  text: 'Edit',
                  icon: 'ri-pencil-line',
                  menuItemProps: {
                    onClick: () => setEditAgreement(row.original)
                  }
                },
                {
                  text: 'Update Status',
                  icon: 'ri-refresh-line',
                  menuItemProps: {
                    onClick: () => {
                      setSelectedAgreement(row.original)
                      setStatusUpdateOpen(true)
                    }
                  }
                },

                // Renew / Terminate only while no decision has been recorded yet
                ...(!row.original.renewalDecision ? [
                  {
                    // Distinct from 'Update Status' (ri-refresh-line): the two sit next to each
                    // other in the overflow menu, where a repeated icon reads as a duplicate row.
                    text: 'Renew',
                    icon: 'ri-restart-line',
                    menuItemProps: {
                      onClick: () => {
                        setRenewFor(row.original)
                        setRenewStartDate('')
                        setRenewEndDate('')
                        setRenewRent('')
                        setRenewNotes('')
                        setDecisionError(null)
                      }
                    }
                  },
                  {
                    text: 'Terminate',
                    icon: 'ri-close-circle-line',
                    menuItemProps: {
                      onClick: () => {
                        setTerminateFor(row.original)
                        setTerminateNotes('')
                        setDecisionError(null)
                      }
                    }
                  }
                ] : []),
                {
                  text: 'Delete',
                  icon: 'ri-delete-bin-line',
                  menuItemProps: {
                    onClick: () => {
                      setSelectedAgreement(row.original)
                      setDeleteOpen(true)
                    }
                  }
                }
              ] : [])
            ]}
          />
        )
      })
    ],
    [isOccupant]
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

  // Next valid status options
  const statusOptions = useMemo<AgreementStatus[]>(() => {
    if (!selectedAgreement) return []
    const current = selectedAgreement.status

    const transitions: Record<string, AgreementStatus[]> = {
      PENDING:    ['ACTIVE', 'TERMINATED'],
      ACTIVE:     ['EXPIRED', 'TERMINATED'],
      EXPIRED:    ['TERMINATED'],
      TERMINATED: []
    }

    
return transitions[current] ?? []
  }, [selectedAgreement])

  return (
    <>
      <PageBanner
        title='Agreements Overview'
        description='Manage and view all your agreements in one place'
        icon='ri-file-contract-line'
      />
      <AgreementsStatsCard />

      <Card className='mbs-6'>
        <CardHeader
          title='Agreements List'
          action={
            <div className='flex items-center gap-2'>
              <RowActions options={['Refresh', 'Share']} />
            </div>
          }
        />
        <CardContent className='flex flex-col gap-4'>
          {apiError && <Alert severity='error'>{apiError}</Alert>}

          {/* Filters */}
          <Box className='flex flex-col gap-4 p-4 rounded-lg'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-center gap-2'>
              <TextField
                select
                size='small'
                label='Type'
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value=''>All Types</MenuItem>
                <MenuItem value='LEASE'>Lease</MenuItem>
                <MenuItem value='CONTRACT'>Contract</MenuItem>
                <MenuItem value='OTHER'>Other</MenuItem>
              </TextField>
              <TextField
                select
                size='small'
                label='Status'
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value=''>All Status</MenuItem>
                <MenuItem value='ACTIVE'>Active</MenuItem>
                <MenuItem value='PENDING'>Pending</MenuItem>
                <MenuItem value='EXPIRED'>Expired</MenuItem>
                <MenuItem value='TERMINATED'>Terminated</MenuItem>
              </TextField>
            </div>
            <Divider />
            <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
              <TextField
                size='small'
                placeholder='Search'
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                className='w-full sm:min-w-[200px]'
              />
              <div className='flex items-center gap-2 sm:ml-auto'>
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
                <Button
                  variant='outlined'
                  size='small'
                  startIcon={exporting ? <CircularProgress size={14} /> : <i className='ri-upload-2-line' />}
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? 'Exporting…' : 'Export'}
                </Button>
                {!isOccupant && (
                  <Button
                    variant='contained'
                    color='primary'
                    size='small'
                    startIcon={<i className='ri-add-line' />}
                    onClick={() => setAddOpen(true)}
                  >
                    Add Agreement
                  </Button>
                )}
              </div>
            </div>
          </Box>

          {/* Table */}
          <div className={`overflow-x-auto ${tableStyles.scrollShadow}`}>
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
              {loading ? (
                <tbody>
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center py-8'>
                      <CircularProgress size={28} />
                    </td>
                  </tr>
                </tbody>
              ) : table.getFilteredRowModel().rows.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center py-8'>
                      No agreements found
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
          </div>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component='div'
            className='border-bs'
            count={table.getFilteredRowModel().rows.length}
            rowsPerPage={table.getState().pagination.pageSize}
            page={table.getState().pagination.pageIndex}
            SelectProps={{ inputProps: { 'aria-label': 'rows per page' } }}
            onPageChange={(_, page) => table.setPageIndex(page)}
            onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
          />
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <AddAgreementDialog
        open={addOpen || editAgreement !== null}
        handleClose={() => { setAddOpen(false); setEditAgreement(null) }}
        editAgreement={editAgreement}
        onSaved={handleSaved}
      />

      {/* View Dialog */}
      <ViewAgreementDialog
        open={viewAgreement !== null}
        handleClose={() => setViewAgreement(null)}
        agreement={viewAgreement}
        renewedFromNumber={
          viewAgreement?.previousAgreementId
            ? (data.find(a => a.id === viewAgreement.previousAgreementId)?.agreementNumber ?? null)
            : null
        }
        renewedToNumber={
          viewAgreement
            ? (data.find(a => a.previousAgreementId === viewAgreement.id)?.agreementNumber ?? null)
            : null
        }
      />

      {/* Status Update Dialog */}
      <Dialog
        open={statusUpdateOpen && selectedAgreement !== null}
        onClose={() => { if (!statusUpdating) { setStatusUpdateOpen(false); setPendingStatus('') } }}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Update Status{selectedAgreement ? ` — ${selectedAgreement.agreementNumber}` : ''}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            select
            fullWidth
            size='small'
            label='New Status'
            value={pendingStatus}
            onChange={e => setPendingStatus(e.target.value as AgreementStatus)}
          >
            <MenuItem value=''>Select status</MenuItem>
            {statusOptions.map(s => (
              <MenuItem key={s} value={s}>
                {agreementStatusObj[s]?.label ?? s}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button
            variant='outlined'
            onClick={() => { setStatusUpdateOpen(false); setPendingStatus('') }}
            disabled={statusUpdating}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleStatusUpdate}
            disabled={!pendingStatus || statusUpdating}
            startIcon={statusUpdating ? <CircularProgress size={16} color='inherit' /> : undefined}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        setOpen={setDeleteOpen}
        type='delete-tenant'
        onConfirm={handleDeleteConfirm}
      />

      {/* ── Renew Agreement ─────────────────────────────────────────────── */}
      <Dialog open={!!renewFor} onClose={() => !decisionBusy && setRenewFor(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Renew Agreement</DialogTitle>
        <DialogContent>
          <div className='flex flex-col gap-4 mbs-2'>
            {decisionError && <Alert severity='error' onClose={() => setDecisionError(null)}>{decisionError}</Alert>}
            <Typography variant='body2' color='text.secondary'>
              Creates a new agreement for {renewFor?.occupantName ?? 'this occupant'} linked to{' '}
              {renewFor?.agreementNumber}. Leave the start date blank to begin the day after the
              current agreement ends.
            </Typography>
            <TextField
              size='small' fullWidth type='date' label='New Start Date (optional)'
              InputLabelProps={{ shrink: true }}
              helperText='Leave blank to start the day after the current agreement ends'
              value={renewStartDate}
              onChange={e => setRenewStartDate(e.target.value)}
            />
            <TextField
              size='small' fullWidth required type='date' label='New End Date'
              InputLabelProps={{ shrink: true }}
              value={renewEndDate}
              onChange={e => setRenewEndDate(e.target.value)}
            />
            <TextField
              size='small' fullWidth type='number' label='New Rent (optional)'
              placeholder={renewFor?.rent != null ? String(renewFor.rent) : ''}
              helperText='Leave blank to keep the current rent'
              value={renewRent}
              onChange={e => setRenewRent(e.target.value)}
            />
            <TextField
              size='small' fullWidth multiline rows={2} label='Notes (optional)'
              value={renewNotes}
              onChange={e => setRenewNotes(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions className='gap-2 pbs-4'>
          <Button variant='outlined' color='secondary' onClick={() => setRenewFor(null)} disabled={decisionBusy}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleRenewConfirm}
            disabled={!renewEndDate || decisionBusy}
            startIcon={decisionBusy ? <CircularProgress size={16} color='inherit' /> : <i className='ri-refresh-line' />}
          >
            {decisionBusy ? 'Renewing…' : 'Renew'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Terminate Agreement ─────────────────────────────────────────── */}
      <Dialog open={!!terminateFor} onClose={() => !decisionBusy && setTerminateFor(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Terminate Agreement</DialogTitle>
        <DialogContent>
          <div className='flex flex-col gap-4 mbs-2'>
            {decisionError && <Alert severity='error' onClose={() => setDecisionError(null)}>{decisionError}</Alert>}
            <Typography variant='body2' color='text.secondary'>
              Marks {terminateFor?.agreementNumber} as terminated and sends the occupant a termination
              notice. This cannot be undone.
            </Typography>
            <TextField
              size='small' fullWidth multiline rows={3} label='Reason / notes (optional)'
              value={terminateNotes}
              onChange={e => setTerminateNotes(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions className='gap-2 pbs-4'>
          <Button variant='outlined' color='secondary' onClick={() => setTerminateFor(null)} disabled={decisionBusy}>
            Cancel
          </Button>
          <Button
            variant='contained' color='error'
            onClick={handleTerminateConfirm}
            disabled={decisionBusy}
            startIcon={decisionBusy ? <CircularProgress size={16} color='inherit' /> : <i className='ri-close-circle-line' />}
          >
            {decisionBusy ? 'Terminating…' : 'Terminate'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AgreementsListTable
