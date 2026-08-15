'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

// MUI Imports
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// API Imports
import { getJob, acceptJob, declineJob, DirectJobRequestError } from '@/lib/api/direct-jobs-public-client'
import type { DirectJobPublicView } from '@/lib/api/direct-jobs-public-client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JobLinkPageProps {
  token: string
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'rate-limited' }
  | { kind: 'load-error' }
  | { kind: 'loaded'; job: DirectJobPublicView }

type ActionState =
  | { kind: 'idle' }
  | { kind: 'submitting'; action: 'accept' | 'decline' }
  | { kind: 'accepted' }
  | { kind: 'declined' }
  | { kind: 'action-error'; message: string }

// ---------------------------------------------------------------------------
// Copy — see job-link-page-brief.md for the strings that must be verbatim
// ---------------------------------------------------------------------------

const PRIVATE_ARRANGEMENT_COPY =
  "This is a private arrangement between you and the tenant. TenantX isn't taking payment and isn't a party to the work."

const ACCEPTED_HEADLINE = 'Thanks — the tenant has been told you accepted.'
const ACCEPTED_BODY = "They'll contact you directly to arrange the work."

const DECLINED_HEADLINE = 'Thanks for letting us know.'
const DECLINED_BODY = "We've told the tenant you're not available."

const INVALID_HEADLINE = 'This job request link is no longer valid.'
const INVALID_BODY = 'It may have already been answered, or it may have expired.'

const RATE_LIMITED_HEADLINE = 'Too many attempts.'
const RATE_LIMITED_BODY = 'Please wait a minute and try again.'

const GENERIC_ERROR_HEADLINE = 'Something went wrong.'
const GENERIC_ERROR_BODY = "We couldn't load this job request. Please try again."

function alreadyAnsweredCopy(status: DirectJobPublicView['status']): string {
  switch (status) {
    case 'ACCEPTED':
      return "You've already accepted this job — the tenant will be in touch."
    case 'DECLINED':
      return "You've already declined this job."
    case 'EXPIRED':
      return 'This job request has expired.'
    case 'COMPLETED':
      return 'This job has already been completed.'
    case 'CANCELLED':
      return 'This job request was cancelled by the tenant.'
    default:
      return 'This job request has already been answered.'
  }
}

// ---------------------------------------------------------------------------
// Small layout helpers
// ---------------------------------------------------------------------------

function PageShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', px: 4, py: 8, minHeight: '100vh' }}>{children}</Box>
  )
}

function CenteredMessage({ headline, body }: { headline: string; body: string }) {
  return (
    <Box
      sx={{
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center'
      }}
    >
      <Typography variant='h6' gutterBottom>
        {headline}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        {body}
      </Typography>
    </Box>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant='body2' color='text.secondary'>
        {label}
      </Typography>
      <Typography variant='body2' fontWeight={600} sx={{ textAlign: 'right' }}>
        {value}
      </Typography>
    </Box>
  )
}

/**
 * Renders only fields DirectJobDto.PublicView actually returns. Nothing here
 * ever recovers occupant identity — city and region are all the location a
 * maintainer gets.
 */
function JobSummary({ job }: { job: DirectJobPublicView }) {
  return (
    <Card variant='outlined'>
      <CardContent>
        {job.category && <Chip label={job.category} color='primary' size='small' sx={{ mb: 2 }} />}
        {job.description && (
          <Typography variant='body1' sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
            {job.description}
          </Typography>
        )}
        <Stack spacing={1}>
          {job.preferredTiming && <DetailRow label='Preferred timing' value={job.preferredTiming} />}
          {job.city && <DetailRow label='City' value={job.city} />}
          {job.region && <DetailRow label='Region' value={job.region} />}
        </Stack>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function JobLinkPage({ token }: JobLinkPageProps) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [action, setAction] = useState<ActionState>({ kind: 'idle' })
  const [reason, setReason] = useState('')

  const load = useCallback(async () => {
    setState({ kind: 'loading' })

    try {
      const job = await getJob(token)

      setState({ kind: 'loaded', job })
    } catch (err) {
      if (err instanceof DirectJobRequestError) {
        if (err.status === 404) {
          setState({ kind: 'invalid' })

          return
        }

        if (err.status === 429) {
          setState({ kind: 'rate-limited' })

          return
        }
      }

      setState({ kind: 'load-error' })
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  async function handleAccept() {
    setAction({ kind: 'submitting', action: 'accept' })

    try {
      await acceptJob(token)
      setAction({ kind: 'accepted' })
    } catch (err) {
      await handleActionError(err)
    }
  }

  async function handleDecline() {
    setAction({ kind: 'submitting', action: 'decline' })

    try {
      const trimmed = reason.trim()

      await declineJob(token, trimmed === '' ? undefined : trimmed)
      setAction({ kind: 'declined' })
    } catch (err) {
      await handleActionError(err)
    }
  }

  async function handleActionError(err: unknown) {
    // Someone else answered first (or this maintainer double-submitted) —
    // re-fetch so the "already answered" state reflects the real status
    // rather than guessing at what happened.
    if (err instanceof DirectJobRequestError && err.status === 409) {
      setAction({ kind: 'idle' })
      await load()

      return
    }

    if (err instanceof DirectJobRequestError && err.status === 429) {
      setAction({ kind: 'action-error', message: `${RATE_LIMITED_HEADLINE} ${RATE_LIMITED_BODY}` })

      return
    }

    setAction({ kind: 'action-error', message: 'Something went wrong. Please try again.' })
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (state.kind === 'loading') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress aria-label='Loading job request' />
      </Box>
    )
  }

  // ── Invalid link (404) ────────────────────────────────────────────────
  if (state.kind === 'invalid') {
    return (
      <PageShell>
        <CenteredMessage headline={INVALID_HEADLINE} body={INVALID_BODY} />
      </PageShell>
    )
  }

  // ── Rate limited (429) ────────────────────────────────────────────────
  if (state.kind === 'rate-limited') {
    return (
      <PageShell>
        <CenteredMessage headline={RATE_LIMITED_HEADLINE} body={RATE_LIMITED_BODY} />
      </PageShell>
    )
  }

  // ── Other load failure (network, 5xx) — unlike the invalid-link state,
  //    there IS something to retry here. ──────────────────────────────────
  if (state.kind === 'load-error') {
    return (
      <PageShell>
        <Box sx={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          <Typography variant='h6' gutterBottom>
            {GENERIC_ERROR_HEADLINE}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            {GENERIC_ERROR_BODY}
          </Typography>
          <Button variant='outlined' onClick={() => void load()} sx={{ alignSelf: 'center' }}>
            Try again
          </Button>
        </Box>
      </PageShell>
    )
  }

  const { job } = state

  // ── Just accepted (this visitor's own action) ────────────────────────
  if (action.kind === 'accepted') {
    return (
      <PageShell>
        <CenteredMessage headline={ACCEPTED_HEADLINE} body={ACCEPTED_BODY} />
      </PageShell>
    )
  }

  // ── Just declined (this visitor's own action) ─────────────────────────
  if (action.kind === 'declined') {
    return (
      <PageShell>
        <CenteredMessage headline={DECLINED_HEADLINE} body={DECLINED_BODY} />
      </PageShell>
    )
  }

  // ── Already answered (loaded in a non-SENT state) ─────────────────────
  if (job.status !== 'SENT') {
    return (
      <PageShell>
        <Stack spacing={3}>
          <JobSummary job={job} />
          <Typography variant='body1'>{alreadyAnsweredCopy(job.status)}</Typography>
        </Stack>
      </PageShell>
    )
  }

  // ── Actionable ──────────────────────────────────────────────────────
  const submitting = action.kind === 'submitting'

  return (
    <PageShell>
      <Stack spacing={3}>
        <Typography variant='h5' fontWeight={700}>
          A tenant would like to hire you
        </Typography>

        <JobSummary job={job} />

        {action.kind === 'action-error' && <Alert severity='error'>{action.message}</Alert>}

        <Alert severity='info'>{PRIVATE_ARRANGEMENT_COPY}</Alert>

        <TextField
          label='Reason (optional)'
          placeholder="Let the tenant know why, if you'd like"
          helperText='Optional — only shown to the tenant if you decline'
          fullWidth
          multiline
          minRows={2}
          value={reason}
          onChange={e => setReason(e.target.value)}
          disabled={submitting}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button variant='contained' color='primary' fullWidth disabled={submitting} onClick={() => void handleAccept()}>
            {submitting && action.action === 'accept' ? 'Accepting…' : 'Accept'}
          </Button>
          <Button variant='outlined' color='error' fullWidth disabled={submitting} onClick={() => void handleDecline()}>
            {submitting && action.action === 'decline' ? 'Declining…' : 'Decline'}
          </Button>
        </Stack>
      </Stack>
    </PageShell>
  )
}
