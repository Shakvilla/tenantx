'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Tab from '@mui/material/Tab'
import TablePagination from '@mui/material/TablePagination'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'

import {
  getAdminTickets, getTicketCounts, updateTicket,
  getAdminFeedback, getFeedbackSummary,
  type TicketDto, type TicketPageDto, type TicketCountsDto,
  type FeedbackDto, type FeedbackSummaryDto,
} from '@/lib/api/admin-auth-client'
import type { AdminSupportTicket } from '@/types/admin'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { fuzzyFilter } from '@/utils/tableFilterFns'

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, 'warning' | 'info' | 'success' | 'default'> = {
  OPEN:        'warning',
  IN_PROGRESS: 'info',
  RESOLVED:    'success',
  CLOSED:      'default',
}

const PRIORITY_COLORS: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  LOW:    'default',
  MEDIUM: 'info',
  HIGH:   'warning',
  URGENT: 'error',
}

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL:         'General',
  BUG:             'Bug Report',
  FEATURE_REQUEST: 'Feature Request',
  UI_UX:           'UI / UX',
  PERFORMANCE:     'Performance',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

// ---------------------------------------------------------------------------
// Shared: StatCard (matching dashboard design)
// ---------------------------------------------------------------------------

function StatCard({ label, value, icon, color, loading }: {
  label: string; value: string | number; icon: string
  color: 'primary' | 'warning' | 'info' | 'success' | 'error'; loading?: boolean
}) {
  return (
    <Card variant='outlined' sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant='body2' color='text.secondary' fontWeight={500}>{label}</Typography>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2, bgcolor: `${color}.main`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className={icon} style={{ fontSize: '1.3rem', color: '#fff' }} />
          </Box>
        </Box>
        {loading
          ? <Skeleton variant='text' width='50%' height={44} />
          : <Typography variant='h4' fontWeight={800} lineHeight={1.1}>{value}</Typography>
        }
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Star rating display
// ---------------------------------------------------------------------------

function StarRating({ value }: { value: number }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.25 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <i
          key={star}
          className={star <= value ? 'ri-star-fill' : 'ri-star-line'}
          style={{ fontSize: '1rem', color: star <= value ? '#f59e0b' : '#d1d5db' }}
        />
      ))}
    </Box>
  )
}

//

// ---------------------------------------------------------------------------
// Tab 0 — Support Tickets
// ---------------------------------------------------------------------------

function TicketsTab() {
  const { hasPermission } = useAdminAuth()
  const canManage = hasPermission('platform:support:write')

  const [counts,   setCounts]  = useState<TicketCountsDto | null>(null)
  const [page,     setPage]    = useState<TicketPageDto | null>(null)
  const [loading,  setLoading] = useState(true)
  const [error,    setError]   = useState<string | null>(null)
  const [toast,    setToast]   = useState<string | null>(null)

  // Filters
  const [status,   setStatus]   = useState('')
  const [priority, setPriority] = useState('')
  const [search,   setSearch]   = useState('')
  const [pageNum,  setPageNum]  = useState(0)
  const [pageSize, setPageSize] = useState(25)

  // Drawer
  const [selected, setSelected] = useState<TicketDto | null>(null)

  const load = useCallback(async (s: string, p: string, q: string, pg: number, size?: number) => {
    setLoading(true); setError(null)
    try {
      const [pageData, countData] = await Promise.all([
        getAdminTickets({ status: s || undefined, priority: p || undefined, search: q || undefined, page: pg, size: size ?? pageSize }),
        getTicketCounts(),
      ])
      setPage(pageData)
      setCounts(countData)
    } catch (err: unknown) {
      console.error('[Support] load tickets error:', err)
      const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string }
      const httpStatus = axiosErr?.response?.status
      const detail = httpStatus ? ` (HTTP ${httpStatus})` : (axiosErr?.message ? ` (${axiosErr.message})` : '')
      setError(`Failed to load tickets${detail}`)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load(status, priority, search, pageNum) },
    [status, priority, pageNum]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault(); setPageNum(0); load(status, priority, search, 0)
  }

  function handleUpdated(updated: TicketDto) {
    setSelected(updated)
    setPage(prev => prev ? {
      ...prev,
      content: prev.content.map(t => t.id === updated.id ? updated : t)
    } : prev)
    setToast('Ticket updated')
  }

  const columnHelper = createColumnHelper<TicketDto>()

  const columns = useMemo(() => [
    columnHelper.accessor('subject', {
      header: 'Subject',
      cell: info => (
        <Typography variant='body2' fontWeight={600} noWrap sx={{ maxWidth: 220 }}>
          {info.getValue()}
        </Typography>
      ),
    }),
    columnHelper.accessor('tenantId', {
      header: 'Tenant',
      cell: info => <Typography variant='body2'>{info.getValue()}</Typography>,
    }),
    columnHelper.accessor('submitterEmail', {
      header: 'Submitter',
      cell: info => (
        <Typography variant='body2' noWrap sx={{ maxWidth: 160 }}>{info.getValue()}</Typography>
      ),
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: info => (
        <Box sx={{ textAlign: 'center' }}>
          <Chip label={info.getValue()} size='small' color={PRIORITY_COLORS[info.getValue()] ?? 'default'} />
        </Box>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => (
        <Box sx={{ textAlign: 'center' }}>
          <Chip label={info.getValue().replace('_', ' ')} size='small' color={STATUS_COLORS[info.getValue()] ?? 'default'} />
        </Box>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: info => (
        <Typography variant='caption' color='text.secondary'>{fmtDate(info.getValue())}</Typography>
      ),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [])

  const table = useReactTable({
    filterFns: { fuzzy: fuzzyFilter },
    data: page?.content ?? [],
    columns,
    manualFiltering: true,
    manualPagination: true,
    pageCount: page ? Math.ceil(page.totalElements / pageSize) : -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Count stat cards */}
      <Grid container spacing={3}>
        <Grid item xs={6} md={3}>
          <StatCard label='Open' value={counts?.OPEN ?? '—'} icon='ri-inbox-line' color='warning' loading={!counts} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label='In Progress' value={counts?.IN_PROGRESS ?? '—'} icon='ri-loader-4-line' color='info' loading={!counts} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label='Resolved' value={counts?.RESOLVED ?? '—'} icon='ri-check-double-line' color='success' loading={!counts} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label='Closed' value={counts?.CLOSED ?? '—'} icon='ri-lock-line' color='primary' loading={!counts} />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card variant='outlined'>
        <CardContent sx={{ py: '12px !important' }}>
          <Box component='form' onSubmit={handleSearch}
            sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size='small' placeholder='Search subject or email…' value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <FormControl size='small' sx={{ minWidth: 130 }}>
              <InputLabel>Status</InputLabel>
              <Select label='Status' value={status} onChange={e => { setStatus(e.target.value); setPageNum(0) }}>
                <MenuItem value=''>All</MenuItem>
                {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
                  <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select label='Priority' value={priority} onChange={e => { setPriority(e.target.value); setPageNum(0) }}>
                <MenuItem value=''>All</MenuItem>
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button type='submit' variant='contained' size='small'>Search</Button>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity='error'>{error}</Alert>}

      {/* Table */}
      <Card variant='outlined'>
        {loading && <LinearProgress />}
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {!page && loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {[1,2,3,4,5,6].map(c => <td key={c}><Skeleton variant='text' /></td>)}
                </tr>
              )) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <i className='ri-customer-service-2-line' style={{ fontSize: '2.5rem', color: '#aaa' }} />
                      <Typography variant='body2' color='text.secondary' mt={1}>No tickets found.</Typography>
                    </Box>
                  </td>
                </tr>
              ) : table.getRowModel().rows.map(row => (
                <tr key={row.id} onClick={() => setSelected(row.original)} style={{ cursor: 'pointer' }}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {page && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component='div'
            count={page.totalElements}
            rowsPerPage={pageSize}
            page={pageNum}
            onPageChange={(_, p) => setPageNum(p)}
            onRowsPerPageChange={e => { setPageSize(Number(e.target.value)); setPageNum(0) }}
          />
        )}
      </Card>

      <AdminConversationThread
        ticket={selected as AdminSupportTicket}
        onBack={() => setSelected(null)}
      />

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}
        message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Tab 1 — Feedback Viewer
// ---------------------------------------------------------------------------

function FeedbackTab() {
  const [summary,  setSummary]  = useState<FeedbackSummaryDto | null>(null)
  const [page,     setPage]     = useState<{ content: FeedbackDto[]; totalElements: number; totalPages: number } | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [category, setCategory] = useState('')
  const [pageNum,  setPageNum]  = useState(0)
  const [pageSize, setPageSize] = useState(25)

  const load = useCallback(async (cat: string, pg: number) => {
    setLoading(true); setError(null)
    try {
      const [pageData, sum] = await Promise.all([
        getAdminFeedback({ category: cat || undefined, page: pg }),
        getFeedbackSummary(),
      ])
      setPage(pageData)
      setSummary(sum)
    } catch {
      setError('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(category, pageNum) }, [category, pageNum]) // eslint-disable-line react-hooks/exhaustive-deps

  const maxBarCount = summary
    ? Math.max(...Object.values(summary.distribution).map(Number), 1)
    : 1

  const columnHelper = createColumnHelper<FeedbackDto>()

  const feedCols = useMemo(() => [
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: info => <StarRating value={info.getValue()} />,
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: info => (
        <Chip label={CATEGORY_LABELS[info.getValue()] ?? info.getValue()} size='small' variant='outlined' />
      ),
    }),
    columnHelper.accessor('message', {
      header: 'Message',
      cell: info => (
        <Typography variant='body2' noWrap sx={{ maxWidth: 280 }}>
          {info.getValue() ?? <em style={{ color: '#aaa' }}>No message</em>}
        </Typography>
      ),
    }),
    columnHelper.accessor('tenantId', {
      header: 'Tenant',
      cell: info => <Typography variant='body2'>{info.getValue()}</Typography>,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Submitted',
      cell: info => (
        <Typography variant='caption' color='text.secondary'>{fmtDate(info.getValue())}</Typography>
      ),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [])

  const feedTable = useReactTable({
    filterFns: { fuzzy: fuzzyFilter },
    data: page?.content ?? [],
    columns: feedCols,
    manualFiltering: true,
    manualPagination: true,
    pageCount: page ? Math.ceil(page.totalElements / pageSize) : -1,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && <Alert severity='error'>{error}</Alert>}

      {/* Rating summary */}
      <Grid container spacing={3}>
        {/* Average card */}
        <Grid item xs={12} md={4}>
          <Card variant='outlined' sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              {loading && !summary ? (
                <Skeleton variant='text' width='50%' height={80} sx={{ mx: 'auto' }} />
              ) : (
                <>
                  <Typography variant='h2' fontWeight={800} color='warning.main'>
                    {summary ? summary.averageRating.toFixed(1) : '—'}
                  </Typography>
                  <StarRating value={Math.round(summary?.averageRating ?? 0)} />
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                    from {summary?.totalCount.toLocaleString() ?? 0} responses
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Distribution bars */}
        <Grid item xs={12} md={8}>
          <Card variant='outlined' sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant='subtitle2' fontWeight={700} mb={2}>Rating Distribution</Typography>
              {loading && !summary
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Skeleton variant='text' width={20} />
                      <Skeleton variant='rounded' height={14} sx={{ flex: 1 }} />
                      <Skeleton variant='text' width={30} />
                    </Box>
                  ))
                : [5, 4, 3, 2, 1].map(star => {
                    const count = Number(summary?.distribution[star] ?? 0)
                    const pct   = maxBarCount > 0 ? (count / maxBarCount) * 100 : 0
                    return (
                      <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 48 }}>
                          <Typography variant='body2' fontWeight={600}>{star}</Typography>
                          <i className='ri-star-fill' style={{ fontSize: '0.85rem', color: '#f59e0b' }} />
                        </Box>
                        <Box sx={{ flex: 1, height: 10, bgcolor: 'action.hover', borderRadius: 5, overflow: 'hidden' }}>
                          <Box sx={{
                            height: '100%', borderRadius: 5, bgcolor: '#f59e0b',
                            width: `${pct}%`, transition: 'width 0.5s ease',
                          }} />
                        </Box>
                        <Typography variant='caption' color='text.secondary' sx={{ minWidth: 28, textAlign: 'right' }}>
                          {count}
                        </Typography>
                      </Box>
                    )
                  })
              }
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter + list */}
      <Card variant='outlined'>
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant='subtitle1' fontWeight={700} sx={{ flex: 1 }}>All Feedback</Typography>
          <FormControl size='small' sx={{ minWidth: 160 }}>
            <InputLabel>Category</InputLabel>
            <Select label='Category' value={category} onChange={e => { setCategory(e.target.value); setPageNum(0) }}>
              <MenuItem value=''>All categories</MenuItem>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <MenuItem key={v} value={v}>{l}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Divider />
        {loading && !page && <LinearProgress />}
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {feedTable.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {feedTable.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={feedCols.length}>
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <i className='ri-emotion-line' style={{ fontSize: '2.5rem', color: '#aaa' }} />
                      <Typography variant='body2' color='text.secondary' mt={1}>No feedback yet.</Typography>
                    </Box>
                  </td>
                </tr>
              ) : feedTable.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {page && page.totalPages > 1 && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component='div'
            count={page.totalElements}
            rowsPerPage={pageSize}
            page={pageNum}
            onPageChange={(_, p) => setPageNum(p)}
            onRowsPerPageChange={e => { setPageSize(Number(e.target.value)); setPageNum(0) }}
          />
        )}
      </Card>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminSupportView() {
  const [tab, setTab] = useState(0)

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h5' fontWeight={700}>Support &amp; Feedback</Typography>
        <Typography variant='body2' color='text.secondary'>
          Manage support tickets from tenants and review in-app feedback.
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab
            label='Support Tickets'
            icon={<i className='ri-customer-service-2-line' style={{ fontSize: '1rem' }} />}
            iconPosition='start'
          />
          <Tab
            label='Feedback'
            icon={<i className='ri-emotion-line' style={{ fontSize: '1rem' }} />}
            iconPosition='start'
          />
        </Tabs>
      </Box>

      {tab === 0 && <TicketsTab />}
      {tab === 1 && <FeedbackTab />}
    </Box>
  )
}
