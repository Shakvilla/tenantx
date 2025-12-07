// Documentation: /docs/agreement/agreement-module.md

'use client'

// React Imports
import { useMemo } from 'react'

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

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Type Imports
import type { Agreement } from '@/types/agreement/agreementTypes'

// Util Imports
import { getInitials } from '@/utils/getInitials'

type Props = {
  open: boolean
  handleClose: () => void
  agreement: Agreement | null
}

// Helper function to format dates consistently
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const ViewAgreementDialog = ({ open, handleClose, agreement }: Props) => {
  const statusColors: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
    active: 'success',
    expired: 'warning',
    pending: 'info',
    terminated: 'error'
  }

  const typeColors: Record<string, 'primary' | 'info'> = {
    lease: 'primary',
    contract: 'info',
    other: 'default'
  }

  if (!agreement) {
    return null
  }

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
              {/* Header Section */}
              <Grid size={{ xs: 12 }}>
                <div className='p-6 bg-actionHover rounded'>
                  <div className='flex justify-between gap-y-4 flex-col sm:flex-row'>
                    <div className='flex flex-col gap-6'>
                      <div>
                        <Typography variant='h5'>{`Agreement #${agreement.agreementNumber}`}</Typography>
                        <div className='flex items-center gap-2 mts-2'>
                          <Chip
                            variant='tonal'
                            label={agreement.type}
                            size='small'
                            color={typeColors[agreement.type] || 'default'}
                            className='capitalize'
                          />
                          <Chip
                            variant='tonal'
                            label={agreement.status}
                            size='small'
                            color={statusColors[agreement.status] || 'default'}
                            className='capitalize'
                          />
                        </div>
                      </div>
                    </div>
                    <div className='flex flex-col gap-6'>
                      <div className='flex flex-col gap-1'>
                        <Typography color='text.primary'>
                          {`Start Date: ${formatDate(agreement.startDate)}`}
                        </Typography>
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
                </div>
              </Grid>

              {/* Tenant Information */}
              <Grid size={{ xs: 12 }}>
                <Grid container spacing={6}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex flex-col gap-4'>
                      <Typography className='font-medium' color='text.primary'>
                        Tenant Information:
                      </Typography>
                      <div className='flex items-center gap-3'>
                        {agreement.tenantAvatar ? (
                          <CustomAvatar src={agreement.tenantAvatar} skin='light' size={40} />
                        ) : (
                          <CustomAvatar skin='light' size={40}>
                            {getInitials(agreement.tenantName)}
                          </CustomAvatar>
                        )}
                        <div className='flex flex-col'>
                          <Typography className='font-medium' color='text.primary'>
                            {agreement.tenantName}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex flex-col gap-4'>
                      <Typography className='font-medium' color='text.primary'>
                        Property Information:
                      </Typography>
                      <div className='flex flex-col gap-2'>
                        <Typography variant='body2' color='text.primary'>
                          {agreement.propertyName}
                        </Typography>
                        <Typography variant='body2' color='text.primary'>
                          {agreement.unitNo}
                        </Typography>
                      </div>
                    </div>
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider />
              </Grid>

              {/* Financial Information */}
              <Grid size={{ xs: 12 }}>
                <Typography variant='h6' className='mb-4'>
                  Financial Information
                </Typography>
                <Grid container spacing={6}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex items-center justify-between'>
                      <Typography variant='body2'>Total Amount:</Typography>
                      <Typography className='font-medium' color='text.primary'>
                        {agreement.amount}
                      </Typography>
                    </div>
                  </Grid>
                  {agreement.rent && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className='flex items-center justify-between'>
                        <Typography variant='body2'>Rent:</Typography>
                        <Typography className='font-medium' color='text.primary'>
                          {agreement.rent}
                        </Typography>
                      </div>
                    </Grid>
                  )}
                  {agreement.securityDeposit && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className='flex items-center justify-between'>
                        <Typography variant='body2'>Security Deposit:</Typography>
                        <Typography className='font-medium' color='text.primary'>
                          {agreement.securityDeposit}
                        </Typography>
                      </div>
                    </Grid>
                  )}
                  {agreement.lateFee && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className='flex items-center justify-between'>
                        <Typography variant='body2'>Late Fee:</Typography>
                        <Typography className='font-medium' color='text.primary'>
                          {agreement.lateFee}
                        </Typography>
                      </div>
                    </Grid>
                  )}
                  {agreement.paymentFrequency && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <div className='flex items-center justify-between'>
                        <Typography variant='body2'>Payment Frequency:</Typography>
                        <Typography className='font-medium capitalize' color='text.primary'>
                          {agreement.paymentFrequency}
                        </Typography>
                      </div>
                    </Grid>
                  )}
                </Grid>
              </Grid>

              {/* Terms & Conditions */}
              {(agreement.terms || agreement.conditions || agreement.renewalOptions) && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant='h6' className='mb-4'>
                      Terms & Conditions
                    </Typography>
                    <Grid container spacing={6}>
                      {agreement.terms && (
                        <Grid size={{ xs: 12 }}>
                          <div className='flex flex-col gap-2'>
                            <Typography className='font-medium' color='text.primary'>
                              Terms:
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {agreement.terms}
                            </Typography>
                          </div>
                        </Grid>
                      )}
                      {agreement.conditions && (
                        <Grid size={{ xs: 12 }}>
                          <div className='flex flex-col gap-2'>
                            <Typography className='font-medium' color='text.primary'>
                              Conditions:
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {agreement.conditions}
                            </Typography>
                          </div>
                        </Grid>
                      )}
                      {agreement.renewalOptions && (
                        <Grid size={{ xs: 12 }}>
                          <div className='flex flex-col gap-2'>
                            <Typography className='font-medium' color='text.primary'>
                              Renewal Options:
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {agreement.renewalOptions}
                            </Typography>
                          </div>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Document Section */}
              {agreement.documentUrl && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant='h6' className='mb-4'>
                      Documents
                    </Typography>
                    <Box className='flex items-center gap-2'>
                      <Button
                        variant='outlined'
                        size='small'
                        startIcon={<i className='ri-download-line' />}
                        onClick={() => {
                          if (agreement.documentUrl) {
                            window.open(agreement.documentUrl, '_blank')
                          }
                        }}
                      >
                        Download Document
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
        <Button variant='outlined' color='secondary' onClick={handleClose}>
          Close
        </Button>
        {agreement.documentUrl && (
          <Button
            variant='contained'
            color='primary'
            startIcon={<i className='ri-download-line' />}
            onClick={() => {
              if (agreement.documentUrl) {
                window.open(agreement.documentUrl, '_blank')
              }
            }}
          >
            Download
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ViewAgreementDialog

