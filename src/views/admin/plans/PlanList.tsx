'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

// API Imports
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import {
  getAdminPlans,
  getPlanDetail,
  savePlan,
  deletePlan,
  PlanImpactRequired,
  type PlanSummary,
  type PlanStatus
} from '@/lib/api/subscription-plans-admin'

// Util Imports
import { headlinePrice } from './headlinePrice'

/**
 * Every plan, whatever its status.
 *
 * Deliberately unfiltered. Slice A's whole-branch review found the admin list sharing
 * `findAllByActiveTrue()` with the public pricing page, so a plan created as DRAFT appeared in no
 * listing at all and was reachable only through the id in its own 201 response. This list is the
 * reason that was fixed, and filtering here would put the hole straight back.
 */

const STATUS_COLOUR: Record<PlanStatus, 'success' | 'warning' | 'secondary'> = {
  ACTIVE: 'success',
  DRAFT: 'warning',
  ARCHIVED: 'secondary'
}

const PlanList = () => {
  const router = useRouter()

  const [plans, setPlans] = useState<PlanSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [archiving, setArchiving] = useState<PlanSummary | null>(null)
  const [deleting, setDeleting] = useState<PlanSummary | null>(null)
  const [busy, setBusy] = useState(false)

  /**
   * Why the server said no.
   *
   * Both actions are guarded server-side and the refusals are specific: a plan anyone has ever
   * been on cannot be deleted, and the plan new signups land on can be neither deleted nor
   * archived. Those messages explain what to do instead, so they are shown verbatim rather than
   * flattened into "something went wrong".
   */
  const [refusal, setRefusal] = useState<string | null>(null)

  const reload = () =>
    getAdminPlans()
      .then(setPlans)
      .catch(() => setError('Could not load plans.'))

  useEffect(() => {
    reload()
  }, [])

  const serverMessage = (err: any, fallback: string) =>
    err?.response?.data?.message ?? fallback

  /**
   * Archiving is an ordinary plan save with the status changed, so it goes through the same
   * guard rails and the same audit trail as any edit — rather than a side door that skips them.
   * The full detail is loaded first because the write replaces tiers, cycles and feature flags
   * wholesale: sending a partial body would delete them.
   */
  const archive = async (plan: PlanSummary) => {
    setBusy(true)
    setRefusal(null)

    try {
      const detail = await getPlanDetail(plan.id)
      const { id, subscriberCount, ...body } = detail

      await savePlan(plan.id, { ...body, status: 'ARCHIVED' })
      setArchiving(null)
      await reload()
    } catch (err: any) {
      if (err instanceof PlanImpactRequired) {
        // Archiving a plan people are on is a hard block server-side, so a 409 here means some
        // OTHER change is pending on the row. Sending it back with an acknowledgement would be
        // consenting to an impact nobody has seen.
        setRefusal('This plan has unsaved changes that need review. Open it in the editor first.')
      } else {
        setRefusal(serverMessage(err, 'Could not archive this plan.'))
      }
    } finally {
      setBusy(false)
    }
  }

  const remove = async (plan: PlanSummary) => {
    setBusy(true)
    setRefusal(null)

    try {
      await deletePlan(plan.id)
      setDeleting(null)
      await reload()
    } catch (err: any) {
      setRefusal(serverMessage(err, 'Could not delete this plan.'))
    } finally {
      setBusy(false)
    }
  }

  if (error) return <Alert severity='error'>{error}</Alert>
  if (!plans) return <Skeleton variant='rectangular' height={280} />

  return (
    <Card>
      <CardHeader
        title='Subscription plans'
        action={
          <Button
            variant='contained'
            startIcon={<i className='ri-add-line' />}
            onClick={() => router.push('/admin/subscriptions/plans/new')}
          >
            New plan
          </Button>
        }
      />

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Plan</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align='right'>Price</TableCell>
            <TableCell align='right'>Subscribers</TableCell>
            <TableCell align='right'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {plans.map(plan => (
            <TableRow key={plan.id}>
              <TableCell>
                <Box className='flex items-center gap-2'>
                  <Typography variant='body2' className='font-medium'>
                    {plan.displayName}
                  </Typography>
                  {plan.popular && <Chip size='small' label='Popular' color='primary' variant='tonal' />}
                </Box>
                <Typography variant='caption' color='text.secondary'>
                  {plan.code}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip size='small' label={plan.status} color={STATUS_COLOUR[plan.status]} variant='tonal' />
              </TableCell>
              <TableCell align='right'>{headlinePrice(plan)}</TableCell>
              <TableCell align='right'>{plan.subscriberCount}</TableCell>
              <TableCell align='right'>
                <IconButton
                  size='small'
                  aria-label={`Edit ${plan.displayName}`}
                  onClick={() => router.push(`/admin/subscriptions/plans/${plan.id}`)}
                >
                  <i className='ri-edit-line text-[20px]' />
                </IconButton>
                <IconButton
                  size='small'
                  aria-label={`Duplicate ${plan.displayName}`}
                  // Clone, edit, publish, migrate — the safe way to experiment with pricing
                  // without touching a plan people are already on.
                  onClick={() => router.push(`/admin/subscriptions/plans/new?from=${plan.id}`)}
                >
                  <i className='ri-file-copy-line text-[20px]' />
                </IconButton>
                {plan.status !== 'ARCHIVED' && (
                  <IconButton
                    size='small'
                    aria-label={`Archive ${plan.displayName}`}
                    // Archive, not delete, is the usual intent: it stops the plan being offered
                    // while keeping it readable for everyone who was ever on it.
                    onClick={() => setArchiving(plan)}
                  >
                    <i className='ri-archive-line text-[20px]' />
                  </IconButton>
                )}
                <IconButton
                  size='small'
                  color='error'
                  aria-label={`Delete ${plan.displayName}`}
                  onClick={() => setDeleting(plan)}
                >
                  <i className='ri-delete-bin-line text-[20px]' />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={Boolean(archiving)} onClose={() => { setArchiving(null); setRefusal(null) }} maxWidth='xs' fullWidth>
        <DialogTitle>Archive {archiving?.displayName}?</DialogTitle>
        <DialogContent>
          <Typography variant='body2'>
            It stops being offered to new customers. Anyone already on it stays on it, and their
            invoices remain readable.
          </Typography>
          {Boolean(archiving?.subscriberCount) && (
            <Alert severity='warning' sx={{ mt: 2 }}>
              {archiving?.subscriberCount} subscriber(s) are on this plan. The server refuses to
              archive a plan people are still on — move them first.
            </Alert>
          )}
          {refusal && <Alert severity='error' sx={{ mt: 2 }}>{refusal}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setArchiving(null); setRefusal(null) }}>Cancel</Button>
          <Button variant='contained' disabled={busy} onClick={() => archiving && archive(archiving)}>
            Archive
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleting)} onClose={() => { setDeleting(null); setRefusal(null) }} maxWidth='xs' fullWidth>
        <DialogTitle>Delete {deleting?.displayName}?</DialogTitle>
        <DialogContent>
          <Typography variant='body2'>
            This removes the plan permanently. Archiving keeps it readable and is almost always
            what you want instead.
          </Typography>
          {Boolean(deleting?.subscriberCount) && (
            <Alert severity='error' sx={{ mt: 2 }}>
              {deleting?.subscriberCount} subscriber(s) have been on this plan, so it cannot be
              deleted — their invoices are only readable while it exists. Archive it instead.
            </Alert>
          )}
          {refusal && <Alert severity='error' sx={{ mt: 2 }}>{refusal}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleting(null); setRefusal(null) }}>Cancel</Button>
          <Button color='error' variant='contained' disabled={busy} onClick={() => deleting && remove(deleting)}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default PlanList
