'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import TablePagination from '@mui/material/TablePagination'
import Chip from '@mui/material/Chip'

import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Snackbar from '@mui/material/Snackbar'
import Divider from '@mui/material/Divider'

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, getSortedRowModel } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'

import {
  getAdminGlobalUsers,
  getAdminGlobalUser,
  deactivateAdminGlobalUser,
  reactivateAdminGlobalUser,
  resetAdminGlobalUserPassword,
  type AdminGlobalUserRecord,
  type AdminGlobalUserDetail,
} from '@/lib/api/admin-auth-client'
import { fuzzyFilter } from '@/utils/tableFilterFns'

const columnHelper = createColumnHelper<AdminGlobalUserRecord>()

export default function AdminGlobalUsersView() {
  const [rows, setRows] = useState<AdminGlobalUserRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [setupFilter, setSetupFilter] = useState<'all' | 'pending' | 'complete'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')

  const [detail, setDetail] = useState<AdminGlobalUserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [confirm, setConfirm] = useState<{ kind: 'deactivate' | 'reset-password'; id: string; name: string } | null>(null)
  const [acting, setActing] = useState(false)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await getAdminGlobalUsers({
        active: activeFilter === 'all' ? undefined : activeFilter === 'active',
        firstTimeLogin: setupFilter === 'all' ? undefined : setupFilter === 'pending',
        search: search || undefined,
        page,
        size: pageSize
      })

      setRows(Array.isArray(res.items) ? res.items : [])
      setTotal(res.total ?? 0)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Could not load global users')
    } finally {
      setLoading(false)
    }
  }, [activeFilter, setupFilter, search, page, pageSize])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  const openDetail = async (id: string) => {
    setDetailLoading(true)

    try {
      setDetail(await getAdminGlobalUser(id))
    } catch (e: any) {
      setSnackbar(e?.response?.data?.message ?? e?.message ?? 'Could not load identity')
    } finally {
      setDetailLoading(false)
    }
  }

  const refreshDetail = async (id: string) => {
    try {
      setDetail(await getAdminGlobalUser(id))
    } catch {
      // List refresh below already surfaces failures; detail staleness is tolerable.
    }

    fetchRows()
  }

  const handleConfirm = async () => {
    if (!confirm) return
    setActing(true)

    try {
      if (confirm.kind === 'deactivate') {
        await deactivateAdminGlobalUser(confirm.id)
        setSnackbar(`${confirm.name} deactivated everywhere. Links are kept for reactivation.`)
      } else {
        const res = await resetAdminGlobalUserPassword(confirm.id)

        setSnackbar(res.message ?? `Reset email queued for ${confirm.name}`)
      }

      setConfirm(null)
      refreshDetail(confirm.id)
    } catch (e: any) {
      setSnackbar(e?.response?.data?.message ?? e?.message ?? 'Action failed')
    } finally {
      setActing(false)
    }
  }

  const handleReinstate = async (id: string, name: string) => {
    try {
      await reactivateAdminGlobalUser(id)
      setSnackbar(`${name} reactivated`)
      refreshDetail(id)
    } catch (e: any) {
      setSnackbar(e?.response?.data?.message ?? e?.message ?? 'Could not reinstate')
    }
  }

  const columns: ColumnDef<AdminGlobalUserRecord, any>[] = [
    columnHelper.accessor('fullName', { header: 'Name' }),
    columnHelper.accessor('email', { header: 'Email' }),
    columnHelper.accessor('phoneNumber', {
      header: 'Phone',
      cell: info => (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Typography variant='body2'>{info.getValue() || '—'}</Typography>
          {info.row.original.phoneVerified && <Chip size='small' label='verified' color='success' />}
        </Box>
      )
    }),
    columnHelper.accessor('active', {
      header: 'Status',
      cell: info => (
        <Chip
          size='small'
          label={info.getValue() ? 'Active' : 'Deactivated'}
          color={info.getValue() ? 'success' : 'error'}
        />
      )
    }),
    columnHelper.accessor('firstTimeLogin', {
      header: 'Setup',
      cell: info => (
        <Chip size='small' label={info.getValue() ? 'Pending' : 'Complete'} color={info.getValue() ? 'warning' : 'default'} />
      )
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button size='small' onClick={() => openDetail(row.original.id)}>
          Open
        </Button>
      )
    })
  ]

  const table = useReactTable({
    data: rows,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return (
    <Box>
      <Typography variant='h5' sx={{ mb: 1 }}>Global Users</Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
        The person behind every workspace — landlords, staff, occupants, maintainers and agents
        resolve to one row here. Deactivation blocks login everywhere; links are kept so
        reactivation restores access without re-provisioning.
      </Typography>

      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size='small'
              label='Search email, name or phone'
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setPage(0)
              }}
              sx={{ minWidth: 260 }}
            />
            <TextField
              size='small'
              select
              SelectProps={{ native: true }}
              label='Status'
              value={activeFilter}
              onChange={e => {
                setActiveFilter(e.target.value as typeof activeFilter)
                setPage(0)
              }}
            >
              <option value='all'>All</option>
              <option value='active'>Active</option>
              <option value='inactive'>Deactivated</option>
            </TextField>
            <TextField
              size='small'
              select
              SelectProps={{ native: true }}
              label='Setup'
              value={setupFilter}
              onChange={e => {
                setSetupFilter(e.target.value as typeof setupFilter)
                setPage(0)
              }}
            >
              <option value='all'>All</option>
              <option value='pending'>Setup pending</option>
              <option value='complete'>Complete</option>
            </TextField>
            <TextField
              size='small'
              placeholder='Filter loaded rows…'
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : rows.length === 0 ? (
            <Typography color='text.secondary'>No global users match.</Typography>
          ) : (
            <div className={tableStyles.tableContainer}>
              <table className={tableStyles.table}>
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => (
                        <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <TablePagination
            component='div'
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={e => {
              setPageSize(Number(e.target.value))
              setPage(0)
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={!!detail || detailLoading} onClose={() => setDetail(null)} fullWidth maxWidth='md'>
        <DialogTitle>{detail ? detail.user.fullName : 'Identity'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {detailLoading && !detail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : detail ? (
            <>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip size='small' label={detail.user.active ? 'Active' : 'Deactivated'} color={detail.user.active ? 'success' : 'error'} />
                <Chip
                  size='small'
                  label={detail.user.firstTimeLogin ? 'Setup pending' : 'Setup complete'}
                  color={detail.user.firstTimeLogin ? 'warning' : 'default'}
                />
                <Typography variant='body2' color='text.secondary'>
                  {detail.user.email}
                  {detail.user.phoneNumber ? ` · ${detail.user.phoneNumber}${detail.user.phoneVerified ? ' (verified)' : ''}` : ''}
                </Typography>
              </Box>
              <Divider />
              <Typography variant='subtitle2'>Workspaces ({detail.workspaces.length})</Typography>
              {detail.workspaces.length === 0 ? (
                <Typography color='text.secondary'>
                  No workspace links — a global session with no tenant (e.g. an agent before their first relationship).
                </Typography>
              ) : (
                detail.workspaces.map(w => (
                  <Box key={`${w.tenantId}-${w.role}`} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>{w.tenantId}</Typography>
                    <Chip size='small' label={w.userType} />
                    <Chip size='small' label={w.role} variant='outlined' />
                    {!w.active && <Chip size='small' label='link inactive' color='default' />}
                  </Box>
                ))
              )}
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Close</Button>
          {detail &&
            (detail.user.active ? (
              <>
                <Button
                  onClick={() => setConfirm({ kind: 'reset-password', id: detail.user.id, name: detail.user.fullName })}
                >
                  Send password reset
                </Button>
                <Button
                  color='error'
                  onClick={() => setConfirm({ kind: 'deactivate', id: detail.user.id, name: detail.user.fullName })}
                >
                  Deactivate
                </Button>
              </>
            ) : (
              <Button
                color='success'
                onClick={() => {
                  handleReinstate(detail.user.id, detail.user.fullName)
                  setDetail(null)
                }}
              >
                Reinstate
              </Button>
            ))}
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirm} onClose={() => setConfirm(null)} fullWidth maxWidth='sm'>
        <DialogTitle>
          {confirm?.kind === 'deactivate' ? `Deactivate ${confirm?.name}?` : `Reset password for ${confirm?.name}?`}
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            {confirm?.kind === 'deactivate'
              ? 'Blocks login on every workspace. Links are kept, so reinstatement restores access.'
              : 'Queues a reset OTP email the user completes themselves. Nothing changes server-side.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant='contained' color={confirm?.kind === 'deactivate' ? 'error' : 'primary'} onClick={handleConfirm} disabled={acting}>
            {acting ? 'Working…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snackbar} autoHideDuration={5000} onClose={() => setSnackbar(null)} message={snackbar ?? ''} />
    </Box>
  )
}
