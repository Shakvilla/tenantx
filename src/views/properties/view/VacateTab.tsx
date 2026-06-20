'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'

import classnames from 'classnames'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { Skeleton } from '@mui/material'

import { vacateNoticesApi } from '@/lib/api/vacateNotices'
import type { VacateNoticeSummary, VacateNoticeStatus } from '@/types/vacateNotice'

import RowActions from '@components/table/RowActions'
import tableStyles from '@core/styles/table.module.css'

import CreateVacateNoticeDialog from './CreateVacateNoticeDialog'
import VacateWorkflowDialog from './VacateWorkflowDialog'

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<VacateNoticeStatus, { label: string; color: 'warning' | 'info' | 'error' | 'success' }> = {
  NOTICE_GIVEN: { label: 'Notice Given', color: 'warning' },
  CONFIRMED:    { label: 'Confirmed',    color: 'info'    },
  MOVED_OUT:    { label: 'Moved Out',    color: 'error'   },
  COMPLETED:    { label: 'Completed',    color: 'success' },
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })
}

function nextActionLabel(status: VacateNoticeStatus): string | null {
  if (status === 'NOTICE_GIVEN') return 'Confirm Notice'
  if (status === 'CONFIRMED')    return 'Mark Moved Out'
  if (status === 'MOVED_OUT')    return 'Complete'
  return null
}

function nextActionIcon(status: VacateNoticeStatus): string | null {
  if (status === 'NOTICE_GIVEN') return 'ri-check-line'
  if (status === 'CONFIRMED')    return 'ri-door-open-line'
  if (status === 'MOVED_OUT')    return 'ri-checkbox-circle-line'
  return null
}

function nextWorkflowAction(status: VacateNoticeStatus): 'confirm' | 'move-out' | 'complete' | null {
  if (status === 'NOTICE_GIVEN') return 'confirm'
  if (status === 'CONFIRMED')    return 'move-out'
  if (status === 'MOVED_OUT')    return 'complete'
  return null
}

const col = createColumnHelper<VacateNoticeSummary>()

// ─── component ───────────────────────────────────────────────────────────────

type Props = {
  unitId: string
  propertyId: string
  unitNo?: string
  propertyName?: string
  tenantName?: string
}

export default function VacateTab({ unitId, propertyId, unitNo, propertyName, tenantName }: Props) {
  const [rows, setRows]         = useState<VacateNoticeSummary[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [createOpen, setCreate] = useState(false)

  const [workflowRow, setWorkflowRow]       = useState<VacateNoticeSummary | null>(null)
  const [workflowAction, setWorkflowAction] = useState<'confirm' | 'move-out' | 'complete' | null>(null)

  const [deleteId, setDeleteId]   = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await vacateNoticesApi.getByUnit(unitId))
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load vacate notices')
    } finally {
      setLoading(false)
    }
  }, [unitId])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await vacateNoticesApi.delete(id)
      setRows(prev => prev.filter(r => r.id !== id))
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Delete failed')
    } finally {
      setDeletingId(null)
      setDeleteId(null)
    }
  }

  const columns = useMemo(() => [
    col.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue()
        const cfg = STATUS_CONFIG[s]
        if (!cfg) return <Chip label={s ?? '—'} size='small' variant='tonal' />
        return <Chip label={cfg.label} size='small' variant='tonal' color={cfg.color} />
      },
    }),
    col.accessor('noticeDate', {
      header: 'Notice Date',
      cell: ({ getValue }) => fmtDate(getValue()),
    }),
    col.accessor('expectedMoveOut', {
      header: 'Expected Move-Out',
      cell: ({ getValue }) => fmtDate(getValue()),
    }),
    col.accessor('actualMoveOut', {
      header: 'Actual Move-Out',
      cell: ({ getValue }) => fmtDate(getValue()),
    }),
    col.accessor('occupantName', {
      header: 'Tenant',
      cell: ({ getValue }) => getValue() ?? <Typography variant='body2' color='text.disabled'>—</Typography>,
    }),
    col.accessor('keysReturned', {
      header: 'Keys',
      cell: ({ getValue }) => getValue()
        ? <Chip label='Returned' size='small' variant='tonal' color='success' />
        : <Chip label='Pending'  size='small' variant='tonal' color='default' />,
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const r = row.original
        const action = nextWorkflowAction(r.status)
        const label  = nextActionLabel(r.status)
        const icon   = nextActionIcon(r.status)

        const options: any[] = []

        if (action && label && icon) {
          options.push({
            text: label,
            icon,
            menuItemProps: {
              onClick: () => { setWorkflowRow(r); setWorkflowAction(action) },
            },
          })
        }

        if (r.status !== 'COMPLETED') {
          options.push({
            text: 'Delete',
            icon: 'ri-delete-bin-line',
            menuItemProps: {
              onClick: () => setDeleteId(r.id),
              sx: { color: 'var(--mui-palette-error-main)' },
            },
          })
        }

        return options.length > 0 ? <RowActions options={options} /> : null
      },
    }),
  ], []) // eslint-disable-line react-hooks/exhaustive-deps

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Vacate Notices'
          subheader='Move-out workflow — notice, key handover, and unit vacating'
          action={
            <Button
              variant='contained'
              size='small'
              startIcon={<i className='ri-add-line' />}
              onClick={() => setCreate(true)}
            >
              New Notice
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
                      <th key={h.id}>
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
                      {Array.from({ length: 7 }).map((__, j) => (
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
                    <td colSpan={7}>
                      <Box className='flex flex-col items-center gap-3 py-12' sx={{ color: 'text.disabled' }}>
                        <Box sx={{
                          width: 64, height: 64, borderRadius: '50%',
                          background: 'var(--mui-palette-warning-lightOpacity)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className='ri-door-open-line' style={{ fontSize: 28, color: 'var(--mui-palette-warning-main)' }} />
                        </Box>
                        <Box className='text-center'>
                          <Typography variant='body1' fontWeight={500} color='text.primary'>No vacate notices yet</Typography>
                          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                            Create a notice when a tenant is moving out.
                          </Typography>
                        </Box>
                        <Button variant='outlined' size='small' onClick={() => setCreate(true)}
                                startIcon={<i className='ri-add-line' />}>
                          New Notice
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
      <CreateVacateNoticeDialog
        open={createOpen}
        unitId={unitId}
        propertyId={propertyId}
        unitNo={unitNo}
        propertyName={propertyName}
        tenantName={tenantName}
        onClose={() => setCreate(false)}
        onCreated={() => { setCreate(false); load() }}
      />

      {workflowRow && workflowAction && (
        <VacateWorkflowDialog
          open={!!workflowRow}
          notice={workflowRow}
          action={workflowAction}
          onClose={() => { setWorkflowRow(null); setWorkflowAction(null) }}
          onDone={() => { setWorkflowRow(null); setWorkflowAction(null); load() }}
        />
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth='xs'>
        <DialogTitle>Delete Vacate Notice?</DialogTitle>
        <DialogContent>
          <Typography>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' color='secondary' onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={() => deleteId && handleDelete(deleteId)}
            disabled={!!deletingId}
          >
            {deletingId ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
