'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'

import {
  getAdminSmsCreditRequests,
  approveSmsCreditRequest,
  rejectSmsCreditRequest,
  type SmsCreditTopUpRequestDto
} from '@/lib/api/sms-credit'

const STATUS_COLOR: Record<string, 'warning' | 'success' | 'error' | 'info' | 'default'> = {
  REQUESTED: 'info',
  PAYMENT_PENDING: 'warning',
  ESCROW: 'warning',
  APPROVED: 'success',
  COMPLETED: 'success',
  REJECTED: 'error',
  REFUNDED: 'default'
}

export default function SmsCreditRequestsList() {
  const [requests, setRequests] = useState<SmsCreditTopUpRequestDto[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    getAdminSmsCreditRequests('ESCROW')
      .then(res => setRequests(res.content || []))
      .catch(() => setError('Failed to load requests'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleApprove = async (id: string) => {
    setActionLoading(true)
    setError(null)
    try {
      await approveSmsCreditRequest(id)
      load()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Approval failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedId || !rejectReason.trim()) return
    setActionLoading(true)
    setError(null)
    try {
      await rejectSmsCreditRequest(selectedId, rejectReason.trim())
      setRejectDialogOpen(false)
      setSelectedId(null)
      setRejectReason('')
      load()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Rejection failed')
    } finally {
      setActionLoading(false)
    }
  }

  const openRejectDialog = (id: string) => {
    setSelectedId(id)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  if (loading) return <CircularProgress size={24} />

  return (
    <Card variant='outlined'>
      <CardHeader
        title='SMS Credit Top-Up Requests'
        subheader='Pending requests awaiting approval'
      />
      <Divider />
      <CardContent>
        {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

        {requests.length === 0 ? (
          <Typography variant='body2' color='text.disabled'>
            No pending requests.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant='outlined'>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Tenant</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.tenantId}</TableCell>
                    <TableCell>GHS {(r.escrowAmount || r.amount).toFixed(2)}</TableCell>
                    <TableCell>{r.paymentMethod}</TableCell>
                    <TableCell>
                      <Chip label={r.status} color={STATUS_COLOR[r.status] || 'default'} size='small' />
                    </TableCell>
                    <TableCell>{new Date(r.requestedAt).toLocaleDateString()}</TableCell>
                    <TableCell align='right'>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size='small'
                          variant='contained'
                          color='success'
                          onClick={() => handleApprove(r.id)}
                          disabled={actionLoading}
                        >
                          Approve
                        </Button>
                        <Button
                          size='small'
                          variant='outlined'
                          color='error'
                          onClick={() => openRejectDialog(r.id)}
                          disabled={actionLoading}
                        >
                          Reject
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Request</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label='Rejection Reason'
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder='e.g., Insufficient FROG credit, invalid request, etc.'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleReject}
            disabled={actionLoading || !rejectReason.trim()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
