'use client'

import { useState, useEffect } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import CustomTabList from '@core/components/mui/TabList'
import PageBanner from '@components/banner/PageBanner'
import AddMeterDialog from './dialogs/AddMeterDialog'
import RecordBillDialog from './dialogs/RecordBillDialog'
import RecordTokenDialog from './dialogs/RecordTokenDialog'
import BillsTable from './BillsTable'
import TokensTable from './TokensTable'

import { utilitiesApi } from '@/lib/api/utilities'
import type { UtilityMeterResponse } from '@/types/utility'

const UTILITY_ICONS: Record<string, string> = {
  ELECTRICITY: 'ri-flashlight-line',
  WATER:       'ri-drop-line',
}

const UTILITY_COLORS: Record<string, string> = {
  ELECTRICITY: '#FFB347',
  WATER:       '#4FC3F7',
}

const METER_TYPE_CHIP: Record<string, { label: string; color: 'default' | 'success' | 'warning' }> = {
  PREPAID:  { label: 'Prepaid',  color: 'success' },
  POSTPAID: { label: 'Postpaid', color: 'warning' },
}

const PAYER_LABELS: Record<string, string> = {
  LANDLORD:  'Landlord pays',
  CARETAKER: 'Caretaker pays',
  TENANT:    'Tenant pays',
}

// ─────────────────────────────────────────────────────────────────────────────

export default function UtilitiesView() {
  const [meters, setMeters]         = useState<UtilityMeterResponse[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [selectedMeter, setSelectedMeter] = useState<UtilityMeterResponse | null>(null)
  const [activeTab, setActiveTab]   = useState<'bills' | 'tokens'>('bills')

  // dialogs
  const [addMeterOpen, setAddMeterOpen]   = useState(false)
  const [recordBillOpen, setRecordBillOpen] = useState(false)
  const [recordTokenOpen, setRecordTokenOpen] = useState(false)
  const [deleteId, setDeleteId]           = useState<string | null>(null)
  const [deleting, setDeleting]           = useState(false)

  useEffect(() => { load() }, []) // eslint-disable-line

  function load() {
    setLoading(true)
    utilitiesApi.getAllMeters()
      .then(data => {
        setMeters(data)
        if (data.length > 0 && !selectedMeter) setSelectedMeter(data[0])
      })
      .catch(err => setError(err?.message ?? 'Failed to load utility meters'))
      .finally(() => setLoading(false))
  }

  function onMeterAdded(meter: UtilityMeterResponse) {
    setMeters(prev => [meter, ...prev])
    setSelectedMeter(meter)
    setAddMeterOpen(false)
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await utilitiesApi.deleteMeter(id)
      setMeters(prev => prev.filter(m => m.id !== id))
      if (selectedMeter?.id === id) {
        const remaining = meters.filter(m => m.id !== id)
        setSelectedMeter(remaining[0] ?? null)
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete meter')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  if (loading) return (
    <Box className='flex justify-center items-center' sx={{ minHeight: 300 }}>
      <CircularProgress />
    </Box>
  )

  return (
    <Box>
      <PageBanner
        title='Utilities'
        description='Track electricity and water meters, bills, and token top-ups across your properties'
        icon='ri-plug-line'
      />

      {error && (
        <Alert severity='error' sx={{ mt: 3, mb: 0 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      <Grid container spacing={6} className='mbs-6'>
        {/* ── Left panel: meter list ──────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader
              title='Utility Meters'
              subheader='Electricity & water meters across your properties'
              action={
                <Button
                  variant='contained'
                  size='small'
                  startIcon={<i className='ri-add-line' />}
                  onClick={() => setAddMeterOpen(true)}
                >
                  Add Meter
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              {meters.length === 0 ? (
                <Box className='flex flex-col items-center justify-center gap-3 py-10' sx={{ color: 'text.disabled' }}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'var(--mui-palette-primary-lightOpacity)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className='ri-plug-line' style={{ fontSize: 24, color: 'var(--mui-palette-primary-main)' }} />
                  </Box>
                  <Typography variant='body2' color='text.secondary' textAlign='center'>
                    No meters yet. Add your first meter.
                  </Typography>
                  <Button variant='outlined' size='small' onClick={() => setAddMeterOpen(true)}
                    startIcon={<i className='ri-add-line' />}>
                    Add Meter
                  </Button>
                </Box>
              ) : (
                <Box>
                  {meters.map((m, idx) => {
                    const selected = selectedMeter?.id === m.id
                    const icon = UTILITY_ICONS[m.utilityType] ?? 'ri-plug-line'
                    const color = UTILITY_COLORS[m.utilityType] ?? '#aaa'
                    const meterChip = METER_TYPE_CHIP[m.meterType]

                    return (
                      <Box key={m.id}>
                        {idx > 0 && <Divider />}
                        <Box
                          onClick={() => setSelectedMeter(m)}
                          sx={{
                            px: 4, py: 3, cursor: 'pointer',
                            background: selected ? 'var(--mui-palette-primary-lightOpacity)' : 'transparent',
                            borderLeft: selected ? '3px solid var(--mui-palette-primary-main)' : '3px solid transparent',
                            transition: 'all 0.15s',
                            '&:hover': { background: 'var(--mui-palette-action-hover)' },
                          }}
                        >
                          <Box className='flex items-start justify-between gap-2'>
                            <Box className='flex items-center gap-3'>
                              <Box sx={{
                                width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
                                background: `${color}22`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <i className={icon} style={{ fontSize: 18, color }} />
                              </Box>
                              <Box>
                                <Typography variant='body2' fontWeight={600}>{m.meterNumber}</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  {m.propertyName ?? '—'} · {m.unitCount} unit{m.unitCount !== 1 ? 's' : ''}
                                </Typography>
                              </Box>
                            </Box>
                            <Tooltip title='Delete meter'>
                              <IconButton
                                size='small' color='error'
                                onClick={e => { e.stopPropagation(); setDeleteId(m.id) }}
                              >
                                <i className='ri-delete-bin-line text-sm' />
                              </IconButton>
                            </Tooltip>
                          </Box>

                          <Box className='flex items-center gap-2 mt-2' sx={{ pl: '48px' }}>
                            {meterChip && (
                              <Chip label={meterChip.label} size='small' color={meterChip.color} variant='tonal' sx={{ fontSize: 10 }} />
                            )}
                            <Chip label={m.utilityType} size='small' variant='tonal' sx={{ fontSize: 10 }} />
                            <Typography variant='caption' color='text.secondary'>{PAYER_LABELS[m.paymentResponsibility] ?? m.paymentResponsibility}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right panel: meter detail ───────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 8 }}>
          {!selectedMeter ? (
            <Card>
              <CardContent>
                <Box className='flex flex-col items-center justify-center gap-3 py-16' sx={{ color: 'text.disabled' }}>
                  <i className='ri-plug-line' style={{ fontSize: 40 }} />
                  <Typography variant='body1'>Select a meter to view its bills and records</Typography>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Box className='flex flex-col gap-5'>
              {/* Meter header */}
              <Card>
                <CardContent sx={{ py: '20px !important' }}>
                  <Box className='flex items-start justify-between gap-4 flex-wrap'>
                    <Box className='flex items-center gap-3'>
                      <Box sx={{
                        width: 48, height: 48, borderRadius: '10px', flexShrink: 0,
                        background: `${UTILITY_COLORS[selectedMeter.utilityType] ?? '#aaa'}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className={UTILITY_ICONS[selectedMeter.utilityType] ?? 'ri-plug-line'}
                          style={{ fontSize: 22, color: UTILITY_COLORS[selectedMeter.utilityType] ?? '#aaa' }} />
                      </Box>
                      <Box>
                        <Typography variant='h6' fontWeight={600}>{selectedMeter.meterNumber}</Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {selectedMeter.propertyName} ·{' '}
                          {selectedMeter.units.length > 0
                            ? selectedMeter.units.map(u => u.unitNo).join(', ')
                            : 'No units assigned'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box className='flex items-center gap-2 flex-wrap'>
                      <Chip label={selectedMeter.utilityType}   size='small' variant='tonal' />
                      <Chip label={selectedMeter.meterType}     size='small' variant='tonal'
                        color={METER_TYPE_CHIP[selectedMeter.meterType]?.color ?? 'default'} />
                      <Chip label={PAYER_LABELS[selectedMeter.paymentResponsibility] ?? selectedMeter.paymentResponsibility}
                        size='small' variant='outlined' />
                      <Chip label={`Split: ${selectedMeter.splitMethod}`} size='small' variant='outlined' />

                      {/* Action buttons */}
                      {(selectedMeter.meterType === 'POSTPAID' || selectedMeter.utilityType === 'WATER') && (
                        <Button
                          size='small' variant='contained'
                          startIcon={<i className='ri-file-list-3-line' />}
                          onClick={() => { setActiveTab('bills'); setRecordBillOpen(true) }}
                        >
                          Record Bill
                        </Button>
                      )}
                      {selectedMeter.meterType === 'PREPAID' && selectedMeter.utilityType === 'ELECTRICITY' && (
                        <Button
                          size='small' variant='contained' color='success'
                          startIcon={<i className='ri-flashlight-line' />}
                          onClick={() => { setActiveTab('tokens'); setRecordTokenOpen(true) }}
                        >
                          Record Token
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Bills / Tokens tabs */}
              <Card>
                <TabContext value={activeTab}>
                  <CustomTabList onChange={(_, v) => setActiveTab(v as typeof activeTab)} pill='true'>
                    <Tab
                      icon={<i className='ri-file-list-3-line' />}
                      value='bills' label='Bills' iconPosition='start'
                    />
                    {selectedMeter.meterType === 'PREPAID' && selectedMeter.utilityType === 'ELECTRICITY' && (
                      <Tab
                        icon={<i className='ri-flashlight-line' />}
                        value='tokens' label='Prepaid Tokens' iconPosition='start'
                      />
                    )}
                  </CustomTabList>
                  <TabPanel value='bills' sx={{ p: 0 }}>
                    <BillsTable
                      meter={selectedMeter}
                      onRecordBill={() => setRecordBillOpen(true)}
                      onBillPaid={updated => {
                        /* bills table manages its own state — refresh handled inside */
                      }}
                    />
                  </TabPanel>
                  {selectedMeter.meterType === 'PREPAID' && selectedMeter.utilityType === 'ELECTRICITY' && (
                    <TabPanel value='tokens' sx={{ p: 0 }}>
                      <TokensTable
                        meter={selectedMeter}
                        onRecordToken={() => setRecordTokenOpen(true)}
                      />
                    </TabPanel>
                  )}
                </TabContext>
              </Card>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* ── Dialogs ────────────────────────────────────────────────────────── */}

      <AddMeterDialog
        open={addMeterOpen}
        onClose={() => setAddMeterOpen(false)}
        onCreated={onMeterAdded}
      />

      {selectedMeter && (
        <>
          <RecordBillDialog
            open={recordBillOpen}
            meter={selectedMeter}
            onClose={() => setRecordBillOpen(false)}
            onCreated={() => setRecordBillOpen(false)}
          />
          <RecordTokenDialog
            open={recordTokenOpen}
            meter={selectedMeter}
            onClose={() => setRecordTokenOpen(false)}
            onCreated={() => setRecordTokenOpen(false)}
          />
        </>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <Box
          sx={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => !deleting && setDeleteId(null)}
        >
          <Card sx={{ maxWidth: 360, width: '90%', p: 2 }} onClick={e => e.stopPropagation()}>
            <CardHeader
              title={<Box className='flex items-center gap-2'>
                <i className='ri-error-warning-line' style={{ color: 'var(--mui-palette-error-main)' }} />
                Delete Meter
              </Box>}
            />
            <CardContent>
              <Typography>
                Are you sure you want to delete this meter? All associated bills and tokens will also be deleted.
              </Typography>
            </CardContent>
            <Box className='flex gap-2 justify-end px-4 pb-3'>
              <Button variant='outlined' color='secondary' onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
              <Button
                variant='contained' color='error'
                disabled={deleting}
                startIcon={deleting ? <CircularProgress size={16} color='inherit' /> : <i className='ri-delete-bin-line' />}
                onClick={() => handleDelete(deleteId)}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </Box>
          </Card>
        </Box>
      )}
    </Box>
  )
}
