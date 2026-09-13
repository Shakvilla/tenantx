'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'

import { getMySmsCreditRequests, type SmsCreditTopUpRequestDto } from '@/lib/api/sms-credit'

const STATUS_COLOR: Record<string, 'warning' | 'success' | 'error' | 'info' | 'default'> = {
  REQUESTED: 'info',
  PAYMENT_PENDING: 'warning',
  ESCROW: 'warning',
  APPROVED: 'success',
  COMPLETED: 'success',
  REJECTED: 'error',
  REFUNDED: 'default'
}

export default function SmsCreditRequestHistory() {
  const [requests, setRequests] = useState<SmsCreditTopUpRequestDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMySmsCreditRequests()
      .then(res => setRequests(res.content || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Amount</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested</TableCell>
              <TableCell>Note</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}
