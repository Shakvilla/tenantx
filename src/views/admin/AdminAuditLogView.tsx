'use client'

import { useState, useEffect, useCallback } from 'react'

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
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import Collapse from '@mui/material/Collapse'

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
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ width: 32, py: 0.5 }}>
          {hasDetail && (
            <Tooltip title={open ? 'Collapse' : 'Expand detail'}>
              <IconButton size='small' onClick={() => setOpen(v => !v)}>
                <i className={open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
        <TableCell sx={{ py: 0.5 }}>
          <Typography variant='caption' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {fmt(entry.createdAt)}
          </Typography>
        </TableCell>
        <TableCell sx={{ py: 0.5 }}>
          <Typography variant='body2'>{entry.adminEmail}</Typography>
        </TableCell>
        <TableCell sx={{ py: 0.5 }}>
          <Chip
            label={entry.action}
            size='small'
            color={actionColor(entry.action)}
            sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
          />
        </TableCell>
        <TableCell sx={{ py: 0.5 }}>
          <Typography variant='body2' color='text.secondary'>
            {entry.entityType ?? '—'}
          </Typography>
        </TableCell>
        <TableCell sx={{ py: 0.5 }}>
          <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {entry.entityId ?? '—'}
          </Typography>
        </TableCell>
        <TableCell sx={{ py: 0.5 }}>
          <Typography variant='caption' color='text.disabled'>
            {entry.ipAddress ?? '—'}
          </Typography>
        </TableCell>
      </TableRow>

      {hasDetail && (
        <TableRow>
          <TableCell colSpan={7} sx={{ py: 0, pl: 6, pr: 2, borderBottom: 'none' }}>
            <Collapse in={open} timeout='auto' unmountOnExit>
              <Box sx={{ py: 1 }}>
                <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(entry.detail, null, 2)}
                </pre>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminAuditLogView() {
  const [rows, setRows]           = useState<AuditLogEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [page, setPage]           = useState(0)
  const [totalPages, setTotalPages] = useState(0)
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

  const PAGE_SIZE = 50

  const load = useCallback(async (p: number, filters: typeof committed) => {
    setLoading(true)
    setError(null)
    try {
      const params: Parameters<typeof getAuditLog>[0] = { page: p, size: PAGE_SIZE }
      if (filters.adminEmail) params.adminEmail = filters.adminEmail
      if (filters.entityType) params.entityType = filters.entityType
      if (filters.action)     params.action     = filters.action
      if (filters.from)       params.from       = new Date(filters.from).toISOString()
      if (filters.to)         params.to         = new Date(filters.to + 'T23:59:59').toISOString()

      const res: AuditLogPage = await getAuditLog(params)
      setRows(res.data)
      setPage(res.page)
      setTotalPages(res.totalPages)
      setTotalElements(res.totalElements)
    } catch {
      setError('Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(0, committed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSearch() {
    const next = { adminEmail, entityType, action, from: fromDate, to: toDate }
    setCommitted(next)
    load(0, next)
  }

  function handleReset() {
    setAdminEmail(''); setEntityType(''); setAction(''); setFromDate(''); setToDate('')
    const empty = { adminEmail: '', entityType: '', action: '', from: '', to: '' }
    setCommitted(empty)
    load(0, empty)
  }

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
              <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                <Typography variant='caption' color='text.secondary'>
                  {totalElements.toLocaleString()} {totalElements === 1 ? 'entry' : 'entries'} found
                </Typography>
              </Box>
              <TableContainer component={Paper} elevation={0}>
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 600, fontSize: '0.75rem', bgcolor: 'action.hover' } }}>
                      <TableCell sx={{ width: 32 }} />
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Admin</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Entity Type</TableCell>
                      <TableCell>Entity ID</TableCell>
                      <TableCell>IP</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                          No audit events match the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map(entry => <DetailRow key={entry.id} entry={entry} />)
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5 }}>
                  <Button
                    size='small'
                    disabled={page === 0}
                    onClick={() => load(page - 1, committed)}
                    startIcon={<i className='ri-arrow-left-s-line' />}
                  >
                    Prev
                  </Button>
                  <Typography variant='caption' color='text.secondary'>
                    Page {page + 1} of {totalPages}
                  </Typography>
                  <Button
                    size='small'
                    disabled={page >= totalPages - 1}
                    onClick={() => load(page + 1, committed)}
                    endIcon={<i className='ri-arrow-right-s-line' />}
                  >
                    Next
                  </Button>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
