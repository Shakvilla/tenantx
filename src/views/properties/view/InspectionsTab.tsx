'use client'

import { useState, useEffect, useMemo } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'

import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import { inspectionsApi } from '@/lib/api/inspections'
import type { InspectionSummary, InspectionType, InspectionStatus } from '@/types/inspection'

import RowActions from '@components/table/RowActions'
import tableStyles from '@core/styles/table.module.css'

import CreateInspectionDialog from './CreateInspectionDialog'
import ViewInspectionDialog   from './ViewInspectionDialog'

// ─── helpers ──────────────────────────────────────────────────────────────────

function typeChip(type: InspectionType) {
  return (
    <Chip
      label={type === 'MOVE_IN' ? 'Move-in' : 'Move-out'}
      size='small'
      variant='tonal'
      color={type === 'MOVE_IN' ? 'success' : 'warning'}
    />
  )
}

function statusChip(status: InspectionStatus) {
  return (
    <Chip
      label={status === 'COMPLETED' ? 'Completed' : 'Draft'}
      size='small'
      variant='tonal'
      color={status === 'COMPLETED' ? 'success' : 'default'}
    />
  )
}

function conditionCounts(row: InspectionSummary) {
  return (
    <Box className='flex items-center gap-1'>
      <Chip label={`${row.goodCount} Good`}  size='small' variant='tonal' color='success' sx={{ fontSize: 11 }} />
      <Chip label={`${row.fairCount} Fair`}  size='small' variant='tonal' color='warning' sx={{ fontSize: 11 }} />
      <Chip label={`${row.poorCount} Poor`}  size='small' variant='tonal' color='error'   sx={{ fontSize: 11 }} />
    </Box>
  )
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── column defs ─────────────────────────────────────────────────────────────

type Row = InspectionSummary & { _action?: string }
const colHelper = createColumnHelper<Row>()

// ─── component ────────────────────────────────────────────────────────────────

type Props = {
  unitId: string
  propertyId: string
  unitNo?: string | null
  propertyName?: string | null
}

export default function InspectionsTab({ unitId, propertyId, unitNo, propertyName }: Props) {
  const [rows, setRows]       = useState<InspectionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const [createOpen, setCreateOpen]           = useState(false)
  const [viewId, setViewId]                   = useState<string | null>(null)
  const [deleteId, setDeleteId]               = useState<string | null>(null)
  const [deletingId, setDeletingId]           = useState<string | null>(null)

  useEffect(() => { load() }, [unitId]) // eslint-disable-line

  function load() {
    setLoading(true)
    setError(null)
    inspectionsApi.getByUnit(unitId)
      .then(setRows)
      .catch(err => setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load inspections'))
      .finally(() => setLoading(false))
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await inspectionsApi.delete(id)
      setRows(prev => prev.filter(r => r.id !== id))
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Delete failed')
    } finally {
      setDeletingId(null)
      setDeleteId(null)
    }
  }

  const columns = useMemo<ColumnDef<Row, any>[]>(() => [
    colHelper.accessor('inspectionDate', {
      header: 'Date',
      cell: ({ getValue }) => fmtDate(getValue()),
    }),
    colHelper.accessor('type', {
      header: 'Type',
      cell: ({ getValue }) => typeChip(getValue()),
    }),
    colHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => statusChip(getValue()),
    }),
    colHelper.accessor('inspectorName', {
      header: 'Inspector',
      cell: ({ getValue }) => getValue() ?? <Typography variant='body2' color='text.disabled'>—</Typography>,
    }),
    colHelper.accessor('itemCount', {
      header: 'Items',
      cell: ({ row }) => conditionCounts(row.original),
    }),
    colHelper.accessor('_action', {
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <RowActions
          options={[
            {
              text: 'View',
              icon: 'ri-eye-line',
              menuItemProps: { onClick: () => setViewId(row.original.id) },
            },
            {
              text: 'Delete',
              icon: 'ri-delete-bin-line',
              menuItemProps: {
                onClick: () => setDeleteId(row.original.id),
                sx: { color: 'var(--mui-palette-error-main)' },
              },
            },
          ]}
        />
      ),
    }),
  ], []) // eslint-disable-line

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Inspections'
          subheader='Move-in and move-out condition reports'
          action={
            <Button
              variant='contained'
              size='small'
              startIcon={<i className='ri-file-list-3-line' />}
              onClick={() => setCreateOpen(true)}
            >
              New Inspection
            </Button>
          }
        />
        <CardContent className='p-0'>
          {error && (
            <Box sx={{ px: 4, pt: 3 }}>
              <Alert severity='error' onClose={() => setError(null)}>{error}</Alert>
            </Box>
          )}

          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id} style={{ cursor: h.column.getCanSort() ? 'pointer' : 'default' }}
                          onClick={h.column.getToggleSortingHandler()}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              {/* skeleton */}
              {loading && (
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j}><Skeleton variant='text' /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}

              {/* empty */}
              {!loading && rows.length === 0 && (
                <tbody>
                  <tr>
                    <td colSpan={6}>
                      <Box className='flex flex-col items-center gap-3 py-12' sx={{ color: 'text.disabled' }}>
                        <Box sx={{
                          width: 64, height: 64, borderRadius: '50%',
                          background: 'var(--mui-palette-primary-lightOpacity)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className='ri-file-list-3-line' style={{ fontSize: 28, color: 'var(--mui-palette-primary-main)' }} />
                        </Box>
                        <Box className='text-center'>
                          <Typography variant='body1' fontWeight={500} color='text.primary'>No inspections yet</Typography>
                          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                            Create a move-in or move-out inspection checklist.
                          </Typography>
                        </Box>
                        <Button variant='outlined' size='small' onClick={() => setCreateOpen(true)}
                                startIcon={<i className='ri-add-line' />}>
                          New Inspection
                        </Button>
                      </Box>
                    </td>
                  </tr>
                </tbody>
              )}

              {/* rows */}
              {!loading && rows.length > 0 && (
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className={classnames({ 'opacity-40': deletingId === row.original.id })}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>

          {!loading && rows.length > 0 && (
            <TablePagination
              className='border-bs'
              component='div'
              count={table.getFilteredRowModel().rows.length}
              rowsPerPage={table.getState().pagination.pageSize}
              page={table.getState().pagination.pageIndex}
              onPageChange={(_, p) => table.setPageIndex(p)}
              onRowsPerPageChange={e => { table.setPageSize(Number(e.target.value)); table.setPageIndex(0) }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          )}
        </CardContent>
      </Card>

      {/* ── dialogs ──────────────────────────────────────────────────────── */}
      <CreateInspectionDialog
        open={createOpen}
        unitId={unitId}
        propertyId={propertyId}
        unitNo={unitNo}
        propertyName={propertyName}
        onClose={() => setCreateOpen(false)}
        onCreated={summary => {
          setRows(prev => [summary, ...prev])
          setCreateOpen(false)
        }}
      />

      {viewId && (
        <ViewInspectionDialog
          open={!!viewId}
          inspectionId={viewId}
          onClose={() => setViewId(null)}
        />
      )}

      {/* delete confirm (inline mini-dialog) */}
      {deleteId && (
        <Box
          sx={{
            position: 'fixed', inset: 0, zIndex: 1400,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setDeleteId(null)}
        >
          <Box
            sx={{
              bgcolor: 'background.paper', borderRadius: 2, p: 4,
              maxWidth: 360, width: '90%', boxShadow: 8,
            }}
            onClick={e => e.stopPropagation()}
          >
            <Typography variant='h6' sx={{ mb: 1 }}>Delete Inspection?</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              This will permanently remove the inspection and all its items.
            </Typography>
            <Box className='flex justify-end gap-2'>
              <Button variant='outlined' color='secondary' size='small' onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant='contained'
                color='error'
                size='small'
                onClick={() => handleDelete(deleteId)}
                disabled={!!deletingId}
                startIcon={<i className='ri-delete-bin-line' />}
              >
                Delete
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </>
  )
}
