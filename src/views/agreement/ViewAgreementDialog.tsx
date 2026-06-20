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
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// API Types
import type { Agreement, AgreementStatus, AgreementType } from '@/lib/api/agreements'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { formatCurrency } from '@/utils/currency'

type Props = {
  open: boolean
  handleClose: () => void
  agreement: Agreement | null
}

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const day   = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year  = date.getFullYear()
  return `${day}/${month}/${year}`
}

const statusColors: Record<AgreementStatus, 'success' | 'warning' | 'info' | 'error'> = {
  ACTIVE:     'success',
  PENDING:    'info',
  EXPIRED:    'warning',
  TERMINATED: 'error'
}

const typeColors: Record<AgreementType, 'primary' | 'info' | 'secondary'> = {
  LEASE:    'primary',
  CONTRACT: 'info',
  OTHER:    'secondary'
}

const typeLabels: Record<AgreementType, string> = {
  LEASE: 'Lease', CONTRACT: 'Contract', OTHER: 'Other'
}

const statusLabels: Record<AgreementStatus, string> = {
  ACTIVE: 'Active', PENDING: 'Pending', EXPIRED: 'Expired', TERMINATED: 'Terminated'
}

const freqLabels: Record<string, string> = {
  MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', YEARLY: 'Yearly', ONE_TIME: 'One-time'
}

const ViewAgreementDialog = ({ open, handleClose, agreement }: Props) => {
  if (!agreement) return null

  // ---- Stamp Duty calculation (frontend-only) ----
  // GRA Stamp Duty Act: 0.5% of total lease value
  // Total lease value = rent × duration in months
  const durationMs =
    agreement.startDate && agreement.endDate
      ? new Date(agreement.endDate).getTime() - new Date(agreement.startDate).getTime()
      : null
  const durationMonths =
    durationMs != null ? Math.round(durationMs / (1000 * 60 * 60 * 24 * 30.44)) : null
  const totalLeaseValue =
    agreement.rent != null && durationMonths != null && durationMonths > 0
      ? agreement.rent * durationMonths
      : null
  const stampDuty = totalLeaseValue != null ? totalLeaseValue * 0.005 : null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='lg' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>Agreement Details</span>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Card className='previewCard'>
          <CardContent className='sm:!p-12'>
            <Grid container spacing={6}>

              {/* Header */}
              <Grid size={{ xs: 12 }}>
                <div className='p-6 bg-actionHover rounded'>
                  <div className='flex justify-between gap-y-4 flex-col sm:flex-row'>
                    <div className='flex flex-col gap-6'>
                      <div>
                        <Typography variant='h5'>{`Agreement #${agreement.agreementNumber}`}</Typography>
                        <div className='flex items-center gap-2 mts-2'>
                          <Chip
                            variant='tonal'
                            label={typeLabels[agreement.type] ?? agreement.type}
                            size='small'
                            color={typeColors[agreement.type] ?? 'default'}
                          />
                          <Chip
                            variant='tonal'
                            label={statusLabels[agreement.status] ?? agreement.status}
                            size='small'
                            color={statusColors[agreement.status] ?? 'default'}
                          />
                        </div>
                      </div>
                    </div>
                    <div className='flex flex-col gap-1'>
                      <Typography color='text.primary'>{`Start Date: ${formatDate(agreement.startDate)}`}</Typography>
                      <Typography color='text.primary'>{`End Date: ${formatDate(agreement.endDate)}`}</Typography>
                      {agreement.signedDate && (
                        <Typography color='text.primary'>{`Signed Date: ${formatDate(agreement.signedDate)}`}</Typography>
                      )}
                      {agreement.duration && (
                        <Typography color='text.primary'>{`Duration: ${agreement.duration}`}</Typography>
                      )}
                    </div>
                  </div>
                </div>
              </Grid>

              {/* Parties */}
              <Grid size={{ xs: 12 }}>
                <Grid container spacing={6}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex flex-col gap-4'>
                      <Typography className='font-medium' color='text.primary'>Occupant Information:</Typography>
                      <div className='flex items-center gap-3'>
                        <CustomAvatar skin='light' size={40}>
                          {getInitials(agreement.occupantName ?? '?')}
                        </CustomAvatar>
                        <Typography className='font-medium' color='text.primary'>
                          {agreement.occupantName ?? '—'}
                        </Typography>
                      </div>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex flex-col gap-4'>
                      <Typography className='font-medium' color='text.primary'>Property Information:</Typography>
                      <div className='flex flex-col gap-1'>
                        <Typography variant='body2' color='text.primary'>{agreement.propertyName ?? '—'}</Typography>
                        <Typography variant='body2' color='text.secondary'>{agreement.unitNo ?? ''}</Typography>
                      </div>
                    </div>
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12 }}><Divider /></Grid>

              {/* Financial */}
              <Grid size={{ xs: 12 }}>
                <Typography variant='h6' className='mb-4'>Financial Information</Typography>
                <Grid container spacing={6}>
                  {agreement.totalAmount != null && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className='flex items-center justify-between'>
                        <Typography variant='body2'>Total Amount:</Typography>
                        <Typography className='font-medium' color='text.primary'>
                          {formatCurrency(agreement.totalAmount)}
                        </Typography>
                      </div>
                    </Grid>
                  )}
                  {agreement.rent != null && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className='flex items-center justify-between'>
                        <Typography variant='body2'>Rent:</Typography>
                        <Typography className='font-medium' color='text.primary'>
                          {formatCurrency(agreement.rent)}
                        </Typography>
                      </div>
                    </Grid>
                  )}
                  {agreement.securityDeposit != null && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className='flex items-center justify-between'>
                        <Typography variant='body2'>Security Deposit:</Typography>
                        <Typography className='font-medium' color='text.primary'>
                          {formatCurrency(agreement.securityDeposit)}
                        </Typography>
                      </div>
                    </Grid>
                  )}
                  {agreement.lateFee != null && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className='flex items-center justify-between'>
                        <Typography variant='body2'>Late Fee:</Typography>
                        <Typography className='font-medium' color='text.primary'>
                          {formatCurrency(agreement.lateFee)}
                        </Typography>
                      </div>
                    </Grid>
                  )}
                  {agreement.paymentFrequency && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className='flex items-center justify-between'>
                        <Typography variant='body2'>Payment Frequency:</Typography>
                        <Typography className='font-medium' color='text.primary'>
                          {freqLabels[agreement.paymentFrequency] ?? agreement.paymentFrequency}
                        </Typography>
                      </div>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              {/* Stamp Duty */}
              {stampDuty != null && (
                <>
                  <Grid size={{ xs: 12 }}><Divider /></Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant='h6' className='mb-4'>
                      <i className='ri-government-line' style={{ marginRight: 6 }} />
                      Stamp Duty (GRA)
                    </Typography>
                    <Grid container spacing={4}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <div className='flex items-center justify-between'>
                          <Typography variant='body2'>Lease Duration:</Typography>
                          <Typography className='font-medium' color='text.primary'>
                            {durationMonths} month{durationMonths !== 1 ? 's' : ''}
                          </Typography>
                        </div>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <div className='flex items-center justify-between'>
                          <Typography variant='body2'>Total Lease Value:</Typography>
                          <Typography className='font-medium' color='text.primary'>
                            {formatCurrency(totalLeaseValue!)}
                          </Typography>
                        </div>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <div className='flex items-center justify-between'>
                          <Typography variant='body2'>Stamp Duty Rate:</Typography>
                          <Chip label='0.5%' variant='tonal' color='warning' size='small' />
                        </div>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <div className='flex items-center justify-between'>
                          <Typography variant='body2'>Estimated Stamp Duty:</Typography>
                          <Typography className='font-medium' color='warning.main'>
                            {formatCurrency(stampDuty)}
                          </Typography>
                        </div>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Alert severity='info' sx={{ mt: 1 }}>
                          <Typography variant='caption'>
                            Stamp duty of <strong>0.5%</strong> on the total lease value must be paid to the GRA
                            within <strong>30 days</strong> of executing this agreement (Stamp Duty Act, 2005).
                            This is an estimate — consult a legal professional for exact figures.
                          </Typography>
                        </Alert>
                      </Grid>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Terms & Conditions */}
              {(agreement.terms || agreement.conditions || agreement.renewalOptions) && (
                <>
                  <Grid size={{ xs: 12 }}><Divider /></Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant='h6' className='mb-4'>Terms & Conditions</Typography>
                    <Grid container spacing={6}>
                      {agreement.terms && (
                        <Grid size={{ xs: 12 }}>
                          <Typography className='font-medium' color='text.primary'>Terms:</Typography>
                          <Typography variant='body2' color='text.secondary'>{agreement.terms}</Typography>
                        </Grid>
                      )}
                      {agreement.conditions && (
                        <Grid size={{ xs: 12 }}>
                          <Typography className='font-medium' color='text.primary'>Conditions:</Typography>
                          <Typography variant='body2' color='text.secondary'>{agreement.conditions}</Typography>
                        </Grid>
                      )}
                      {agreement.renewalOptions && (
                        <Grid size={{ xs: 12 }}>
                          <Typography className='font-medium' color='text.primary'>Renewal Options:</Typography>
                          <Typography variant='body2' color='text.secondary'>{agreement.renewalOptions}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Document */}
              {agreement.documentUrl && (
                <>
                  <Grid size={{ xs: 12 }}><Divider /></Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant='h6' className='mb-4'>Documents</Typography>
                    <Box className='flex items-center gap-2'>
                      <Button
                        variant='outlined'
                        size='small'
                        startIcon={<i className='ri-download-line' />}
                        onClick={() => window.open(agreement.documentUrl!, '_blank')}
                      >
                        Download
                      </Button>
                      <Button
                        variant='outlined'
                        size='small'
                        startIcon={<i className='ri-printer-line' />}
                        onClick={() => window.print()}
                      >
                        Print
                      </Button>
                    </Box>
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 12 }}>
                <Divider className='border-dashed' />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant='body2' color='text.secondary'>
                  This agreement is legally binding and enforceable.
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleClose}>Close</Button>
        {agreement.documentUrl && (
          <Button
            variant='contained'
            color='primary'
            startIcon={<i className='ri-download-line' />}
            onClick={() => window.open(agreement.documentUrl!, '_blank')}
          >
            Download
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ViewAgreementDialog
