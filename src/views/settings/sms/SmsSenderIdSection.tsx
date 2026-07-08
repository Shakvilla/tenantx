'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Grid from '@mui/material/Grid2'

import CustomAvatar from '@core/components/mui/Avatar'

import {
  createSenderIdRequest,
  getMySenderIdRequests,
  getSmsCreditAccount,
  fundSmsCreditFromWallet,
  fundSmsCreditViaGateway,
  type SenderIdRequestDto,
  type SmsCreditAccountDto
} from '@/lib/api/sms-credit'

const STATUS_COLOR: Record<SenderIdRequestDto['status'], 'warning' | 'success' | 'error'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error'
}

export default function SmsSenderIdSection() {
  const [requests, setRequests] = useState<SenderIdRequestDto[]>([])
  const [loading, setLoading] = useState(true)
  const [senderId, setSenderId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [account, setAccount] = useState<SmsCreditAccountDto | null>(null)
  const [fundOpen, setFundOpen] = useState(false)
  const [fundMethod, setFundMethod] = useState<'WALLET' | 'MOMO'>('WALLET')
  const [fundAmount, setFundAmount] = useState('')
  const [fundMobile, setFundMobile] = useState('')
  const [funding, setFunding] = useState(false)
  const [fundError, setFundError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    getMySenderIdRequests()
      .then(setRequests)
      .catch(() => setError('Failed to load sender ID status'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    getSmsCreditAccount()
      .then(setAccount)
      .catch(() => {})
  }, [requests])

  const latest = requests[0]
  const hasActive = requests.some(r => r.status === 'APPROVED')
  const canRequest = !latest || latest.status === 'REJECTED'

  async function handleSubmit() {
    if (!senderId.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      await createSenderIdRequest(senderId.trim())
      setSenderId('')
      load()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFund() {
    const amt = parseFloat(fundAmount)

    if (!amt || amt <= 0) {
      setFundError('Enter a valid amount')

      return
    }

    setFunding(true)
    setFundError(null)

    try {
      if (fundMethod === 'WALLET') {
        await fundSmsCreditFromWallet(amt)
      } else {
        const result = await fundSmsCreditViaGateway(amt, fundMobile.trim())

        if (result.redirectUrl) {
          window.location.href = result.redirectUrl

          return
        }
      }

      setFundOpen(false)
      setFundAmount('')
      load()
      getSmsCreditAccount()
        .then(setAccount)
        .catch(() => {})
    } catch (e: any) {
      setFundError(e?.response?.data?.message ?? 'Funding failed')
    } finally {
      setFunding(false)
    }
  }

  return (
    <>
      <Card variant='outlined'>
        <CardHeader
          title='Sender ID Request'
          subheader='Requires manual review and an SMS credit deposit before it becomes active.'
        />
        <Divider />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading ? (
            <CircularProgress size={24} />
          ) : latest ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip label={latest.status} color={STATUS_COLOR[latest.status]} size='small' />
              <Typography variant='body2'>
                Requested sender ID: <strong>{latest.requestedSenderId}</strong>
              </Typography>
            </Box>
          ) : (
            <Typography variant='body2' color='text.disabled'>
              No sender ID requested yet.
            </Typography>
          )}

          {latest?.status === 'REJECTED' && latest.rejectionReason && (
            <Alert severity='error'>{latest.rejectionReason}</Alert>
          )}
          {latest?.status === 'APPROVED' && !hasActive && (
            <Alert severity='info'>Approved! Fund your SMS account to activate this sender ID.</Alert>
          )}

          {error && <Alert severity='error'>{error}</Alert>}

          {canRequest && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                size='small'
                label='Desired sender ID'
                value={senderId}
                onChange={e => setSenderId(e.target.value)}
                disabled={submitting}
                helperText='Max 11 characters, letters/numbers only (FROG requirement)'
              />
              <Button
                variant='contained'
                onClick={handleSubmit}
                disabled={submitting || !senderId.trim()}
                startIcon={submitting ? <CircularProgress size={14} color='inherit' /> : undefined}
              >
                Request
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {account && (
        <Card variant='outlined' sx={{ mt: 6 }}>
          <CardHeader
            title='SMS Credit'
            action={
              <Button size='small' variant='outlined' onClick={() => setFundOpen(true)}>
                Top Up
              </Button>
            }
          />
          <Divider />
          <CardContent>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography>Balance</Typography>
                    <Typography variant='h4'>GHS {account.balance.toFixed(2)}</Typography>
                  </Box>
                  <CustomAvatar variant='rounded' skin='light' color='primary' size={44}>
                    <i className='ri-wallet-3-line text-[28px]' />
                  </CustomAvatar>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography>Messages Remaining</Typography>
                    <Typography variant='h4'>~{account.estimatedMessagesRemaining}</Typography>
                  </Box>
                  <CustomAvatar variant='rounded' skin='light' color='info' size={44}>
                    <i className='ri-message-2-line text-[28px]' />
                  </CustomAvatar>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Dialog open={fundOpen} onClose={() => setFundOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Top Up SMS Credit</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          {fundError && <Alert severity='error'>{fundError}</Alert>}
          <TextField
            size='small'
            label='Amount (GHS)'
            type='number'
            value={fundAmount}
            onChange={e => setFundAmount(e.target.value)}
          />
          <ToggleButtonGroup
            value={fundMethod}
            exclusive
            size='small'
            fullWidth
            onChange={(_, v) => {
              if (v) setFundMethod(v)
            }}
          >
            <ToggleButton value='WALLET'>Wallet</ToggleButton>
            <ToggleButton value='MOMO'>Mobile Money</ToggleButton>
          </ToggleButtonGroup>
          {fundMethod === 'MOMO' && (
            <TextField
              size='small'
              label='Mobile Money Number'
              value={fundMobile}
              onChange={e => setFundMobile(e.target.value)}
              placeholder='0241234567'
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFundOpen(false)} disabled={funding}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleFund}
            disabled={funding || !fundAmount || (fundMethod === 'MOMO' && !fundMobile.trim())}
            startIcon={funding ? <CircularProgress size={14} color='inherit' /> : undefined}
          >
            Top Up
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
