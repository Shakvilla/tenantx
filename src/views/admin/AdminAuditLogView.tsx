'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import TablePagination from '@mui/material/TablePagination'
import IconButton from '@mui/material/IconButton'
import Collapse from '@mui/material/Collapse'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'

import {
  getAuditLog,
  type AuditLogEntry,
  type AuditLogPage,
} from '@/lib/api/admin-auth-client'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENTITY_TYPES = [
  'TENANT', 'ADMIN', 'INVOICE', 'PLATFORM_SETTING',
  'ANNOUNCEMENT', 'MESSAGING', 'FEATURE_FLAG',
]

const ACTION_COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
  TENANT_CREATED:              'success',
  TENANT_UPDATED:              'primary',
  TENANT_DEACTIVATED:          'error',
  TENANT_REACTIVATED:          'success',
  TENANT_OFFBOARDED:           'error',
  TENANT_MESSAGE_SENT:         'info',
  TENANT_PASSWORD_RESET:       'warning',
  INVOICE_VOIDED:              'error',
  INVOICE_RETRY:               'warning',
  ADMIN_CREATED:               'success',
  ADMIN_DEACTIVATED:           'error',
  ADMIN_REACTIVATED:           'success',
  ADMIN_ROLE_ASSIGNED:         'primary',
  ADMIN_ROLE_REMOVED:          'warning',
  ADMIN_PASSWORD_RESET:        'warning',
  ADMIN_MFA_UPDATED:           'info',
  PLATFORM_SETTING_UPDATED:    'info',
  FEATURE_FLAG_OVERRIDE_SET:   'primary',
  FEATURE_FLAG_OVERRIDE_REMOVED: 'secondary',
  ANNOUNCEMENT_CREATED:        'success',
  ANNOUNCEMENT_UPDATED:        'primary',
  ANNOUNCEMENT_DELETED:        'error',
  API_KEY_GENERATED:           'success',
  API_KEY_REVOKED:             'error',
  TARGETED_MESSAGE_SENT:       'info',
  BROADCAST_MESSAGE_SENT:      'info',
}

function actionColor(action: string) {
  return ACTION_COLORS[action] ?? 'default'
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

// ---------------------------------------------------------------------------
// Detail expander row
// ---------------------------------------------------------------------------

function DetailRow({ entry }: { entry: AuditLogEntry }) {
  const [open, setOpen] = useState(false)
  const hasDetail = entry.detail && Object.keys(entry.detail).length > 0

  return (
    <>
      <tr>
        <td style={{ width: 32, padding: '4px 8px' }}>
          {hasDetail && (
            <Tooltip title={open ? 'Collapse' : 'Expand detail'}>
              <IconButton size='small' onClick={() => setOpen(v => !v)}>
                <i className={open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
              </IconButton>
            </Tooltip>
          )}
        </td>
        <td style={{ padding: '4px 8px' }}>
          <Typography variant='caption' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {fmt(entry.createdAt)}
          </Typography>
        </td>
        <td style={{ padding: '4px 8px' }}>
          <Typography variant='body2'>{entry.adminEmail}</Typography>
        </td>
        <td style={{ padding: '4px 8px' }}>
          <Chip
            label={entry.action}
            size='small'
            color={actionColor(entry.action)}
            sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
          />
        </td>
        <td style={{ padding: '4px 8px' }}>
          <Typography variant='body2' color='text.secondary'>
            {entry.entityType ?? '—'}
          </Typography>
        </td>
        <td style={{ padding: '4px 8px' }}>
          <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {entry.entityId ?? '—'}
          </Typography>
        </td>
        <td style={{ padding: '4px 8px' }}>
          <Typography variant='caption' color='text.disabled'>
            {entry.ipAddress ?? '—'}
          </Typography>
        </td>
      </tr>

      {hasDetail && (
        <tr>
          <td colSpan={7} style={{ padding: 0, paddingLeft: 48, paddingRight: 16, borderBottom: 'none' }}>
            <Collapse in={open} timeout='auto' unmountOnExit>
              <Box sx={{ py: 1 }}>
                <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(entry.detail, null, 2)}
                </pre>
              </Box>
            </Collapse>
          </td>
        </tr>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

const columnHelper = createColumnHelper<AuditLogEntry>()

export default function AdminAuditLogView() {
  const [rows, setRows]           = useState<AuditLogEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [page, setPage]           = useState(0)
  const [pageSize, setPageSize]   = useState(25)
  const [totalElements, setTotalElements] = useState(0)

  // Filter state
  const [adminEmail,  setAdminEmail]  = useState('')
  const [entityType,  setEntityType]  = useState('')
  const [action,      setAction]      = useState('')
  const [fromDate,    setFromDate]    = useState('')
  const [toDate,      setToDate]      = useState('')

  // Committed filter (applied on search)
  const [committed, setCommitted] = useState({
    adminEmail: '', entityType: '', action: '', from: '', to: '',
  })

  const load = useCallback(async (p: number, size: number, filters: typeof committed) => {
    setLoading(true)
    setError(null)
    try {
      const params: Parameters<typeof getAuditLog>[0] = { page: p, size: size }
      if (filters.adminEmail) params.adminEmail = filters.adminEmail
      if (filters.entityType) params.entityType = filters.entityType
      if (filters.action)     params.action     = filters.action
      if (filters.from)       params.from       = new Date(filters.from).toISOString()
      if (filters.to)         params.to         = new Date(filters.to + 'T23:59:59').toISOString()

      const res: AuditLogPage = await getAuditLog(params)
      setRows(res.data)
      setPage(res.page)
      setTotalElements(res.totalElements)
    } catch {
      setError('Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(0, pageSize, committed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSearch() {
    const next = { adminEmail, entityType, action, from: fromDate, to: toDate }
    setCommitted(next)
    load(0, pageSize, next)
  }

  function handleReset() {
    setAdminEmail(''); setEntityType(''); setAction(''); setFromDate(''); setToDate('')
    const empty = { adminEmail: '', entityType: '', action: '', from: '', to: '' }
    setCommitted(empty)
    load(0, pageSize, empty)
  }

  const columns = useMemo(() => [
    columnHelper.display({ id: 'expand', header: () => null }),
    columnHelper.display({ id: 'timestamp', header: 'Timestamp' }),
    columnHelper.display({ id: 'admin', header: 'Admin' }),
    columnHelper.display({ id: 'action', header: 'Action' }),
    columnHelper.display({ id: 'entityType', header: 'Entity Type' }),
    columnHelper.display({ id: 'entityId', header: 'Entity ID' }),
    columnHelper.display({ id: 'ip', header: 'IP' }),
  ], [])

  const table = useReactTable({
    data: rows,
    columns,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil(totalElements / pageSize),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h5' fontWeight={600} gutterBottom>
        Admin Audit Log
      </Typography>
      <Typography variant='body2' color='text.secondary' mb={3}>
        Immutable record of every significant admin action. Append-only — entries are never modified or deleted.
      </Typography>

      {/* ── Filters ── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='subtitle2' fontWeight={600} mb={2}>Filters</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <TextField
              label='Admin Email'
              size='small'
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <TextField
              select
              label='Entity Type'
              size='small'
              value={entityType}
              onChange={e => setEntityType(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value=''>All</MenuItem>
              {ENTITY_TYPES.map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
            <TextField
              label='Action'
              size='small'
              value={action}
              onChange={e => setAction(e.target.value)}
              placeholder='e.g. TENANT_CREATED'
              sx={{ minWidth: 200 }}
            />
            <TextField
              label='From Date'
              type='date'
              size='small'
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              label='To Date'
              type='date'
              size='small'
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            <Button variant='contained' onClick={handleSearch} sx={{ height: 40 }}>
              Search
            </Button>
            <Button variant='outlined' onClick={handleReset} sx={{ height: 40 }}>
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ── Table ── */}
      <Card variant='outlined'>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Box sx={{ p: 2 }}>
              <Alert severity='error'>{error}</Alert>
            </Box>
          )}

          {!loading && !error && (
            <>
              <table className={tableStyles.table}>
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>
                        No audit events match the current filters.
                      </td>
                    </tr>
                  ) : rows.map(entry => <DetailRow key={entry.id} entry={entry} />)}
                </tbody>
              </table>

              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={totalElements}
                rowsPerPage={pageSize}
                page={page}
                onPageChange={(_, newPage) => { setPage(newPage); load(newPage, pageSize, committed) }}
                onRowsPerPageChange={e => {
                  const newSize = Number(e.target.value)
                  setPageSize(newSize)
                  setPage(0)
                  load(0, newSize, committed)
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
