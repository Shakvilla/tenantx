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
import { getAdminPlans, type PlanSummary, type PlanStatus } from '@/lib/api/subscription-plans-admin'

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

  useEffect(() => {
    getAdminPlans()
      .then(setPlans)
      .catch(() => setError('Could not load plans.'))
  }, [])

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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

export default PlanList
