'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
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

// Type Imports
import type { DocumentType } from '@/types/documents/documentTypes'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'
import ViewDocumentDialog from './ViewDocumentDialog'
import AcceptDocumentDialog from './AcceptDocumentDialog'
import RejectDocumentDialog from './RejectDocumentDialog'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'

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

// Sample document data
const sampleDocuments: DocumentType[] = [
  {
    id: 1,
    documentType: 'Lease Agreement',
    status: 'accepted',
    tenantName: 'Brokin Simon',
    propertyName: 'A living room with mexican mansion blue',
    unitNo: 'Unit no 3',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
  },
  {
    id: 2,
    documentType: 'ID Card',
    status: 'pending',
    tenantName: 'Andrew Paul',
    propertyName: 'Rendering of a modern villa',
    unitNo: 'Unit no 5',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
  },
  {
    id: 3,
    documentType: 'Other',
    status: 'rejected',
    tenantName: 'Mrtle Hale',
    propertyName: 'Beautiful modern style luxury home exterior sunset',
    unitNo: 'Unit no 2',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
  },
  {
    id: 4,
    documentType: 'Other',
    status: 'accepted',
    tenantName: 'Timothy',
    propertyName: 'Design of a modern house as mansion blue couch',
    unitNo: 'Unit no 1',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
  },
  {
    id: 5,
    documentType: 'Other',
    status: 'pending',
    tenantName: 'John Doe',
    propertyName: 'A house with a lot of windows and a lot of plants',
    unitNo: 'Unit no 6',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
  },
  {
    id: 6,
    documentType: 'Other',
    status: 'accepted',
    tenantName: 'Jane Smith',
    propertyName: 'Depending on the location and design',
    unitNo: 'Unit no 12',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
  }
]

// Vars
const statusObj: Record<string, { title: string; color: 'success' | 'warning' | 'error' | 'secondary' }> = {
  accepted: { title: 'Accepted', color: 'success' },
  pending: { title: 'Pending', color: 'warning' },
  rejected: { title: 'Rejected', color: 'error' }
}

const typeIconObj: Record<string, { icon: string; color: string }> = {
  'Lease Agreement': { icon: 'ri-file-list-3-line', color: 'primary' },
  'ID Card': { icon: 'ri-user-star-line', color: 'info' },
  'Passport': { icon: 'ri-shield-check-line', color: 'success' },
  'Contract': { icon: 'ri-file-text-line', color: 'warning' },
  'Other': { icon: 'ri-file-line', color: 'secondary' }
}

const DocumentsListTable = () => {
  // States
  const [data, setData] = useState(sampleDocuments)
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedProperty, setSelectedProperty] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [viewDocumentOpen, setViewDocumentOpen] = useState(false)
  const [acceptDocumentOpen, setAcceptDocumentOpen] = useState(false)
  const [rejectDocumentOpen, setRejectDocumentOpen] = useState(false)
  const [deleteDocumentOpen, setDeleteDocumentOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null)

  // Get unique properties and units for filters
  const properties = useMemo(() => Array.from(new Set(data.map(d => d.propertyName).filter(Boolean))), [data])
  const units = useMemo(() => Array.from(new Set(data.map(d => d.unitNo).filter(Boolean))), [data])

  // Filter data
  useEffect(() => {
    const filtered = data.filter(document => {
      if (globalFilter && !document.documentType.toLowerCase().includes(globalFilter.toLowerCase()) && 
          !document.tenantName.toLowerCase().includes(globalFilter.toLowerCase())) {
        return false
      }

      if (selectedProperty && document.propertyName !== selectedProperty) {
        return false
      }

      if (selectedUnit && document.unitNo !== selectedUnit) {
        return false
      }

      return true
    })

    setFilteredData(filtered)
  }, [data, globalFilter, selectedProperty, selectedUnit])

  // Handle delete document
  const handleDeleteDocument = (documentId: number) => {
    setData(data.filter(document => document.id !== documentId))
    setDeleteDocumentOpen(false)
    setSelectedDocument(null)
  }

  // Handle status update
  const handleStatusUpdate = (documentId: number, newStatus: 'accepted' | 'rejected', _rejectReason?: string) => {
    setData(
      data.map(document =>
        document.id === documentId ? { ...document, status: newStatus } : document
      )
    )
  }

  // Column Helper
  const columnHelper = createColumnHelper<DocumentTypeWithAction>()

  const columns = useMemo<ColumnDef<DocumentTypeWithAction, any>[]>(
    () => [
      columnHelper.accessor('documentType', {
        header: 'DOCUMENT TYPE',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <CustomAvatar
              skin='light'
              color={(typeIconObj[row.original.documentType] || typeIconObj.Other).color as any}
              size={34}
            >
              <i className={classnames((typeIconObj[row.original.documentType] || typeIconObj.Other).icon, 'text-xl')} />
            </CustomAvatar>
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.documentType}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('tenantName', {
        header: 'TENANT',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Avatar src={row.original.tenantAvatar} sx={{ width: 30, height: 30 }} />
            <Typography color='text.primary'>{row.original.tenantName}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('propertyName', {
        header: 'PROPERTY & UNIT',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium max-w-[200px] truncate'>
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
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={statusObj[row.original.status].title}
            size='small'
            color={statusObj[row.original.status].color}
            className='capitalize'
          />
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
                  onClick: () => {
                    setSelectedDocument(row.original)
                    setViewDocumentOpen(true)
                  }
                }
              },
              {
                text: 'Download',
                icon: 'ri-download-line'
              },
              {
                text: 'Accept',
                icon: 'ri-check-line',
                menuItemProps: {
                  onClick: () => {
                    setSelectedDocument(row.original)
                    setAcceptDocumentOpen(true)
                  },
                  disabled: row.original.status === 'accepted'
                }
              },
              {
                text: 'Reject',
                icon: 'ri-close-line',
                menuItemProps: {
                  onClick: () => {
                    setSelectedDocument(row.original)
                    setRejectDocumentOpen(true)
                  },
                  disabled: row.original.status === 'rejected'
                }
              },
              {
                text: 'Delete',
                icon: 'ri-delete-bin-line',
                menuItemProps: {
                  onClick: () => {
                    setSelectedDocument(row.original)
                    setDeleteDocumentOpen(true)
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
    []
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Documents'
          action={
            <div className='flex items-center gap-2'>
              <TextField
                size='small'
                placeholder='Search'
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                className='max-sm:is-full'
              />
            </div>
          }
        />
        <CardContent className='flex flex-col gap-4'>
          {/* Filters */}
          <div className='flex flex-wrap items-center gap-4'>
            <TextField
              select
              size='small'
              label='Property'
              value={selectedProperty}
              onChange={e => setSelectedProperty(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value=''>All Properties</MenuItem>
              {properties.map(property => (
                <MenuItem key={property} value={property}>
                  {property}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size='small'
              label='Unit'
              value={selectedUnit}
              onChange={e => setSelectedUnit(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value=''>All Units</MenuItem>
              {units.map(unit => (
                <MenuItem key={unit} value={unit}>
                  {unit}
                </MenuItem>
              ))}
            </TextField>
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
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                      No documents available
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
            onRowsPerPageChange={e => {
              table.setPageSize(Number(e.target.value))
            }}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ViewDocumentDialog
        open={viewDocumentOpen}
        handleClose={() => {
          setViewDocumentOpen(false)
          setSelectedDocument(null)
        }}
        document={selectedDocument}
      />

      <AcceptDocumentDialog
        open={acceptDocumentOpen}
        setOpen={setAcceptDocumentOpen}
        onConfirm={() => {
          if (selectedDocument) {
            handleStatusUpdate(selectedDocument.id, 'accepted')
          }
        }}
        documentName={selectedDocument?.documentType}
      />

      <RejectDocumentDialog
        open={rejectDocumentOpen}
        setOpen={setRejectDocumentOpen}
        documentData={selectedDocument}
        onConfirm={(reason) => {
          if (selectedDocument) {
            handleStatusUpdate(selectedDocument.id, 'rejected', reason)
          }
        }}
      />

      <ConfirmationDialog
        open={deleteDocumentOpen}
        setOpen={setDeleteDocumentOpen}
        type='delete-customer'
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
