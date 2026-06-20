'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import {
  getCommissionsForAgent,
  getCommissionStats,
  recordCommission,
  markCommissionPaid,
  cancelCommission
} from '@/lib/api/agents'
import type { AgentType, AgentCommission, AgentCommissionStats } from '@/types/members/agentTypes'
import { formatCurrency } from '@/utils/currency'

const statusColor: Record<string, 'warning' | 'success' | 'error'> = {
  pending:   'warning',
  paid:      'success',
  cancelled: 'error'
}

interface Props {
  open: boolean
  agent: AgentType | null
  onClose: () => void
}

const AgentCommissionsDialog = ({ open, agent, onClose }: Props) => {
  const [commissions, setCommissions] = useState<AgentCommission[]>([])
  const [stats, setStats]             = useState<AgentCommissionStats | null>(null)
  const [loading, setLoading]         = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  })

  // Record form state
  const [amount, setAmount]       = useState('')
  const [currency, setCurrency]   = useState('GHS')
  const [commDate, setCommDate]   = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes]         = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!agent) return
    setLoading(true)
    try {
      const [comms, s] = await Promise.all([
        getCommissionsForAgent(agent.id),
        getCommissionStats(agent.id)
      ])
      setCommissions(comms)
      setStats(s)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [agent])

  useEffect(() => {
    if (open && agent) load()
  }, [open, agent, load])

  const handleMarkPaid = async (id: string) => {
    setActionLoading(id)
    try {
      const updated = await markCommissionPaid(id)
      setCommissions(prev => prev.map(c => c.id === id ? updated : c))
      await load()
      setSnackbar({ open: true, message: 'Commission marked as paid', severity: 'success' })
    } catch (err) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Failed', severity: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (id: string) => {
    setActionLoading(id)
    try {
      const updated = await cancelCommission(id)
      setCommissions(prev => prev.map(c => c.id === id ? updated : c))
      await load()
      setSnackbar({ open: true, message: 'Commission cancelled', severity: 'success' })
    } catch (err) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Failed', severity: 'error' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRecord = async () => {
    if (!agent || !amount || !commDate) return
    setSubmitting(true)
    try {
      await recordCommission({
        agentId: agent.id,
        amount: Number(amount),
        currency,
        commissionDate: commDate,
        notes: notes || undefined
      })
      setShowRecordForm(false)
      setAmount('')
      setNotes('')
      await load()
      setSnackbar({ open: true, message: 'Commission recorded', severity: 'success' })
    } catch (err) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Failed', severity: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!agent) return null

  const commissionLabel = agent.commissionType === 'percentage'
    ? `${agent.commissionRate}%`
    : formatCurrency(agent.commissionRate, 'GHS')

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <div className='flex items-center justify-between'>
          <div>
            <Typography variant='h5'>{agent.name}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Commission rate: <strong>{commissionLabel}</strong> per deal
            </Typography>
          </div>
          <IconButton onClick={onClose}><i className='ri-close-line' /></IconButton>
        </div>
      </DialogTitle>
      <Divider />
      <DialogContent className='flex flex-col gap-4 pt-4'>

        {/* Stats */}
        {stats && (
          <Grid container spacing={3}>
            {[
              { label: 'Total Commissions', value: stats.total, sub: '' },
              { label: 'Pending', value: formatCurrency(stats.pendingAmount), sub: `${stats.pending} records`, color: 'warning.main' },
              { label: 'Paid Out', value: formatCurrency(stats.paidAmount), sub: `${stats.paid} records`, color: 'success.main' },
            ].map(item => (
              <Grid key={item.label} size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{ p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}
                >
                  <Typography variant='h5' color={item.color}>{item.value}</Typography>
                  <Typography variant='caption' color='text.secondary'>{item.label}</Typography>
                  {item.sub && <Typography variant='caption' display='block' color='text.disabled'>{item.sub}</Typography>}
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Record form toggle */}
        <div className='flex justify-between items-center'>
          <Typography variant='subtitle1' className='font-medium'>Commission History</Typography>
          <Button
            size='small'
            variant='contained'
            startIcon={<i className='ri-add-line' />}
            onClick={() => setShowRecordForm(v => !v)}
          >
            Record Commission
          </Button>
        </div>

        {showRecordForm && (
          <Box sx={{ p: 2, border: '1px dashed', borderColor: 'primary.main', borderRadius: 1 }}>
            <Typography variant='subtitle2' className='mb-3'>New Commission Entry</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth size='small' type='number' label='Amount *'
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position='start'>GHS</InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth size='small' type='date' label='Commission Date *'
                  value={commDate}
                  onChange={e => setCommDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth size='small' label='Notes'
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </Grid>
            </Grid>
            <div className='flex justify-end gap-2 mt-3'>
              <Button size='small' onClick={() => setShowRecordForm(false)}>Cancel</Button>
              <Button size='small' variant='contained' onClick={handleRecord} disabled={submitting || !amount}>
                {submitting ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </Box>
        )}

        {/* Table */}
        {loading ? (
          <Box display='flex' justifyContent='center' py={4}><CircularProgress /></Box>
        ) : commissions.length === 0 ? (
          <Typography color='text.secondary' textAlign='center' py={4}>No commissions recorded yet.</Typography>
        ) : (
          <div className='overflow-x-auto'>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                  {['Date', 'Amount', 'Status', 'Notes', 'Paid At', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: 'rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13 }}>
                      {format(new Date(c.commissionDate), 'dd MMM yyyy')}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600 }}>
                      {formatCurrency(c.amount, c.currency)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <Chip
                        label={c.status}
                        size='small'
                        color={statusColor[c.status] || 'default'}
                        variant='tonal'
                        className='capitalize'
                      />
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>
                      {c.notes || '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>
                      {c.paidAt ? format(new Date(c.paidAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div className='flex items-center gap-1'>
                        {c.status === 'pending' && (
                          <Tooltip title='Mark as paid'>
                            <IconButton
                              size='small'
                              color='success'
                              disabled={actionLoading === c.id}
                              onClick={() => handleMarkPaid(c.id)}
                            >
                              {actionLoading === c.id
                                ? <CircularProgress size={14} />
                                : <i className='ri-check-line text-sm' />}
                            </IconButton>
                          </Tooltip>
                        )}
                        {c.status === 'pending' && (
                          <Tooltip title='Cancel'>
                            <IconButton
                              size='small'
                              color='error'
                              disabled={actionLoading === c.id}
                              onClick={() => handleCancel(c.id)}
                            >
                              <i className='ri-close-line text-sm' />
                            </IconButton>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  )
}

export default AgentCommissionsDialog
