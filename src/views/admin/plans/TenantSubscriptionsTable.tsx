'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

// API Imports
import { getAllSubscriptions, type TenantSubscriptionSummaryDto } from '@/lib/api/admin-auth-client'

/**
 * Who is on which plan.
 *
 * Lifted out of `AdminSubscriptionsView`, which had grown to 988 lines doing two unrelated jobs:
 * authoring plans, and watching tenants' subscriptions. The authoring half moved to the plan
 * editor; this is what remained, and it reads better on its own.
 */
const TenantSubscriptionsTable = () => {
  const [subs, setSubs] = useState<TenantSubscriptionSummaryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    getAllSubscriptions(page, pageSize)
      .then(res => {
        setSubs(res.content)
        setTotal(res.totalElements)
      })
      .finally(() => setLoading(false))
  }, [page, pageSize])

  return (
    <>
      <Typography variant='h6' fontWeight={700} sx={{ mt: 4, mb: 2 }}>
        Tenant Subscriptions
      </Typography>

      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ p: 3 }}>
              <Skeleton variant='rectangular' height={120} sx={{ borderRadius: 1 }} />
            </Box>
          ) : subs.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography variant='body2' color='text.secondary'>
                No subscriptions yet.
              </Typography>
            </Box>
          ) : (
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Tenant</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align='right'>Billed Units</TableCell>
                  <TableCell>Period End</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subs.map(s => (
                  <TableRow key={s.tenantId} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>
                        {s.tenantName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {s.tenantId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={s.planDisplayName}
                        size='small'
                        color={s.planName === 'PRO' ? 'success' : s.planName === 'BASIC' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={s.status}
                        size='small'
                        variant='outlined'
                        color={s.status === 'ACTIVE' ? 'success' : s.status === 'PAST_DUE' ? 'error' : 'default'}
                      />
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2'>{s.billedUnitCount ?? '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='caption'>
                        {s.currentPeriodEnd
                          ? new Date(s.currentPeriodEnd).toLocaleDateString('en-GH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {s.pendingPlanName && (
                        <Typography variant='caption' color='warning.main'>
                          Downgrades to {s.pendingPlanName} at period end
                        </Typography>
                      )}
                      {s.cancelledAt && !s.pendingPlanName && (
                        <Typography variant='caption' color='error.main'>
                          Cancelled
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && total > 0 && (
            <TablePagination
              component='div'
              count={total}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={e => {
                setPageSize(parseInt(e.target.value, 10))
                setPage(0)
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default TenantSubscriptionsTable
