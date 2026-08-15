'use client'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Rating from '@mui/material/Rating'
import Divider from '@mui/material/Divider'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// API Imports
import type { Maintainer } from '@/lib/api/maintenance'

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  maintainer: Maintainer | null
  onEdit: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'secondary'> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  SUSPENDED: 'error'
}

const formatDate = (d?: string | null) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ─── Component ───────────────────────────────────────────────────────────────

const ViewMaintainerDialog = ({ open, setOpen, maintainer, onEdit }: Props) => {
  if (!maintainer) return null

  const statusColor = STATUS_COLORS[maintainer.status?.toUpperCase()] ?? 'secondary'
  const completionRate = maintainer.totalJobs && maintainer.totalJobs > 0
    ? (((maintainer.completedJobs ?? 0) / maintainer.totalJobs) * 100).toFixed(1)
    : '0.0'

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between pbs-6 pbe-4 pli-6'>
        <Box className='flex items-center gap-3'>
          <CustomAvatar skin='light' size={56}>{getInitials(maintainer.name)}</CustomAvatar>
          <Box>
            <Typography variant='h6' component='span' className='font-medium'>{maintainer.name}</Typography>
            <Typography variant='body2' color='text.secondary'>{maintainer.email ?? '-'}</Typography>
          </Box>
        </Box>
        <IconButton size='small' onClick={() => setOpen(false)}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent className='flex flex-col gap-4 pbs-6'>
        {/* Status + Specializations */}
        <Box className='flex flex-wrap items-center gap-2'>
          <Chip variant='tonal' label={maintainer.status} size='small' color={statusColor} className='capitalize' />
          {maintainer.specializations?.map(s => (
            <Chip key={s} variant='tonal' label={s} size='small' color='primary' />
          ))}
          {maintainer.isCompliant && (
            <Chip variant='tonal' label='Compliant' size='small' color='success' icon={<i className='ri-shield-check-line' />} />
          )}
        </Box>

        {/* Stats */}
        <Card variant='outlined'>
          <CardContent className='flex flex-col gap-3'>
            <Box className='flex items-center justify-between'>
              <Typography variant='body2' color='text.secondary'>Rating</Typography>
              <Box className='flex items-center gap-2'>
                <Rating value={Number(maintainer.rating ?? 0)} readOnly size='small' precision={0.1} />
                <Typography variant='body2' className='font-medium'>
                  {Number(maintainer.rating ?? 0).toFixed(1)} / 5.0
                </Typography>
              </Box>
            </Box>
            <Divider />
            <Box className='flex items-center justify-between'>
              <Typography variant='body2' color='text.secondary'>Total Jobs</Typography>
              <Typography variant='body1' className='font-medium'>{maintainer.totalJobs ?? 0}</Typography>
            </Box>
            <Divider />
            <Box className='flex items-center justify-between'>
              <Typography variant='body2' color='text.secondary'>Completed Jobs</Typography>
              <Typography variant='body1' className='font-medium' color='success.main'>
                {maintainer.completedJobs ?? 0}
              </Typography>
            </Box>
            <Divider />
            <Box className='flex items-center justify-between'>
              <Typography variant='body2' color='text.secondary'>Completion Rate</Typography>
              <Typography variant='body1' className='font-medium'>{completionRate}%</Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='subtitle1' className='font-medium mbe-3'>Contact Information</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>Email</Typography>
                <Typography variant='body1' className='font-medium'>{maintainer.email ?? '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>Phone</Typography>
                <Typography variant='body1' className='font-medium'>{maintainer.phone ?? '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>Company</Typography>
                <Typography variant='body1' className='font-medium'>{maintainer.companyName ?? '-'}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='subtitle1' className='font-medium mbe-3'>Compliance &amp; Credentials</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>Tax ID</Typography>
                <Typography variant='body1' className='font-medium'>{maintainer.taxId ?? '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>Insurance Expiry</Typography>
                <Typography variant='body1' className='font-medium'>{formatDate(maintainer.insuranceExpiryDate)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>Compliance Status</Typography>
                <Chip
                  variant='tonal' size='small'
                  label={maintainer.isCompliant ? 'Compliant' : 'Non-compliant'}
                  color={maintainer.isCompliant ? 'success' : 'error'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>Member Since</Typography>
                <Typography variant='body1' className='font-medium'>{formatDate(maintainer.createdAt)}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={() => setOpen(false)}>Close</Button>
        <Button variant='contained' color='primary' startIcon={<i className='ri-pencil-line' />} onClick={onEdit}>
          Edit Maintainer
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ViewMaintainerDialog
