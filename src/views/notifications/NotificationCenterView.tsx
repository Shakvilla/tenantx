'use client'

import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Tab from '@mui/material/Tab'
import TablePagination from '@mui/material/TablePagination'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

import {
  getInAppNotifications,
  markInAppNotificationRead,
  markAllInAppNotificationsRead,
  getNotifications,
  getReminderLog,
  type InAppNotification,
  type InAppNotificationsPage,
  type Notification,
  type NotificationStatus,
  type ReminderLogEntry,
  type ReminderLogPage,
} from '@/lib/api/notifications'

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function entityIcon(entityType: string | null): string {
  switch (entityType) {
    case 'MAINTENANCE_REQUEST':
      return 'ri-tools-line'
    case 'INVOICE':
    case 'PAYMENT':
      return 'ri-money-dollar-circle-line'
    case 'AGREEMENT':
      return 'ri-file-text-line'
    default:
      return 'ri-notification-2-line'
  }
}

function entityColor(entityType: string | null): string {
  switch (entityType) {
    case 'MAINTENANCE_REQUEST':
      return 'var(--mui-palette-warning-main)'
    case 'INVOICE':
    case 'PAYMENT':
      return 'var(--mui-palette-success-main)'
    case 'AGREEMENT':
      return 'var(--mui-palette-primary-main)'
    default:
      return 'var(--mui-palette-info-main)'
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

// ── Status helpers for delivery log ──────────────────────────────────────────

function statusColor(s: NotificationStatus): 'success' | 'error' | 'warning' | 'default' {
  if (s === 'DELIVERED' || s === 'SENT')   return 'success'
  if (s === 'FAILED')                       return 'error'
  if (s === 'RETRYING' || s === 'PENDING') return 'warning'
  return 'default'
}

function typeIcon(t: string): string {
  if (t === 'EMAIL') return 'ri-mail-line'
  if (t === 'SMS')   return 'ri-message-3-line'
  if (t === 'PUSH')  return 'ri-notification-3-line'
  return 'ri-notification-2-line'
}

export default function NotificationCenterView() {
  // 0=All  1=Unread  2=Delivery Log  3=SMS Reminders
  const [tab, setTab] = useState(0)

  // ── In-app notification state (tabs 0 + 1) ───────────────────────────────
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRPP] = useState(20)
  const [data, setData] = useState<InAppNotificationsPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Delivery log state (tab 2) ────────────────────────────────────────────
  const [dlPage, setDlPage]       = useState(0)
  const [dlRPP, setDlRPP]         = useState(20)
  const [dlData, setDlData]       = useState<{ data: Notification[]; meta: { pagination: { hasNext: boolean } } } | null>(null)
  const [dlLoading, setDlLoading] = useState(false)
  const [dlError, setDlError]     = useState<string | null>(null)
  const [dlCursor, setDlCursor]   = useState<string | undefined>(undefined)
  const [dlTypeFilter, setDlTypeFilter] = useState<string>('EMAIL,SMS')

  // ── Reminder log state (tab 3) ────────────────────────────────────────────
  const [rlPage, setRlPage]       = useState(0)
  const [rlRPP, setRlRPP]         = useState(20)
  const [rlData, setRlData]       = useState<ReminderLogPage | null>(null)
  const [rlLoading, setRlLoading] = useState(false)
  const [rlError, setRlError]     = useState<string | null>(null)

  const load = useCallback((pg: number, rpp: number, unreadOnly: boolean) => {
    setLoading(true)
    setError(null)
    getInAppNotifications({ page: pg, size: rpp, unreadOnly })
      .then(setData)
      .catch(() => setError('Failed to load notifications. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const loadDeliveryLog = useCallback((cursor?: string) => {
    setDlLoading(true)
    setDlError(null)
    // Fetch EMAIL + SMS separately and merge
    Promise.all([
      getNotifications({ type: 'EMAIL', cursor, size: dlRPP }),
      getNotifications({ type: 'SMS',   cursor, size: dlRPP }),
    ])
      .then(([emails, sms]) => {
        const merged = [...(emails.data ?? []), ...(sms.data ?? [])]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setDlData({ data: merged, meta: emails.meta })
      })
      .catch(() => setDlError('Failed to load delivery log.'))
      .finally(() => setDlLoading(false))
  }, [dlRPP])

  const loadReminderLog = useCallback((pg: number, rpp: number) => {
    setRlLoading(true)
    setRlError(null)
    getReminderLog({ page: pg, size: rpp })
      .then(setRlData)
      .catch(() => setRlError('Failed to load SMS reminder log.'))
      .finally(() => setRlLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 0 || tab === 1) load(page, rowsPerPage, tab === 1)
  }, [page, rowsPerPage, tab, load])

  useEffect(() => {
    if (tab === 2) loadDeliveryLog(undefined)
  }, [tab, loadDeliveryLog])

  useEffect(() => {
    if (tab === 3) loadReminderLog(rlPage, rlRPP)
  }, [tab, rlPage, rlRPP, loadReminderLog])

  const handleMarkRead = async (n: InAppNotification) => {
    if (n.read) return
    await markInAppNotificationRead(n.id)
    load(page, rowsPerPage, tab === 1)
  }

  const handleMarkAllRead = async () => {
    await markAllInAppNotificationsRead()
    load(page, rowsPerPage, tab === 1)
  }

  const unreadCount = (data?.content ?? []).filter(n => !n.read).length

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>Notifications</Typography>
          <Typography variant='body2' color='text.secondary'>
            Stay up to date with your property activity
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button
            size='small'
            variant='outlined'
            startIcon={<i className='ri-check-double-line' />}
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </Button>
        )}
      </Box>

      {/* Tab filter */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0) }}>
          <Tab label='All' />
          <Tab label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Unread
              {data && data.totalElements > 0 && tab === 1 && (
                <Chip label={data.totalElements} size='small' color='primary' />
              )}
            </Box>
          } />
          <Tab label='Delivery Log' icon={<i className='ri-mail-check-line' />} iconPosition='start' />
          <Tab label='SMS Reminders' icon={<i className='ri-message-3-line' />} iconPosition='start' />
        </Tabs>
      </Box>

      {/* ── Delivery Log (tab 2) ────────────────────────────────────────────── */}
      {tab === 2 && (
        <Card variant='outlined' sx={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          {dlError && <Alert severity='error' sx={{ m: 2 }}>{dlError}</Alert>}
          {dlLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Box key={i} sx={{ px: 3, py: 2 }}>
                <Skeleton variant='text' width='40%' />
                <Skeleton variant='text' width='70%' />
              </Box>
            ))
          ) : !dlData?.data?.length ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <i className='ri-mail-line' style={{ fontSize: '3rem', color: 'var(--mui-palette-text-disabled)' }} />
              <Typography color='text.secondary' sx={{ mt: 1 }}>No email or SMS notifications sent yet</Typography>
            </Box>
          ) : (
            <Box component='table' sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component='thead'>
                <Box component='tr' sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                  {['Type', 'Recipient', 'Subject', 'Status', 'Sent'].map(h => (
                    <Box component='th' key={h} sx={{ px: 2, py: 1.5, textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</Box>
                  ))}
                </Box>
              </Box>
              <Box component='tbody'>
                {dlData.data.map((n, idx) => (
                  <Box component='tr' key={n.id} sx={{ borderBottom: idx < (dlData.data?.length ?? 0) - 1 ? '1px solid' : 'none', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}>
                    <Box component='td' sx={{ px: 2, py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <i className={typeIcon(n.type)} style={{ fontSize: '1rem', opacity: 0.7 }} />
                        <Typography variant='caption' fontWeight={600}>{n.type}</Typography>
                      </Box>
                    </Box>
                    <Box component='td' sx={{ px: 2, py: 1.5 }}>
                      <Typography variant='caption' sx={{ fontFamily: 'monospace' }}>{n.recipientAddress}</Typography>
                    </Box>
                    <Box component='td' sx={{ px: 2, py: 1.5 }}>
                      <Typography variant='caption' color='text.secondary'>{n.subject ?? '—'}</Typography>
                    </Box>
                    <Box component='td' sx={{ px: 2, py: 1.5 }}>
                      <Chip label={n.status} size='small' color={statusColor(n.status)} variant='tonal' />
                    </Box>
                    <Box component='td' sx={{ px: 2, py: 1.5 }}>
                      <Typography variant='caption' color='text.disabled'>{relativeTime(n.createdAt)}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Card>
      )}

      {/* ── SMS Reminder Log (tab 3) ─────────────────────────────────────────── */}
      {tab === 3 && (
        <Card variant='outlined' sx={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          {rlError && <Alert severity='error' sx={{ m: 2 }}>{rlError}</Alert>}
          {rlLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Box key={i} sx={{ px: 3, py: 2 }}>
                <Skeleton variant='text' width='50%' />
                <Skeleton variant='text' width='30%' />
              </Box>
            ))
          ) : !rlData?.content?.length ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <i className='ri-message-3-line' style={{ fontSize: '3rem', color: 'var(--mui-palette-text-disabled)' }} />
              <Typography color='text.secondary' sx={{ mt: 1 }}>No SMS reminders sent yet</Typography>
              <Typography variant='caption' color='text.disabled' sx={{ mt: 0.5, display: 'block' }}>
                Reminders are sent automatically based on your payment settings
              </Typography>
            </Box>
          ) : (
            <>
              <Box component='table' sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <Box component='thead'>
                  <Box component='tr' sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                    {['Channel', 'Number', 'Type', 'Status', 'Sent'].map(h => (
                      <Box component='th' key={h} sx={{ px: 2, py: 1.5, textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</Box>
                    ))}
                  </Box>
                </Box>
                <Box component='tbody'>
                  {rlData.content.map((r, idx) => (
                    <Box component='tr' key={r.id} sx={{ borderBottom: idx < (rlData.content?.length ?? 0) - 1 ? '1px solid' : 'none', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}>
                      <Box component='td' sx={{ px: 2, py: 1.5 }}>
                        <Chip label={r.channel} size='small' variant='outlined' color={r.channel === 'WHATSAPP' ? 'success' : 'info'} />
                      </Box>
                      <Box component='td' sx={{ px: 2, py: 1.5 }}>
                        <Typography variant='caption' sx={{ fontFamily: 'monospace' }}>{r.phoneNumber}</Typography>
                      </Box>
                      <Box component='td' sx={{ px: 2, py: 1.5 }}>
                        <Typography variant='caption' color='text.secondary'>{r.reminderType.replace(/_/g, ' ')}</Typography>
                      </Box>
                      <Box component='td' sx={{ px: 2, py: 1.5 }}>
                        <Chip label={r.status} size='small' color={r.status === 'SENT' ? 'success' : 'error'} variant='tonal' />
                      </Box>
                      <Box component='td' sx={{ px: 2, py: 1.5 }}>
                        <Typography variant='caption' color='text.disabled'>{relativeTime(r.sentAt)}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Divider />
              <TablePagination
                component='div'
                count={rlData.totalElements}
                page={rlPage}
                rowsPerPage={rlRPP}
                rowsPerPageOptions={[10, 20, 50]}
                onPageChange={(_, p) => setRlPage(p)}
                onRowsPerPageChange={e => { setRlRPP(Number(e.target.value)); setRlPage(0) }}
              />
            </>
          )}
        </Card>
      )}

      {/* List — In-app (tabs 0 + 1 only) */}
      {(tab === 0 || tab === 1) && (
      <Card variant='outlined' sx={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        {error && <Alert severity='error' sx={{ m: 2 }}>{error}</Alert>}

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Box key={i}>
              <Box sx={{ display: 'flex', gap: 2, px: 3, py: 2, alignItems: 'flex-start' }}>
                <Skeleton variant='circular' width={40} height={40} sx={{ flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant='text' width='60%' height={20} />
                  <Skeleton variant='text' width='80%' height={16} />
                  <Skeleton variant='text' width='20%' height={14} />
                </Box>
              </Box>
              {i < 4 && <Divider />}
            </Box>
          ))
        ) : !data?.content?.length ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <i
              className='ri-notification-off-line'
              style={{ fontSize: '3rem', color: 'var(--mui-palette-text-disabled)' }}
            />
            <Typography color='text.secondary' sx={{ mt: 1 }}>
              {tab === 1 ? 'No unread notifications' : 'No notifications yet'}
            </Typography>
          </Box>
        ) : (
          <>
            {data.content.map((n, idx) => (
              <Box key={n.id}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    px: 3,
                    py: 2.5,
                    alignItems: 'flex-start',
                    bgcolor: n.read ? 'transparent' : 'action.hover',
                    cursor: n.read ? 'default' : 'pointer',
                    '&:hover': { bgcolor: 'action.selected' },
                    transition: 'background-color 0.15s'
                  }}
                  onClick={() => handleMarkRead(n)}
                >
                  {/* Icon */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      flexShrink: 0,
                      bgcolor: `${entityColor(n.entityType)}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i
                      className={entityIcon(n.entityType)}
                      style={{ fontSize: '1.2rem', color: entityColor(n.entityType) }}
                    />
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography
                        variant='body2'
                        fontWeight={n.read ? 400 : 600}
                        sx={{ flex: 1 }}
                      >
                        {n.title}
                      </Typography>
                      {!n.read && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            flexShrink: 0,
                            mt: 0.75
                          }}
                        />
                      )}
                    </Box>
                    {n.body && (
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ display: 'block', mt: 0.25 }}
                      >
                        {n.body}
                      </Typography>
                    )}
                    <Typography
                      variant='caption'
                      color='text.disabled'
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      {relativeTime(n.createdAt)}
                    </Typography>
                  </Box>

                  {/* Mark read action */}
                  {!n.read && (
                    <Tooltip title='Mark as read'>
                      <IconButton
                        size='small'
                        onClick={e => { e.stopPropagation(); handleMarkRead(n) }}
                        sx={{ flexShrink: 0 }}
                      >
                        <i className='ri-check-line' style={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                {idx < (data.content?.length ?? 0) - 1 && <Divider />}
              </Box>
            ))}

            <Divider />
            <TablePagination
              component='div'
              count={data.totalElements}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[10, 20, 50]}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={e => { setRPP(Number(e.target.value)); setPage(0) }}
            />
          </>
        )}
      </Card>
      )}
    </Box>
  )
}
