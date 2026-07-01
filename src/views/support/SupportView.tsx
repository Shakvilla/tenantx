'use client'

import { useState } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'

import { useAuth } from '@/contexts/AuthContext'
import { submitTicket, submitFeedback, type TicketPriority, type FeedbackCategory } from '@/lib/api/support-client'

// ---------------------------------------------------------------------------
// Star rating component
// ---------------------------------------------------------------------------

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <Box
          key={star}
          component='span'
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          sx={{ cursor: 'pointer', fontSize: '2rem', lineHeight: 1, userSelect: 'none' }}
        >
          <i
            className={(hover || value) >= star ? 'ri-star-fill' : 'ri-star-line'}
            style={{ color: (hover || value) >= star ? '#F59E0B' : 'var(--mui-palette-text-disabled)' }}
          />
        </Box>
      ))}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Submit ticket tab
// ---------------------------------------------------------------------------

function TicketTab({ tenantId, email }: { tenantId: string; email: string }) {
  const [subject,  setSubject]  = useState('')
  const [body,     setBody]     = useState('')
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM')
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    setLoading(true)
    setError(null)
    try {
      await submitTicket({ tenantId, submitterEmail: email, subject: subject.trim(), body: body.trim(), priority })
      setSuccess(true)
      setSubject('')
      setBody('')
      setPriority('MEDIUM')
    } catch {
      setError('Failed to submit ticket. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <i className='ri-checkbox-circle-line' style={{ fontSize: '3rem', color: 'var(--mui-palette-success-main)' }} />
        <Typography variant='h6' fontWeight={700} sx={{ mt: 2 }}>Ticket submitted!</Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          Our team will get back to you at <strong>{email}</strong>.
        </Typography>
        <Button sx={{ mt: 3 }} variant='outlined' onClick={() => setSuccess(false)}>Submit another</Button>
      </Box>
    )
  }

  return (
    <Box component='form' onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && <Alert severity='error' onClose={() => setError(null)}>{error}</Alert>}

      <TextField
        label='Subject'
        placeholder='Briefly describe your issue'
        value={subject}
        onChange={e => setSubject(e.target.value)}
        required
        fullWidth
      />

      <TextField
        label='Priority'
        select
        value={priority}
        onChange={e => setPriority(e.target.value as TicketPriority)}
        fullWidth
      >
        <MenuItem value='LOW'>Low</MenuItem>
        <MenuItem value='MEDIUM'>Medium</MenuItem>
        <MenuItem value='HIGH'>High</MenuItem>
      </TextField>

      <TextField
        label='Description'
        placeholder='Describe your issue in detail...'
        value={body}
        onChange={e => setBody(e.target.value)}
        required
        fullWidth
        multiline
        rows={5}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type='submit'
          variant='contained'
          disabled={loading || !subject.trim() || !body.trim()}
          startIcon={loading ? <CircularProgress size={14} color='inherit' /> : <i className='ri-send-plane-line' />}
        >
          {loading ? 'Submitting…' : 'Submit ticket'}
        </Button>
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Feedback tab
// ---------------------------------------------------------------------------

const FEEDBACK_CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: 'GENERAL',         label: 'General' },
  { value: 'BILLING',         label: 'Billing' },
  { value: 'MAINTENANCE',     label: 'Maintenance' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
  { value: 'OTHER',           label: 'Other' },
]

function FeedbackTab({ tenantId, email }: { tenantId: string; email: string }) {
  const [rating,   setRating]   = useState(0)
  const [category, setCategory] = useState<FeedbackCategory>('GENERAL')
  const [message,  setMessage]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0 || !message.trim()) return
    setLoading(true)
    setError(null)
    try {
      await submitFeedback({ tenantId, submitterEmail: email, rating, category, message: message.trim() })
      setSuccess(true)
      setRating(0)
      setCategory('GENERAL')
      setMessage('')
    } catch {
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <i className='ri-heart-line' style={{ fontSize: '3rem', color: 'var(--mui-palette-error-main)' }} />
        <Typography variant='h6' fontWeight={700} sx={{ mt: 2 }}>Thanks for your feedback!</Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          We read every response and use it to improve the platform.
        </Typography>
        <Button sx={{ mt: 3 }} variant='outlined' onClick={() => setSuccess(false)}>Submit more</Button>
      </Box>
    )
  }

  return (
    <Box component='form' onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && <Alert severity='error' onClose={() => setError(null)}>{error}</Alert>}

      <Box>
        <Typography variant='body2' fontWeight={600} sx={{ mb: 1 }}>
          Overall rating <span style={{ color: 'var(--mui-palette-error-main)' }}>*</span>
        </Typography>
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && (
          <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
            {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
          </Typography>
        )}
      </Box>

      <TextField
        label='Category'
        select
        value={category}
        onChange={e => setCategory(e.target.value as FeedbackCategory)}
        fullWidth
      >
        {FEEDBACK_CATEGORIES.map(c => (
          <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
        ))}
      </TextField>

      <TextField
        label='Message'
        placeholder='Tell us what you think...'
        value={message}
        onChange={e => setMessage(e.target.value)}
        required
        fullWidth
        multiline
        rows={4}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type='submit'
          variant='contained'
          disabled={loading || rating === 0 || !message.trim()}
          startIcon={loading ? <CircularProgress size={14} color='inherit' /> : <i className='ri-star-line' />}
        >
          {loading ? 'Submitting…' : 'Send feedback'}
        </Button>
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function SupportView() {
  const { user, tenant } = useAuth()
  const [tab, setTab] = useState(0)

  const tenantId = tenant?.id ?? ''
  const email    = user?.email ?? ''

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      {/* Contact info strip */}
      <Card variant='outlined' sx={{ mb: 3, bgcolor: 'action.hover' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
          <i className='ri-customer-service-2-line' style={{ fontSize: '1.5rem', color: 'var(--mui-palette-primary-main)' }} />
          <Box>
            <Typography variant='body2' fontWeight={600}>Need help?</Typography>
            <Typography variant='caption' color='text.secondary'>
              Submit a support ticket and our team will respond within 1 business day.
              Responses go to <strong>{email}</strong>.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card variant='outlined'>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}
        >
          <Tab label='Support Ticket' icon={<i className='ri-customer-service-line' />} iconPosition='start' />
          <Tab label='Send Feedback' icon={<i className='ri-star-line' />} iconPosition='start' />
        </Tabs>

        <Divider />

        <CardContent sx={{ pt: 3 }}>
          {tab === 0 && <TicketTab tenantId={tenantId} email={email} />}
          {tab === 1 && <FeedbackTab tenantId={tenantId} email={email} />}
        </CardContent>
      </Card>
    </Box>
  )
}
