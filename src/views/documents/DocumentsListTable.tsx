'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import TablePagination from '@mui/material/TablePagination'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'
import type { TextFieldProps } from '@mui/material/TextField'

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

import type { DocumentType } from '@/types/documents/documentTypes'
import { getDocuments, deleteDocument, updateDocumentStatus, type DocumentItem } from '@/lib/api/documents'

import RowActions from '@components/table/RowActions'
import CustomAvatar from '@core/components/mui/Avatar'
import PageBanner from '@components/banner/PageBanner'
import ViewDocumentDialog from './ViewDocumentDialog'
import AcceptDocumentDialog from './AcceptDocumentDialog'
import RejectDocumentDialog from './RejectDocumentDialog'
import AddDocumentDialog from './AddDocumentDialog'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'

import tableStyles from '@core/styles/table.module.css'

// ---------------------------------------------------------------------------
// Helpers
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

function apiToDisplay(item: DocumentItem): DocumentType {
  return {
    id:           item.id,
    documentType: item.documentType,
    status:       item.status,
    rejectReason: item.rejectReason,
    propertyId:   item.propertyId,
    propertyName: item.propertyName,
    unitId:       item.unitId,
    unitNo:       item.unitNo,
    occupantId:   item.occupantId,
    tenantName:   item.occupantName,
    fileUrl:      item.fileUrl,
    fileName:     item.fileName
  }
}

const statusObj: Record<string, { title: string; color: 'success' | 'warning' | 'error' }> = {
  accepted: { title: 'Accepted', color: 'success' },
  pending:  { title: 'Pending',  color: 'warning' },
  rejected: { title: 'Rejected', color: 'error' }
}

const typeIconObj: Record<string, { icon: string; color: string }> = {
  'Lease Agreement': { icon: 'ri-file-list-3-line', color: 'primary' },
  'ID Card':         { icon: 'ri-user-star-line',   color: 'info' },
  'Passport':        { icon: 'ri-shield-check-line', color: 'success' },
  'Contract':        { icon: 'ri-file-text-line',    color: 'warning' },
  'Other':           { icon: 'ri-file-line',          color: 'secondary' }
}

type DocumentTypeWithAction = DocumentType & { action?: string }

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: { value: string | number; onChange: (v: string | number) => void; debounce?: number } & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)
  useEffect(() => { setValue(initialValue) }, [initialValue])
  useEffect(() => {
    const t = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DocumentsListTable = () => {
  const [data,    setData]    = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)

  const [globalFilter,      setGlobalFilter]      = useState('')
  const [selectedStatus,    setSelectedStatus]     = useState('')
  const [selectedProperty,  setSelectedProperty]  = useState('')

  const [addDocumentOpen,    setAddDocumentOpen]    = useState(false)
  const [viewDocumentOpen,   setViewDocumentOpen]   = useState(false)
  const [acceptDocumentOpen, setAcceptDocumentOpen] = useState(false)
  const [rejectDocumentOpen, setRejectDocumentOpen] = useState(false)
  const [deleteDocumentOpen, setDeleteDocumentOpen] = useState(false)
  const [selectedDocument,   setSelectedDocument]   = useState<DocumentType | null>(null)

  // ---- Fetch ----

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const raw = await getDocuments()
      const items = Array.isArray(raw) ? raw : []
      setData(items.map(apiToDisplay))
    } catch (err) {
      console.error('Failed to load documents:', err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  // ---- Derived filter lists ----

  const properties = useMemo(
    () => Array.from(new Set(data.map(d => d.propertyName).filter(Boolean) as string[])),
    [data]
  )

  const filteredData = useMemo(() => {
    let result = data
    if (selectedStatus)   result = result.filter(d => d.status === selectedStatus)
    if (selectedProperty) result = result.filter(d => d.propertyName === selectedProperty)
    return result
  }, [data, selectedStatus, selectedProperty])

  // ---- Handlers ----

  const handleAccept = async () => {
    if (!selectedDocument) return
    try {
      await updateDocumentStatus(selectedDocument.id, { status: 'accepted' })
      fetchDocuments()
    } catch (err) {
      console.error('Failed to accept document:', err)
    }
  }

  const handleReject = async (reason: string) => {
    if (!selectedDocument) return
    try {
      await updateDocumentStatus(selectedDocument.id, { status: 'rejected', rejectReason: reason })
      fetchDocuments()
    } catch (err) {
      console.error('Failed to reject document:', err)
    }
  }

  const handleDelete = async () => {
    if (!selectedDocument) return
    try {
      await deleteDocument(selectedDocument.id)
      fetchDocuments()
    } catch (err) {
      console.error('Failed to delete document:', err)
    } finally {
      setDeleteDocumentOpen(false)
      setSelectedDocument(null)
    }
  }

  // ---- Columns ----

  const columnHelper = createColumnHelper<DocumentTypeWithAction>()

  const columns = useMemo<ColumnDef<DocumentTypeWithAction, any>[]>(() => [
    columnHelper.accessor('documentType', {
      header: 'Document Type',
      cell: ({ row }) => {
        const cfg = typeIconObj[row.original.documentType] ?? typeIconObj['Other']
        return (
          <div className='flex items-center gap-3'>
            <CustomAvatar skin='light' color={cfg.color as any} size={34}>
              <i className={classnames(cfg.icon, 'text-xl')} />
            </CustomAvatar>
            <Typography color='text.primary' className='font-medium'>
              {row.original.documentType}
            </Typography>
          </div>
        )
      }
    }),
    columnHelper.accessor('tenantName', {
      header: 'Tenant',
      cell: ({ row }) => (
        <div className='flex items-center gap-3'>
          <Avatar src={row.original.tenantAvatar} sx={{ width: 30, height: 30 }}>
            {row.original.tenantName?.charAt(0) ?? '?'}
          </Avatar>
          <Typography color='text.primary'>{row.original.tenantName || '-'}</Typography>
        </div>
      )
    }),
    columnHelper.accessor('propertyName', {
      header: 'Property & Unit',
      cell: ({ row }) => (
        <div className='flex flex-col'>
          <Typography color='text.primary' className='font-medium max-w-[200px] truncate'>
            {row.original.propertyName || '-'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {row.original.unitNo || ''}
          </Typography>
        </div>
      )
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => {
        const cfg = statusObj[row.original.status] ?? { title: row.original.status, color: 'secondary' as const }
        return (
          <Chip variant='tonal' label={cfg.title} size='small' color={cfg.color} className='capitalize' />
        )
      }
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <RowActions
          iconButtonProps={{ size: 'small' }}
          options={[
            {
              text: 'View',
              icon: 'ri-eye-line',
              menuItemProps: { onClick: () => { setSelectedDocument(row.original); setViewDocumentOpen(true) } }
            },
            {
              text: 'Accept',
              icon: 'ri-check-line',
              menuItemProps: {
                onClick: () => { setSelectedDocument(row.original); setAcceptDocumentOpen(true) },
                disabled: row.original.status === 'accepted'
              }
            },
            {
              text: 'Reject',
              icon: 'ri-close-line',
              menuItemProps: {
                onClick: () => { setSelectedDocument(row.original); setRejectDocumentOpen(true) },
                disabled: row.original.status === 'rejected'
              }
            },
            ...(row.original.fileUrl ? [{
              text: 'Download',
              icon: 'ri-download-line',
              menuItemProps: { onClick: () => window.open(row.original.fileUrl, '_blank') }
            }] : []),
            {
              text: 'Delete',
              icon: 'ri-delete-bin-line',
              menuItemProps: {
                onClick: () => { setSelectedDocument(row.original); setDeleteDocumentOpen(true) },
                sx: { color: 'error.main' }
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
    filterFns:            { fuzzy: fuzzyFilter },
    state:                { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn:       'fuzzy',
    getCoreRowModel:      getCoreRowModel(),
    getFilteredRowModel:  getFilteredRowModel(),
    getSortedRowModel:    getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <PageBanner
        title='Documents'
        description='Review and manage tenant-submitted documents'
        icon='ri-folder-3-line'
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Documents'
          action={
            <div className='flex items-center gap-3'>
              <DebouncedInput
                value={globalFilter ?? ''}
                onChange={v => setGlobalFilter(String(v))}
                placeholder='Search…'
                className='min-is-[220px]'
              />
              <Button
                variant='contained'
                startIcon={<i className='ri-upload-2-line' />}
                onClick={() => setAddDocumentOpen(true)}
              >
                Upload Document
              </Button>
            </div>
          }
        />
        <CardContent className='flex flex-col gap-4'>
          {/* Filters */}
          <div className='flex flex-wrap gap-4'>
            <TextField
              select size='small' label='Status' value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)} sx={{ minWidth: 150 }}
            >
              <MenuItem value=''>All Statuses</MenuItem>
              <MenuItem value='pending'>Pending</MenuItem>
              <MenuItem value='accepted'>Accepted</MenuItem>
              <MenuItem value='rejected'>Rejected</MenuItem>
            </TextField>
            <TextField
              select size='small' label='Property' value={selectedProperty}
              onChange={e => setSelectedProperty(e.target.value)} sx={{ minWidth: 200 }}
            >
              <MenuItem value=''>All Properties</MenuItem>
              {properties.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </div>

          {/* Table */}
          {loading ? (
            <Box className='flex flex-col gap-2'>
              {[0,1,2,3,4].map(i => <Skeleton key={i} variant='rectangular' height={44} />)}
            </Box>
          ) : (
            <div className='overflow-x-auto'>
              <table className={tableStyles.table}>
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => (
                        <th key={h.id}>
                          {h.isPlaceholder ? null : (
                            <div
                              className={classnames({
                                'flex items-center': h.column.getIsSorted(),
                                'cursor-pointer select-none': h.column.getCanSort()
                              })}
                              onClick={h.column.getToggleSortingHandler()}
                            >
                              {flexRender(h.column.columnDef.header, h.getContext())}
                              {{ asc: <i className='ri-arrow-up-s-line text-xl' />, desc: <i className='ri-arrow-down-s-line text-xl' /> }[h.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                {table.getRowModel().rows.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={table.getVisibleFlatColumns().length} className='text-center py-8'>
                        <Typography color='text.secondary'>No documents found</Typography>
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

      {/* Dialogs */}
      <AddDocumentDialog
        open={addDocumentOpen}
        setOpen={setAddDocumentOpen}
        onSuccess={fetchDocuments}
      />

      <ViewDocumentDialog
        open={viewDocumentOpen}
        handleClose={() => { setViewDocumentOpen(false); setSelectedDocument(null) }}
        document={selectedDocument}
      />

      <AcceptDocumentDialog
        open={acceptDocumentOpen}
        setOpen={setAcceptDocumentOpen}
        onConfirm={handleAccept}
        documentName={selectedDocument?.documentType}
      />

      <RejectDocumentDialog
        open={rejectDocumentOpen}
        setOpen={setRejectDocumentOpen}
        documentData={selectedDocument}
        onConfirm={handleReject}
      />

      <ConfirmationDialog
        open={deleteDocumentOpen}
        setOpen={setDeleteDocumentOpen}
        type='delete-customer'
        onConfirm={handleDelete}
      />
    </>
  )
}

export default DocumentsListTable
