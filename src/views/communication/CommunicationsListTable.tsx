'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback } from 'react'

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
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'
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
import type { CommunicationType } from '@/types/communication/communicationTypes'

// API Imports
import {
  getCommunications,
  deleteCommunication,
  type CommunicationItem
} from '@/lib/api/communications'
import { getProperties } from '@/lib/api/properties'
import { getAllUnits } from '@/lib/api/units'
import { getOccupants } from '@/lib/api/occupants'
import { getStoredTenantId } from '@/lib/api/storage'

// Component Imports
import RowActions from '@components/table/RowActions'
import PageBanner from '@components/banner/PageBanner'
import CustomAvatar from '@core/components/mui/Avatar'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import AddMessageDialog from './AddMessageDialog'
import ViewCommunicationDialog from './ViewCommunicationDialog'
import SendNoticeDialog from './SendNoticeDialog'
import ReplyDialog from './ReplyDialog'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return `${date.getDate()} ${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`
}

function apiToDisplay(item: CommunicationItem): CommunicationType {
  return {
    id: item.id,
    subject: item.subject,
    from: item.from,
    to: item.to,
    message: item.message,
    date: item.date,
    type: item.type as CommunicationType['type'],
    status: item.status as CommunicationType['status'],
    propertyId: item.propertyId,
    propertyName: item.propertyName,
    unitId: item.unitId,
    unitNo: item.unitNo,
    occupantId: item.occupantId,
    tenantName: item.occupantName
  }
}

// ---------------------------------------------------------------------------
// Shared sub-types for dialog props
// ---------------------------------------------------------------------------

type DialogProperty = { id: string; name: string }
type DialogUnit    = { id: string; unitNumber: string; propertyId: string; propertyName: string }
type DialogTenant  = { id: string; name: string; email?: string; propertyId?: string; unitId?: string }

// ---------------------------------------------------------------------------
// Debounced search input
// ---------------------------------------------------------------------------

declare module '@tanstack/table-core' {
  interface FilterFns { fuzzy: FilterFn<unknown> }
  interface FilterMeta { itemRank: RankingInfo }
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
    const timeout = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// ---------------------------------------------------------------------------
// Type + status config
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<string, { color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'; icon: string }> = {
  email:        { color: 'primary', icon: 'ri-mail-line' },
  sms:          { color: 'success', icon: 'ri-message-2-line' },
  notification: { color: 'info',    icon: 'ri-notification-line' },
  message:      { color: 'warning', icon: 'ri-chat-3-line' }
}

const STATUS_CONFIG: Record<string, { color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary' }> = {
  sent:      { color: 'info' },
  delivered: { color: 'success' },
  read:      { color: 'primary' },
  failed:    { color: 'error' }
}

type CommunicationTypeWithAction = CommunicationType & { action?: string }

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CommunicationsListTable = () => {
  // ---- Data state ----
  const [data, setData] = useState<CommunicationType[]>([])
  const [loading, setLoading] = useState(true)

  // ---- Lookup data for dialogs ----
  const [properties, setProperties] = useState<DialogProperty[]>([])
  const [units, setUnits]           = useState<DialogUnit[]>([])
  const [tenants, setTenants]       = useState<DialogTenant[]>([])

  // ---- Table state ----
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedType,   setSelectedType]   = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  // ---- Dialog state ----
  const [addMessageOpen,         setAddMessageOpen]         = useState(false)
  const [viewCommunicationOpen,  setViewCommunicationOpen]  = useState(false)
  const [communicationToView,    setCommunicationToView]    = useState<CommunicationType | null>(null)
  const [replyOpen,              setReplyOpen]              = useState(false)
  const [communicationToReply,   setCommunicationToReply]   = useState<CommunicationType | null>(null)
  const [sendNoticeOpen,         setSendNoticeOpen]         = useState(false)
  const [noticeRecipient,        setNoticeRecipient]        = useState<{ propertyId?: string; unitId?: string } | null>(null)
  const [deleteOpen,             setDeleteOpen]             = useState(false)
  const [selectedCommunication,  setSelectedCommunication]  = useState<CommunicationType | null>(null)

  // ---- Fetch communications ----
  const fetchCommunications = useCallback(async () => {
    setLoading(true)
    try {
      const raw = await getCommunications()
      const items = Array.isArray(raw) ? raw : []
      setData(items.map(apiToDisplay))
    } catch (err) {
      console.error('Failed to load communications:', err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  // ---- Fetch lookup data (properties, units, occupants) ----
  useEffect(() => {
    const tenantId = getStoredTenantId()
    if (!tenantId) return

    Promise.all([
      getProperties(tenantId, { size: 500 }).catch(() => ({ data: [] })),
      getAllUnits(tenantId, { size: 500 }).catch(() => ({ data: [] })),
      getOccupants(tenantId, { size: 500 }).catch(() => ({ data: null }))
    ]).then(([propRes, unitRes, occRes]) => {
      const props = (propRes.data ?? []) as any[]
      setProperties(props.map(p => ({ id: p.id, name: p.name })))

      const unitList = (unitRes.data ?? []) as any[]
      setUnits(unitList.map(u => ({
        id:          u.id,
        unitNumber:  u.unitNo,
        propertyId:  u.propertyId,
        propertyName: u.propertyName ?? ''
      })))

      const occList = ((occRes as any).data ?? []) as any[]
      setTenants(occList.map((o: any) => ({
        id:         o.id,
        name:       `${o.firstName ?? ''} ${o.lastName ?? ''}`.trim(),
        email:      o.email,
        propertyId: o.propertyId ?? undefined,
        unitId:     o.unitId ?? undefined
      })))
    })
  }, [])

  useEffect(() => { fetchCommunications() }, [fetchCommunications])

  // ---- Filtered data ----
  const filteredData = useMemo(() => {
    let result = data
    if (selectedType)   result = result.filter(c => c.type === selectedType)
    if (selectedStatus) result = result.filter(c => c.status === selectedStatus)
    return result
  }, [data, selectedType, selectedStatus])

  // ---- Columns ----
  const columnHelper = createColumnHelper<CommunicationTypeWithAction>()

  const columns = useMemo<ColumnDef<CommunicationTypeWithAction, any>[]>(() => [
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
        const { pageIndex, pageSize } = table.getState().pagination
        return <Typography>{pageIndex * pageSize + row.index + 1}.</Typography>
      }
    }),
    columnHelper.accessor('subject', {
      header: 'Subject',
      cell: ({ row }) => (
        <Typography color='text.primary' className='font-medium max-w-[200px] truncate'>
          {row.original.subject || '-'}
        </Typography>
      )
    }),
    columnHelper.accessor('from', {
      header: 'From',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <CustomAvatar skin='light' size={28}>
            {getInitials(row.original.from)}
          </CustomAvatar>
          <Typography color='text.primary' className='font-medium'>{row.original.from || '-'}</Typography>
        </div>
      )
    }),
    columnHelper.accessor('to', {
      header: 'To',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <CustomAvatar skin='light' size={28}>
            {getInitials(row.original.to)}
          </CustomAvatar>
          <Typography color='text.primary' className='font-medium'>{row.original.to || '-'}</Typography>
        </div>
      )
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: ({ row }) => {
        const cfg = TYPE_CONFIG[row.original.type] ?? { color: 'secondary', icon: 'ri-file-line' }
        return (
          <Chip
            variant='tonal' label={row.original.type} size='small'
            color={cfg.color} icon={<i className={cfg.icon} />} className='capitalize'
          />
        )
      }
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => {
        const cfg = STATUS_CONFIG[row.original.status] ?? { color: 'secondary' }
        return <Chip variant='tonal' label={row.original.status} size='small' color={cfg.color} className='capitalize' />
      }
    }),
    columnHelper.accessor('date', {
      header: 'Date',
      cell: ({ row }) => <Typography color='text.primary'>{formatDate(row.original.date)}</Typography>
    }),
    columnHelper.display({
      id: 'action',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }) => (
        <RowActions
          iconButtonProps={{ size: 'small' }}
          options={[
            {
              text: 'View',
              icon: 'ri-eye-line',
              menuItemProps: {
                onClick: () => { setCommunicationToView(row.original); setViewCommunicationOpen(true) }
              }
            },
            {
              text: 'Reply',
              icon: 'ri-reply-line',
              menuItemProps: {
                onClick: () => { setCommunicationToReply(row.original); setReplyOpen(true) }
              }
            },
            {
              text: 'Send Notice',
              icon: 'ri-notification-line',
              menuItemProps: {
                onClick: () => {
                  setNoticeRecipient({
                    propertyId: row.original.propertyId,
                    unitId:     row.original.unitId
                  })
                  setSendNoticeOpen(true)
                }
              }
            },
            {
              text: 'Delete',
              icon: 'ri-delete-bin-line',
              menuItemProps: {
                onClick: () => { setSelectedCommunication(row.original); setDeleteOpen(true) }
              }
            }
          ]}
        />
      )
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [])

  const table = useReactTable({
    data: filteredData,
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

  // ---- Delete handler ----
  const handleConfirmDelete = async () => {
    if (!selectedCommunication) return

    const idsToDelete = Object.keys(rowSelection).length > 0
      ? Object.keys(rowSelection).map(key => filteredData[parseInt(key)]?.id).filter(Boolean) as string[]
      : [selectedCommunication.id]

    await Promise.allSettled(idsToDelete.map(id => deleteCommunication(id)))
    setRowSelection({})
    setDeleteOpen(false)
    setSelectedCommunication(null)
    fetchCommunications()
  }

  // ---- Render ----
  return (
    <>
      <PageBanner
        title='Communication'
        description='Manage all communications with tenants and property managers'
        icon='ri-message-3-line'
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Communications List'
          action={
            <div className='flex items-center gap-2'>
              {Object.keys(rowSelection).length > 0 && (
                <Button
                  variant='outlined' color='error'
                  startIcon={<i className='ri-delete-bin-line' />}
                  onClick={() => {
                    const first = filteredData[parseInt(Object.keys(rowSelection)[0])]
                    if (first) { setSelectedCommunication(first); setDeleteOpen(true) }
                  }}
                >
                  Delete Selected ({Object.keys(rowSelection).length})
                </Button>
              )}
              <Button
                variant='outlined' color='secondary'
                startIcon={<i className='ri-notification-line' />}
                onClick={() => { setNoticeRecipient(null); setSendNoticeOpen(true) }}
              >
                Send Notice
              </Button>
              <Button
                variant='contained' color='primary'
                startIcon={<i className='ri-add-line' />}
                onClick={() => setAddMessageOpen(true)}
              >
                New Message
              </Button>
              <RowActions options={['Refresh', 'Share']} />
            </div>
          }
        />
        <Divider />
        <CardContent className='flex flex-col gap-4'>
          {/* Filters */}
          <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
            <div className='flex flex-wrap gap-4 items-center'>
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Type</InputLabel>
                <Select value={selectedType} onChange={e => setSelectedType(e.target.value)} label='Type'>
                  <MenuItem value=''>All Types</MenuItem>
                  <MenuItem value='email'>Email</MenuItem>
                  <MenuItem value='sms'>SMS</MenuItem>
                  <MenuItem value='notification'>Notification</MenuItem>
                  <MenuItem value='message'>Message</MenuItem>
                </Select>
              </FormControl>
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} label='Status'>
                  <MenuItem value=''>All Status</MenuItem>
                  <MenuItem value='sent'>Sent</MenuItem>
                  <MenuItem value='delivered'>Delivered</MenuItem>
                  <MenuItem value='read'>Read</MenuItem>
                  <MenuItem value='failed'>Failed</MenuItem>
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
          {loading ? (
            <Box className='flex flex-col gap-2'>
              {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} variant='rectangular' height={44} />)}
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
                              {{ asc: <i className='ri-arrow-up-s-line text-xl' />, desc: <i className='ri-arrow-down-s-line text-xl' /> }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
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
                      <td colSpan={table.getVisibleFlatColumns().length} className='text-center py-8'>
                        <Typography color='text.secondary'>No communications found</Typography>
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
          )}

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

      {/* Add Message Dialog */}
      <AddMessageDialog
        open={addMessageOpen}
        handleClose={() => setAddMessageOpen(false)}
        onSuccess={fetchCommunications}
        properties={properties}
        units={units}
        tenants={tenants}
      />

      {/* View Dialog */}
      <ViewCommunicationDialog
        open={viewCommunicationOpen}
        setOpen={setViewCommunicationOpen}
        communication={communicationToView}
        onReply={() => {
          if (communicationToView) {
            setCommunicationToReply(communicationToView)
            setViewCommunicationOpen(false)
            setReplyOpen(true)
          }
        }}
        onSendNotice={() => {
          if (communicationToView) {
            setNoticeRecipient({ propertyId: communicationToView.propertyId, unitId: communicationToView.unitId })
            setViewCommunicationOpen(false)
            setSendNoticeOpen(true)
          }
        }}
      />

      {/* Reply Dialog */}
      <ReplyDialog
        open={replyOpen}
        setOpen={setReplyOpen}
        communication={communicationToReply}
        onSuccess={fetchCommunications}
      />

      {/* Send Notice Dialog */}
      <SendNoticeDialog
        open={sendNoticeOpen}
        setOpen={setSendNoticeOpen}
        onSuccess={fetchCommunications}
        properties={properties}
        units={units}
        tenants={tenants}
        initialPropertyId={noticeRecipient?.propertyId}
        initialUnitId={noticeRecipient?.unitId}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        setOpen={setDeleteOpen}
        type='delete-communication'
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}

export default CommunicationsListTable
