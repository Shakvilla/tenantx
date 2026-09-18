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
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'

import { getMySmsCreditRequests, cancelSmsCreditRequest, type SmsCreditTopUpRequestDto } from '@/lib/api/sms-credit'

const STATUS_COLOR: Record<string, 'warning' | 'success' | 'error' | 'info' | 'default'> = {
  REQUESTED: 'info',
  PAYMENT_PENDING: 'warning',
  ESCROW: 'warning',
  APPROVED: 'success',
  COMPLETED: 'success',
  REJECTED: 'error',
  REFUNDED: 'default'
}

const CANCELLABLE_STATUSES = new Set(['REQUESTED', 'PAYMENT_PENDING', 'ESCROW'])

export default function SmsCreditRequestHistory({ refreshKey }: { refreshKey?: number }) {
  const [requests, setRequests] = useState<SmsCreditTopUpRequestDto[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    getMySmsCreditRequests()
      .then(res => setRequests(res.content || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [refreshKey])

  const handleCancel = async (id: string) => {
    setCancelling(id)
    setError(null)
    try {
      await cancelSmsCreditRequest(id)
      load()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to cancel request')
    } finally {
      setCancelling(null)
    }
  }

  if (loading) return <CircularProgress size={24} />

  if (requests.length === 0) {
    return (
      <Card variant='outlined'>
        <CardHeader title='Request History' />
        <Divider />
        <CardContent>
          <Typography variant='body2' color='text.disabled'>
            No SMS credit requests yet.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant='outlined'>
      <CardHeader title='Request History' />
      <Divider />
      {error && <Alert severity='error' sx={{ m: 2 }}>{error}</Alert>}
      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Amount</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested</TableCell>
              <TableCell>Note</TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map(r => (
              <TableRow key={r.id}>
                <TableCell>GHS {r.amount.toFixed(2)}</TableCell>
                <TableCell>{r.paymentMethod}</TableCell>
                <TableCell>
                  <Chip label={r.status} color={STATUS_COLOR[r.status] || 'default'} size='small' />
                </TableCell>
                <TableCell>{new Date(r.requestedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {r.rejectionReason || (r.status === 'COMPLETED' ? 'Credits granted' : '')}
                </TableCell>
                <TableCell align='right'>
                  {CANCELLABLE_STATUSES.has(r.status) && (
                    <Button
                      size='small'
                      variant='outlined'
                      color='error'
                      onClick={() => handleCancel(r.id)}
                      disabled={cancelling === r.id}
                    >
                      {cancelling === r.id ? <CircularProgress size={14} /> : 'Cancel'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}
