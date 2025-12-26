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
import Avatar from '@mui/material/Avatar'
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
import type { DocumentType } from '@/types/documents/documentTypes'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import PageBanner from '@components/banner/PageBanner'
import CustomAvatar from '@core/components/mui/Avatar'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import ViewDocumentDialog from './ViewDocumentDialog'
import AcceptDocumentDialog from './AcceptDocumentDialog'
import RejectDocumentDialog from './RejectDocumentDialog'

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

type DocumentTypeWithAction = DocumentType & {
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

// Sample data
const sampleDocuments: DocumentType[] = [
  {
    id: 1,
    propertyName: 'A living room with mexican mansion blue',
    propertyImage:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 3',
    tenantName: 'Brokin Simon',
    tenantAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentImage:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentType: 'ID Card',
    status: 'accepted'
  },
  {
    id: 2,
    propertyName: 'Rendering of a modern villa',
    propertyImage:
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=2148&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 2',
    tenantName: 'Andrew Paul',
    tenantAvatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentImage:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentType: 'Passport',
    status: 'rejected'
  },
  {
    id: 3,
    propertyName: 'Beautiful modern style luxury home exterior sunset',
    propertyImage:
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 6',
    tenantName: 'Mrtle Hale',
    tenantAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentImage:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentType: 'ID Card',
    status: 'accepted'
  },
  {
    id: 4,
    propertyName: 'Design of a modern house as mansion blue couch',
    propertyImage:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 4',
    tenantName: 'Timothy',
    tenantAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentImage:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentType: 'ID Card',
    status: 'accepted'
  },
  {
    id: 5,
    propertyName: 'A house with a lot of windows and a lot of plants',
    propertyImage:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 1',
    tenantName: 'John Doe',
    tenantAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentImage:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentType: 'Lease Agreement',
    status: 'pending'
  },
  {
    id: 6,
    propertyName: 'Depending on the location and design',
    propertyImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 5',
    tenantName: 'Jane Smith',
    tenantAvatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentImage:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentType: 'Passport',
    status: 'accepted'
  },
  {
    id: 7,
    propertyName: 'A living room with mexican mansion blue',
    propertyImage:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 7',
    tenantName: 'Robert Johnson',
    tenantAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentImage:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentType: 'Contract',
    status: 'rejected'
  },
  {
    id: 8,
    propertyName: 'Rendering of a modern villa',
    propertyImage:
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=2148&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 8',
    tenantName: 'Sarah Williams',
    tenantAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentImage:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentType: 'ID Card',
    status: 'pending'
  },
  {
    id: 9,
    propertyName: 'Beautiful modern style luxury home exterior sunset',
    propertyImage:
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 9',
    tenantName: 'Michael Brown',
    tenantAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentImage:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentType: 'Passport',
    status: 'accepted'
  },
  {
    id: 10,
    propertyName: 'A house with a lot of windows and a lot of plants',
    propertyImage:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 10',
    tenantName: 'Emily Davis',
    tenantAvatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentImage:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentType: 'Lease Agreement',
    status: 'accepted'
  },
  {
    id: 11,
    propertyName: 'Design of a modern house as mansion blue couch',
    propertyImage:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 11',
    tenantName: 'David Wilson',
    tenantAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentImage:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentType: 'ID Card',
    status: 'rejected'
  },
  {
    id: 12,
    propertyName: 'Depending on the location and design',
    propertyImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0',
    unitNo: 'Unit no 12',
    tenantName: 'Lisa Anderson',
    tenantAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentImage:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    documentType: 'Contract',
    status: 'accepted'
  }
]

const DocumentsListTable = ({ tableData }: { tableData?: DocumentType[] }) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(tableData || sampleDocuments)
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [selectedUnit, setSelectedUnit] = useState<string>('')
  const [deleteDocumentOpen, setDeleteDocumentOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null)
  const [viewDocumentOpen, setViewDocumentOpen] = useState(false)
  const [documentToView, setDocumentToView] = useState<DocumentType | null>(null)
  const [acceptDocumentOpen, setAcceptDocumentOpen] = useState(false)
  const [rejectDocumentOpen, setRejectDocumentOpen] = useState(false)
  const [documentToAccept, setDocumentToAccept] = useState<DocumentType | null>(null)
  const [documentToReject, setDocumentToReject] = useState<DocumentType | null>(null)

  // Get unique properties and units
  const uniqueProperties = useMemo(() => {
    const props = Array.from(new Set(data.map(d => d.propertyName).filter(Boolean)))

    
return props as string[]
  }, [data])

  const uniqueUnits = useMemo(() => {
    const units = Array.from(new Set(data.map(d => d.unitNo).filter(Boolean)))

    
return units as string[]
  }, [data])

  // Filter data
  useEffect(() => {
    let filtered = data

    if (globalFilter) {
      filtered = filtered.filter(
        document =>
          document.tenantName?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          document.propertyName?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          document.unitNo?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          document.documentType?.toLowerCase().includes(globalFilter.toLowerCase())
      )
    }

    if (selectedProperty) {
      filtered = filtered.filter(document => document.propertyName === selectedProperty)
    }

    if (selectedUnit) {
      filtered = filtered.filter(document => document.unitNo === selectedUnit)
    }

    setFilteredData(filtered)
  }, [data, globalFilter, selectedProperty, selectedUnit])

  // Handle delete document
  const handleDeleteDocument = (documentId: number) => {
    setData(data.filter(document => document.id !== documentId))
    setDeleteDocumentOpen(false)
    setSelectedDocument(null)
  }

  // Handle status update
  const handleStatusUpdate = (documentId: number, newStatus: 'accepted' | 'rejected', rejectReason?: string) => {
    setData(
      data.map(document =>
        document.id === documentId ? { ...document, status: newStatus } : document
      )
    )
  }

  // Handle accept document
  const handleAcceptDocument = () => {
    if (documentToAccept) {
      handleStatusUpdate(documentToAccept.id, 'accepted')
      setDocumentToAccept(null)
    }
  }

  // Handle reject document
  const handleRejectDocument = (rejectReason: string) => {
    if (documentToReject) {
      handleStatusUpdate(documentToReject.id, 'rejected', rejectReason)
      setDocumentToReject(null)
    }
  }

  const columnHelper = createColumnHelper<DocumentTypeWithAction>()

  // Status color mapping
  const documentStatusObj: {
    [key: string]: {
      color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
    }
  } = {
    accepted: { color: 'primary' },
    rejected: { color: 'warning' },
    pending: { color: 'info' }
  }

  const columns = useMemo<ColumnDef<DocumentTypeWithAction, any>[]>(
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
            <Avatar
              variant='rounded'
              src={row.original.propertyImage}
              alt={row.original.propertyName}
              sx={{ width: 40, height: 40 }}
            >
              {row.original.propertyName?.[0]?.toUpperCase() || 'P'}
            </Avatar>
            <Typography color='text.primary' className='font-medium max-w-[200px] truncate'>
              {row.original.propertyName || '-'}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('unitNo', {
        header: 'Unit No',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.unitNo || '-'}</Typography>
      }),
      columnHelper.accessor('tenantName', {
        header: 'Tenant Name',
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
      columnHelper.accessor('documentImage', {
        header: 'Image',
        cell: ({ row }) => (
          <Avatar
            variant='rounded'
            src={row.original.documentImage}
            alt={row.original.documentType}
            sx={{ width: 50, height: 50 }}
          >
            <i className='ri-file-line' />
          </Avatar>
        )
      }),
      columnHelper.accessor('documentType', {
        header: 'Document Type',
        cell: ({ row }) => (
          <Typography color='text.primary'>{row.original.documentType || '-'}</Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          const statusConfig = documentStatusObj[status] || { color: 'secondary' }

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
                      setDocumentToView(row.original)
                      setViewDocumentOpen(true)
                    }
                  }
                },
                {
                  text: 'Accepted',
                  icon: 'ri-checkbox-circle-line',
                  menuItemProps: {
                    onClick: () => {
                      setDocumentToAccept(row.original)
                      setAcceptDocumentOpen(true)
                    }
                  }
                },
                {
                  text: 'Rejected',
                  icon: 'ri-close-circle-line',
                  menuItemProps: {
                    onClick: () => {
                      setDocumentToReject(row.original)
                      setRejectDocumentOpen(true)
                    }
                  }
                },
                {
                  text: 'Delete',
                  icon: 'ri-delete-bin-line',
                  menuItemProps: {
                    onClick: () => {
                      setSelectedDocument(row.original)
                      setDeleteDocumentOpen(true)
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
        title='Document'
        description='Manage and view all tenant documents'
        icon='ri-file-text-line'
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Documents List'
          action={
            <div className='flex items-center gap-2'>
              <OptionMenu options={['Refresh', 'Share']} />
            </div>
          }
        />
        <Divider />
        <CardContent className='flex flex-col gap-4'>
          {/* Filters */}
          <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
            <div className='flex flex-wrap gap-4 items-center'>
              <FormControl size='small' sx={{ minWidth: 180 }}>
                <InputLabel>Select Property</InputLabel>
                <Select
                  value={selectedProperty}
                  onChange={e => setSelectedProperty(e.target.value)}
                  label='Select Property'
                >
                  <MenuItem value=''>All Properties</MenuItem>
                  {uniqueProperties.map(prop => (
                    <MenuItem key={prop} value={prop}>
                      {prop}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Select Unit No</InputLabel>
                <Select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} label='Select Unit No'>
                  <MenuItem value=''>All Units</MenuItem>
                  {uniqueUnits.map(unit => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
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

      {/* View Document Dialog */}
      <ViewDocumentDialog
        open={viewDocumentOpen}
        setOpen={setViewDocumentOpen}
        documentData={documentToView}
        onAccept={() => {
          if (documentToView) {
            setDocumentToAccept(documentToView)
            setViewDocumentOpen(false)
            setAcceptDocumentOpen(true)
          }
        }}
        onReject={() => {
          if (documentToView) {
            setDocumentToReject(documentToView)
            setViewDocumentOpen(false)
            setRejectDocumentOpen(true)
          }
        }}
      />

      {/* Accept Document Dialog */}
      <AcceptDocumentDialog
        open={acceptDocumentOpen}
        setOpen={setAcceptDocumentOpen}
        onConfirm={handleAcceptDocument}
      />

      {/* Reject Document Dialog */}
      <RejectDocumentDialog
        open={rejectDocumentOpen}
        setOpen={setRejectDocumentOpen}
        documentData={documentToReject}
        onConfirm={handleRejectDocument}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDocumentOpen}
        setOpen={setDeleteDocumentOpen}
        type='delete-document'
        onConfirm={() => {
          if (selectedDocument) {
            handleDeleteDocument(selectedDocument.id)
          }
        }}
      />
    </>
  )
}

export default DocumentsListTable

