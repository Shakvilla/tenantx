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
import type { CommunicationType } from '@/types/communication/communicationTypes'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import PageBanner from '@components/banner/PageBanner'
import CustomAvatar from '@core/components/mui/Avatar'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import AddMessageDialog from './AddMessageDialog'
import ViewCommunicationDialog from './ViewCommunicationDialog'
import SendNoticeDialog from './SendNoticeDialog'
import ReplyDialog from './ReplyDialog'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const day = date.getDate()
  const month = date.toLocaleString('en-US', { month: 'long' })
  const year = date.getFullYear()

  
return `${day} ${month} ${year}`
}

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

type CommunicationTypeWithAction = CommunicationType & {
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

// Sample properties and units for notice dialog
const sampleProperties = [
  { id: 1, name: 'A living room with mexican mansion blue' },
  { id: 2, name: 'Rendering of a modern villa' },
  { id: 3, name: 'Beautiful modern style luxury home exterior sunset' },
  { id: 4, name: 'A house with a lot of windows and a lot of plants' },
  { id: 5, name: 'Design of a modern house as mansion blue couch' },
  { id: 6, name: 'Depending on the location and design' }
]

const sampleUnits = [
  { id: 1, unitNumber: 'Unit no 1', propertyId: '5', propertyName: 'Design of a modern house as mansion blue couch' },
  { id: 2, unitNumber: 'Unit no 2', propertyId: '3', propertyName: 'Beautiful modern style luxury home exterior sunset' },
  { id: 3, unitNumber: 'Unit no 3', propertyId: '1', propertyName: 'A living room with mexican mansion blue' },
  { id: 4, unitNumber: 'Unit no 4', propertyId: '4', propertyName: 'A house with a lot of windows and a lot of plants' },
  { id: 5, unitNumber: 'Unit no 5', propertyId: '2', propertyName: 'Rendering of a modern villa' },
  { id: 6, unitNumber: 'Unit no 6', propertyId: '2', propertyName: 'Rendering of a modern villa' },
  { id: 7, unitNumber: 'Unit no 7', propertyId: '3', propertyName: 'Beautiful modern style luxury home exterior sunset' },
  { id: 8, unitNumber: 'Unit no 8', propertyId: '6', propertyName: 'Depending on the location and design' },
  { id: 9, unitNumber: 'Unit no 9', propertyId: '1', propertyName: 'A living room with mexican mansion blue' },
  { id: 10, unitNumber: 'Unit no 10', propertyId: '4', propertyName: 'A house with a lot of windows and a lot of plants' },
  { id: 11, unitNumber: 'Unit no 11', propertyId: '5', propertyName: 'Design of a modern house as mansion blue couch' },
  { id: 12, unitNumber: 'Unit no 12', propertyId: '6', propertyName: 'Depending on the location and design' }
]

// Sample data
const sampleCommunications: CommunicationType[] = [
  {
    id: 1,
    subject: 'Rent Payment Reminder',
    from: 'Property Manager',
    fromAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    to: 'Brokin Simon',
    toAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    message: 'This is a reminder that your rent payment for Unit no 3 is due on the 1st of next month.',
    date: '2024-07-15',
    type: 'email',
    status: 'read',
    propertyName: 'A living room with mexican mansion blue',
    unitNo: 'Unit no 3',
    tenantName: 'Brokin Simon'
  },
  {
    id: 2,
    subject: 'Maintenance Request Update',
    from: 'Andrew Paul',
    fromAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    to: 'Property Manager',
    message: 'The plumbing issue in Unit no 2 has been resolved. Thank you for the quick response.',
    date: '2024-07-14',
    type: 'sms',
    status: 'delivered',
    propertyName: 'Rendering of a modern villa',
    unitNo: 'Unit no 2',
    tenantName: 'Andrew Paul'
  },
  {
    id: 3,
    subject: 'Lease Renewal Notice',
    from: 'Property Manager',
    to: 'Mrtle Hale',
    toAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    message: 'Your lease for Unit no 6 is expiring in 30 days. Please contact us to discuss renewal options.',
    date: '2024-07-13',
    type: 'email',
    status: 'sent',
    propertyName: 'Beautiful modern style luxury home exterior sunset',
    unitNo: 'Unit no 6',
    tenantName: 'Mrtle Hale'
  },
  {
    id: 4,
    subject: 'Welcome to Your New Home',
    from: 'Property Manager',
    to: 'Timothy',
    toAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    message: 'Welcome to Unit no 4! We hope you enjoy your stay. If you need anything, please don\'t hesitate to contact us.',
    date: '2024-07-12',
    type: 'notification',
    status: 'read',
    propertyName: 'Design of a modern house as mansion blue couch',
    unitNo: 'Unit no 4',
    tenantName: 'Timothy'
  },
  {
    id: 5,
    subject: 'Parking Space Inquiry',
    from: 'John Doe',
    fromAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    to: 'Property Manager',
    message: 'I would like to inquire about available parking spaces for Unit no 1.',
    date: '2024-07-11',
    type: 'message',
    status: 'delivered',
    propertyName: 'A house with a lot of windows and a lot of plants',
    unitNo: 'Unit no 1',
    tenantName: 'John Doe'
  },
  {
    id: 6,
    subject: 'Utility Bill Notification',
    from: 'Property Manager',
    to: 'Jane Smith',
    toAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    message: 'Your utility bill for June has been generated. Please check your email for details.',
    date: '2024-07-10',
    type: 'email',
    status: 'read',
    propertyName: 'Depending on the location and design',
    unitNo: 'Unit no 5',
    tenantName: 'Jane Smith'
  },
  {
    id: 7,
    subject: 'Maintenance Schedule',
    from: 'Property Manager',
    to: 'Robert Johnson',
    toAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    message: 'Scheduled maintenance for Unit no 7 will take place on July 20th from 9 AM to 12 PM.',
    date: '2024-07-09',
    type: 'sms',
    status: 'sent',
    propertyName: 'A living room with mexican mansion blue',
    unitNo: 'Unit no 7',
    tenantName: 'Robert Johnson'
  },
  {
    id: 8,
    subject: 'Document Submission Reminder',
    from: 'Property Manager',
    to: 'Sarah Williams',
    toAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    message: 'Please submit your updated ID card and lease agreement documents by July 25th.',
    date: '2024-07-08',
    type: 'notification',
    status: 'read',
    propertyName: 'Rendering of a modern villa',
    unitNo: 'Unit no 8',
    tenantName: 'Sarah Williams'
  },
  {
    id: 9,
    subject: 'Noise Complaint',
    from: 'Michael Brown',
    fromAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    to: 'Property Manager',
    message: 'There has been excessive noise from the unit above. Could you please address this issue?',
    date: '2024-07-07',
    type: 'message',
    status: 'delivered',
    propertyName: 'Beautiful modern style luxury home exterior sunset',
    unitNo: 'Unit no 9',
    tenantName: 'Michael Brown'
  },
  {
    id: 10,
    subject: 'Payment Confirmation',
    from: 'Property Manager',
    to: 'Emily Davis',
    toAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    message: 'Your rent payment for July has been received. Thank you for your prompt payment.',
    date: '2024-07-06',
    type: 'email',
    status: 'read',
    propertyName: 'A house with a lot of windows and a lot of plants',
    unitNo: 'Unit no 10',
    tenantName: 'Emily Davis'
  },
  {
    id: 11,
    subject: 'Lease Agreement Review',
    from: 'David Wilson',
    fromAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    to: 'Property Manager',
    message: 'I would like to schedule a meeting to review the lease agreement terms.',
    date: '2024-07-05',
    type: 'message',
    status: 'delivered',
    propertyName: 'Design of a modern house as mansion blue couch',
    unitNo: 'Unit no 11',
    tenantName: 'David Wilson'
  },
  {
    id: 12,
    subject: 'Property Inspection Notice',
    from: 'Property Manager',
    to: 'Lisa Anderson',
    toAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    message: 'A routine property inspection is scheduled for Unit no 12 on July 22nd at 2 PM.',
    date: '2024-07-04',
    type: 'email',
    status: 'sent',
    propertyName: 'Depending on the location and design',
    unitNo: 'Unit no 12',
    tenantName: 'Lisa Anderson'
  }
]

const CommunicationsListTable = ({ tableData }: { tableData?: CommunicationType[] }) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(tableData || sampleCommunications)
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [deleteCommunicationOpen, setDeleteCommunicationOpen] = useState(false)
  const [selectedCommunication, setSelectedCommunication] = useState<CommunicationType | null>(null)
  const [addMessageOpen, setAddMessageOpen] = useState(false)
  const [viewCommunicationOpen, setViewCommunicationOpen] = useState(false)
  const [communicationToView, setCommunicationToView] = useState<CommunicationType | null>(null)
  const [sendNoticeOpen, setSendNoticeOpen] = useState(false)
  const [noticeRecipient, setNoticeRecipient] = useState<{ propertyId?: string; unitId?: string; recipient?: string } | null>(null)
  const [replyOpen, setReplyOpen] = useState(false)
  const [communicationToReply, setCommunicationToReply] = useState<CommunicationType | null>(null)

  // Filter data
  useEffect(() => {
    let filtered = data

    if (globalFilter) {
      filtered = filtered.filter(
        communication =>
          communication.subject?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          communication.from?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          communication.to?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          communication.message?.toLowerCase().includes(globalFilter.toLowerCase())
      )
    }

    if (selectedType) {
      filtered = filtered.filter(communication => communication.type === selectedType)
    }

    if (selectedStatus) {
      filtered = filtered.filter(communication => communication.status === selectedStatus)
    }

    setFilteredData(filtered)
  }, [data, globalFilter, selectedType, selectedStatus])

  // Handle delete communication
  const handleDeleteCommunication = (communicationId: number) => {
    setData(data.filter(communication => communication.id !== communicationId))
    setDeleteCommunicationOpen(false)
    setSelectedCommunication(null)
    setRowSelection({})
  }

  // Handle bulk delete
  const handleBulkDelete = () => {
    const selectedIds = Object.keys(rowSelection).map(key => filteredData[parseInt(key)]?.id).filter(Boolean) as number[]

    if (selectedIds.length > 0) {
      setData(data.filter(communication => !selectedIds.includes(communication.id)))
      setRowSelection({})
    }
  }

  const columnHelper = createColumnHelper<CommunicationTypeWithAction>()

  // Type and Status color mapping
  const communicationTypeObj: {
    [key: string]: {
      color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
      icon: string
    }
  } = {
    email: { color: 'primary', icon: 'ri-mail-line' },
    sms: { color: 'success', icon: 'ri-message-2-line' },
    notification: { color: 'info', icon: 'ri-notification-line' },
    message: { color: 'warning', icon: 'ri-chat-3-line' }
  }

  const communicationStatusObj: {
    [key: string]: {
      color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
    }
  } = {
    sent: { color: 'info' },
    delivered: { color: 'success' },
    read: { color: 'primary' },
    failed: { color: 'error' }
  }

  const columns = useMemo<ColumnDef<CommunicationTypeWithAction, any>[]>(
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
            <CustomAvatar src={row.original.fromAvatar} skin='light' size={28}>
              {getInitials(row.original.from)}
            </CustomAvatar>
            <Typography color='text.primary' className='font-medium'>
              {row.original.from || '-'}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('to', {
        header: 'To',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <CustomAvatar src={row.original.toAvatar} skin='light' size={28}>
              {getInitials(row.original.to)}
            </CustomAvatar>
            <Typography color='text.primary' className='font-medium'>
              {row.original.to || '-'}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: ({ row }) => {
          const type = row.original.type
          const typeConfig = communicationTypeObj[type] || { color: 'secondary', icon: 'ri-file-line' }

          return (
            <Chip
              variant='tonal'
              label={type}
              size='small'
              color={typeConfig.color}
              icon={<i className={typeConfig.icon} />}
              className='capitalize'
            />
          )
        }
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          const statusConfig = communicationStatusObj[status] || { color: 'secondary' }

          return (
            <Chip
              variant='tonal'
              label={status}
              size='small'
              color={statusConfig.color}
              className='capitalize'
            />
          )
        }
      }),
      columnHelper.accessor('date', {
        header: 'Date',
        cell: ({ row }) => (
          <Typography color='text.primary'>{formatDate(row.original.date) || '-'}</Typography>
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
                      setCommunicationToView(row.original)
                      setViewCommunicationOpen(true)
                    }
                  }
                },
                {
                  text: 'Reply',
                  icon: 'ri-reply-line',
                  menuItemProps: {
                    onClick: () => {
                      setCommunicationToReply(row.original)
                      setReplyOpen(true)
                    }
                  }
                },
                {
                  text: 'Send Notice',
                  icon: 'ri-notification-line',
                  menuItemProps: {
                    onClick: () => {
                      setNoticeRecipient({
                        propertyId: row.original.propertyName
                          ? sampleProperties.find(p => p.name === row.original.propertyName)?.id.toString()
                          : undefined,
                        unitId: row.original.unitNo
                          ? sampleUnits.find(u => u.unitNumber === row.original.unitNo)?.id.toString()
                          : undefined,
                        recipient: row.original.to
                      })
                      setSendNoticeOpen(true)
                    }
                  }
                },
                {
                  text: 'Delete',
                  icon: 'ri-delete-bin-line',
                  menuItemProps: {
                    onClick: () => {
                      setSelectedCommunication(row.original)
                      setDeleteCommunicationOpen(true)
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
                  variant='outlined'
                  color='error'
                  startIcon={<i className='ri-delete-bin-line' />}
                  onClick={() => {
                    const selectedIds = Object.keys(rowSelection)
                      .map(key => filteredData[parseInt(key)]?.id)
                      .filter(Boolean) as number[]

                    if (selectedIds.length > 0) {
                      setSelectedCommunication({ id: selectedIds[0] } as CommunicationType)
                      setDeleteCommunicationOpen(true)
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
                onClick={() => setAddMessageOpen(true)}
              >
                New Message
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

      {/* Add Message Dialog */}
      <AddMessageDialog
        open={addMessageOpen}
        handleClose={() => setAddMessageOpen(false)}
        communicationData={data}
        setData={setData}
      />

      {/* View Communication Dialog */}
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
            setNoticeRecipient({
              propertyId: communicationToView.propertyName
                ? sampleProperties.find(p => p.name === communicationToView.propertyName)?.id.toString()
                : undefined,
              unitId: communicationToView.unitNo
                ? sampleUnits.find(u => u.unitNumber === communicationToView.unitNo)?.id.toString()
                : undefined,
              recipient: communicationToView.to
            })
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
        communicationData={data}
        setData={setData}
      />

      {/* Send Notice Dialog */}
      <SendNoticeDialog
        open={sendNoticeOpen}
        setOpen={setSendNoticeOpen}
        communicationData={data}
        setData={setData}
        initialRecipient={noticeRecipient?.recipient}
        initialPropertyId={noticeRecipient?.propertyId}
        initialUnitId={noticeRecipient?.unitId}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteCommunicationOpen}
        setOpen={setDeleteCommunicationOpen}
        type='delete-communication'
        onConfirm={() => {
          if (selectedCommunication) {
            const selectedIds = Object.keys(rowSelection).length > 0
              ? (Object.keys(rowSelection)
                  .map(key => filteredData[parseInt(key)]?.id)
                  .filter(Boolean) as number[])
              : [selectedCommunication.id]

            if (selectedIds.length > 0) {
              setData(data.filter(communication => !selectedIds.includes(communication.id)))
              setRowSelection({})
            }

            setDeleteCommunicationOpen(false)
            setSelectedCommunication(null)
          }
        }}
      />
    </>
  )
}

export default CommunicationsListTable

