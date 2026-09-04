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
import Alert from '@mui/material/Alert'
import type { TextFieldProps } from '@mui/material/TextField'

import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn, SortingState } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

import type { DocumentType } from '@/types/documents/documentTypes'
import { getDocuments, deleteDocument, updateDocumentStatus, type DocumentItem } from '@/lib/api/documents'
import { getProperties } from '@/lib/api/properties'
import { getStoredTenantId } from '@/lib/api/storage'
import { getDocumentDownloadUrl } from '@/lib/document-storage'

import RowActions from '@components/table/RowActions'
import CustomAvatar from '@core/components/mui/Avatar'
import PageBanner from '@components/banner/PageBanner'
import ViewDocumentDialog from './ViewDocumentDialog'
import AcceptDocumentDialog from './AcceptDocumentDialog'
import RejectDocumentDialog from './RejectDocumentDialog'
import AddDocumentDialog from './AddDocumentDialog'
import ReplaceFileDialog from './ReplaceFileDialog'
import DeleteDocumentDialog from './DeleteDocumentDialog'

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
    agreementNumber: item.agreementNumber,
    occupantId:   item.occupantId,
    tenantName:   item.occupantName,
    fileUrl:      item.fileUrl,
    fileName:     item.fileName,
    fileId:       item.fileId
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
  // Only the current page of documents lives client-side — paging, filtering,
  // search and sorting all round-trip to the server.
  const [data,    setData]    = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(0)
  const [pageSize,setPageSize] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])

  const [search,           setSearch]           = useState('')
  const [selectedStatus,   setSelectedStatus]   = useState('')
  const [selectedProperty, setSelectedProperty] = useState('')

  const [addDocumentOpen,     setAddDocumentOpen]     = useState(false)
  const [viewDocumentOpen,    setViewDocumentOpen]    = useState(false)
  const [acceptDocumentOpen,  setAcceptDocumentOpen]  = useState(false)
  const [rejectDocumentOpen,  setRejectDocumentOpen]  = useState(false)
  const [deleteDocumentOpen,  setDeleteDocumentOpen]  = useState(false)
  const [replaceFileOpen,     setReplaceFileOpen]     = useState(false)
  const [selectedDocument,    setSelectedDocument]    = useState<DocumentType | null>(null)
  const [actionError,         setActionError]         = useState<string | null>(null)

  // ---- Property dropdown (server-side list, loaded once) ----

  const [properties, setProperties] = useState<string[]>([])

  useEffect(() => {
    const tenantId = getStoredTenantId()
    if (!tenantId) return
    getProperties(tenantId, { size: 200 })
      .then(res => {
        const names = (res?.data ?? [])
          .map((p: { name?: string }) => p.name)
          .filter(Boolean) as string[]
        setProperties(Array.from(new Set(names)))
      })
      .catch(() => setProperties([]))
  }, [])

  // ---- Server-side query params ----

  const sortParam = useMemo(() => {
    if (sorting.length === 0) return undefined
    const s = sorting[0]
    // Column accessor → backend sort field. tenantName is the occupant's name.
    const fieldMap: Record<string, string> = { tenantName: 'occupantName' }
    return `${fieldMap[s.id] ?? s.id},${s.desc ? 'desc' : 'asc'}`
  }, [sorting])

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDocuments({
        status:       selectedStatus || undefined,
        propertyName: selectedProperty || undefined,
        search:       search || undefined,
        page,
        size: pageSize,
        sort: sortParam
      })
      const items = Array.isArray(res?.content) ? res.content : []
      setData(items.map(apiToDisplay))
      setTotal(res?.total ?? 0)
    } catch (err) {
      console.error('Failed to load documents:', err)
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [selectedStatus, selectedProperty, search, page, pageSize, sortParam])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  // A new filter or sort targets page 0, not wherever the user had scrolled to.
  const changeFilter = (setter: (v: string) => void) => (value: string) => {
    setter(value)
    setPage(0)
  }

  // ---- Handlers ----

  const handleAccept = async () => {
    if (!selectedDocument) return
    try {
      await updateDocumentStatus(selectedDocument.id, { status: 'accepted' })
      setActionError(null)
      fetchDocuments()
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? err?.message ?? 'Failed to accept document')
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

  /**
   * Document files are private in ImageKit, so their stored URL 401s on its
   * own — the link has to be minted per click, and it expires. That is the
   * point: the previous scheme handed out a permanent public URL, readable by
   * anyone who ever saw it, with no check that they owned the document.
   *
   * Opened via an anchor rather than window.open because the fetch happens
   * first: a popup opened before the await is blocked by the browser as
   * un-gestured, and one opened after loses the user-gesture context anyway.
   */
  const handleDownload = async (doc: DocumentTypeWithAction) => {
    try {
      const url = await getDocumentDownloadUrl(doc.id)
      const a = document.createElement('a')

      a.href = url
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.click()
      setActionError(null)
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message ?? err?.message ?? 'Could not open the document. Please try again.'
      )
    }
  }

  const handleDelete = async () => {
    if (!selectedDocument) return
    const doc = selectedDocument
    try {
      // The stored file goes with it, server-side. The browser used to make a
      // second, best-effort call after this one — which was silently skipped
      // whenever the tab was closed first, leaving the file behind forever.
      await deleteDocument(doc.id)
      setActionError(null)
      // If the page is now empty but there are earlier pages, step back one so
      // the user isn't stranded on a blank page after the last-row delete.
      if (data.length === 1 && page > 0) {
        setPage(page - 1)
      } else {
        fetchDocuments()
      }
    } catch (err: any) {
      setActionError(err?.response?.data?.message ?? err?.message ?? 'Failed to delete document')
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
          {row.original.agreementNumber && (
            <Typography variant='caption' color='text.secondary'>
              Agreement: {row.original.agreementNumber}
            </Typography>
          )}
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
              // A document can't be approved before a file is attached — mirrors the
              // backend guard (DOCUMENT_FILE_REQUIRED). Empty records can still be rejected.
              text: row.original.fileUrl ? 'Accept' : 'Accept (attach a file first)',
              icon: 'ri-check-line',
              menuItemProps: {
                onClick: () => { setSelectedDocument(row.original); setAcceptDocumentOpen(true) },
                disabled: row.original.status === 'accepted' || !row.original.fileUrl
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
              text: 'Replace File',
              icon: 'ri-refresh-line',
              menuItemProps: { onClick: () => { setSelectedDocument(row.original); setReplaceFileOpen(true) } }
            }] : []),
            ...(row.original.fileUrl ? [{
              text: 'Download',
              icon: 'ri-download-line',
              menuItemProps: { onClick: () => handleDownload(row.original) }
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
    data,
    columns,
    // The fuzzy filter satisfies the project-wide FilterFns augmentation; all
    // actual filtering happens server-side now (GET /documents?search=&status=…).
    filterFns: { fuzzy: fuzzyFilter },
    state:         { sorting },
    onSortingChange: updater => {
      setSorting(updater)
      setPage(0)
    },
    getCoreRowModel:   getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
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
                value={search}
                onChange={v => changeFilter(setSearch)(String(v))}
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
          {actionError && (
            <Alert severity='error' onClose={() => setActionError(null)}>{actionError}</Alert>
          )}
          {/* Filters */}
          <div className='flex flex-wrap gap-4'>
            <TextField
              select size='small' label='Status' value={selectedStatus}
              onChange={e => changeFilter(setSelectedStatus)(e.target.value)} sx={{ minWidth: 150 }}
            >
              <MenuItem value=''>All Statuses</MenuItem>
              <MenuItem value='pending'>Pending</MenuItem>
              <MenuItem value='accepted'>Accepted</MenuItem>
              <MenuItem value='rejected'>Rejected</MenuItem>
            </TextField>
            <TextField
              select size='small' label='Property' value={selectedProperty}
              onChange={e => changeFilter(setSelectedProperty)(e.target.value)} sx={{ minWidth: 200 }}
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
            <div className={`overflow-x-auto ${tableStyles.scrollShadow}`}>
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
            count={total}
            rowsPerPage={pageSize}
            page={page}
            SelectProps={{ inputProps: { 'aria-label': 'rows per page' } }}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}
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

      <ReplaceFileDialog
        open={replaceFileOpen}
        setOpen={setReplaceFileOpen}
        document={selectedDocument}
        onSuccess={() => { setReplaceFileOpen(false); setSelectedDocument(null); fetchDocuments() }}
      />

      <DeleteDocumentDialog
        open={deleteDocumentOpen}
        setOpen={setDeleteDocumentOpen}
        onConfirm={handleDelete}
        documentName={selectedDocument?.documentType}
      />
    </>
  )
}

export default DocumentsListTable