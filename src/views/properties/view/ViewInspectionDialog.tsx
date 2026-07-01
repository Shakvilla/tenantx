'use client'

/**
 * ViewInspectionDialog — read-only inspection report
 *
 * Features:
 *  - Header: type badge, status, date, inspector
 *  - Room-grouped items with condition chips
 *  - Photo grid per item (lightbox via window.open)
 *  - Overall notes + tenant acknowledgement
 *  - Print / PDF export via window.print() with a dedicated @media print stylesheet
 */

import { useState, useEffect } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'

import { inspectionsApi, getInspectionReportUrl } from '@/lib/api/inspections'
import type {
  InspectionResponse,
  InspectionItemResponse,
  InspectionRoom,
  InspectionCondition,
  InspectionType,
  InspectionStatus,
} from '@/types/inspection'

// ─── helpers ──────────────────────────────────────────────────────────────────

const ROOM_LABELS: Record<InspectionRoom, string> = {
  LIVING_ROOM: 'Living Room',
  KITCHEN:     'Kitchen',
  BEDROOM_1:   'Bedroom 1',
  BEDROOM_2:   'Bedroom 2',
  BEDROOM_3:   'Bedroom 3',
  BATHROOM_1:  'Bathroom 1',
  BATHROOM_2:  'Bathroom 2',
  TOILET:      'Toilet',
  CORRIDOR:    'Corridor / Hallway',
  BALCONY:     'Balcony',
  GARAGE:      'Garage',
  COMPOUND:    'Compound',
  OTHER:       'Other',
}

const ITEM_LABELS: Record<string, string> = {
  WALLS: 'Walls', FLOOR: 'Floor', CEILING: 'Ceiling',
  WINDOWS: 'Windows', DOORS: 'Doors', LIGHTING: 'Lighting',
  FIXTURES: 'Fixtures', OTHER: 'Other',
}

function conditionChip(c: InspectionCondition | null) {
  if (!c) return null
  const map: Record<InspectionCondition, { label: string; color: 'success' | 'warning' | 'error' }> = {
    GOOD: { label: 'Good', color: 'success' },
    FAIR: { label: 'Fair', color: 'warning' },
    POOR: { label: 'Poor', color: 'error' },
  }
  const { label, color } = map[c]
  return <Chip label={label} size='small' variant='tonal' color={color} />
}

function typeChip(t: InspectionType) {
  return (
    <Chip
      label={t === 'MOVE_IN' ? 'Move-In' : 'Move-Out'}
      size='small'
      variant='tonal'
      color={t === 'MOVE_IN' ? 'success' : 'warning'}
    />
  )
}

function statusChip(s: InspectionStatus) {
  return (
    <Chip
      label={s === 'COMPLETED' ? 'Completed' : 'Draft'}
      size='small'
      variant='tonal'
      color={s === 'COMPLETED' ? 'success' : 'default'}
    />
  )
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GH', { day: '2-digit', month: 'long', year: 'numeric' })
}

/** Group items by room, maintaining declaration order */
function groupByRoom(items: InspectionItemResponse[]): Map<InspectionRoom, InspectionItemResponse[]> {
  const map = new Map<InspectionRoom, InspectionItemResponse[]>()
  for (const item of items) {
    if (!map.has(item.room)) map.set(item.room, [])
    map.get(item.room)!.push(item)
  }
  return map
}

// ─── component ────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  inspectionId: string
  onClose: () => void
}

export default function ViewInspectionDialog({ open, inspectionId, onClose }: Props) {
  const [data, setData]       = useState<InspectionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    inspectionsApi.getById(inspectionId)
      .then(setData)
      .catch(err => setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load inspection'))
      .finally(() => setLoading(false))
  }, [open, inspectionId])

  const roomGroups = data ? groupByRoom(data.items) : new Map()

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
        <DialogTitle className='flex items-center justify-between'>
          <Box className='flex items-center gap-2'>
            <i className='ri-file-list-3-line' style={{ color: 'var(--mui-palette-primary-main)' }} />
            <span>Inspection Report</span>
          </Box>
          <IconButton size='small' onClick={onClose}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {loading && (
            <Box>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant='text' height={32} sx={{ mb: 1 }} />
              ))}
            </Box>
          )}

          {error && (
            <Alert severity='error'>{error}</Alert>
          )}

          {data && (
            <Box>
              {/* ── Header ─────────────────────────────────────────────── */}
              <Box sx={{ mb: 3, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                <Box className='flex flex-wrap items-center gap-2 mbe-2'>
                  {typeChip(data.type)}
                  {statusChip(data.status)}
                </Box>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant='caption' color='text.secondary'>Property</Typography>
                    <Typography variant='body2' fontWeight={500}>{data.propertyName ?? '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant='caption' color='text.secondary'>Unit</Typography>
                    <Typography variant='body2' fontWeight={500}>{data.unitNo ?? '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant='caption' color='text.secondary'>Inspector</Typography>
                    <Typography variant='body2' fontWeight={500}>{data.inspectorName ?? '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant='caption' color='text.secondary'>Date</Typography>
                    <Typography variant='body2' fontWeight={500}>{fmtDate(data.inspectionDate)}</Typography>
                  </Grid>
                  {data.signedOffDate && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant='caption' color='text.secondary'>Signed Off</Typography>
                      <Typography variant='body2' fontWeight={500}>{fmtDate(data.signedOffDate)}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* ── Items by room ──────────────────────────────────────── */}
              {roomGroups.size === 0 && (
                <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                  No room items recorded for this inspection.
                </Typography>
              )}

              {Array.from(roomGroups.entries()).map(([room, items], ri) => (
                <Box key={room} sx={{ mb: 3 }}>
                  {ri > 0 && <Divider sx={{ mb: 3 }} />}

                  <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 2 }}>
                    <i className='ri-home-4-line' style={{ marginRight: 6, color: 'var(--mui-palette-primary-main)' }} />
                    {ROOM_LABELS[room] ?? room}
                  </Typography>

                  {items.map((item, ii) => (
                    <Box key={item.id} sx={{ mb: 2, pl: 2, borderLeft: '3px solid', borderColor: 'divider' }}>
                      <Box className='flex items-center justify-between gap-2 mbe-1'>
                        <Typography variant='body2' fontWeight={500}>
                          {ITEM_LABELS[item.itemName] ?? item.itemName}
                        </Typography>
                        {conditionChip(item.condition)}
                      </Box>

                      {item.notes && (
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                          {item.notes}
                        </Typography>
                      )}

                      {/* Photo grid */}
                      {item.photoUrls?.length > 0 && (
                        <Box className='flex flex-wrap gap-2 mbs-1'>
                          {item.photoUrls.map((url, idx) => (
                            <Box
                              key={idx}
                              component='img'
                              src={url}
                              alt={`photo-${idx + 1}`}
                              sx={{
                                width: 80, height: 60,
                                borderRadius: 1,
                                objectFit: 'cover',
                                cursor: 'pointer',
                                border: '1px solid',
                                borderColor: 'divider',
                                '&:hover': { opacity: 0.85 },
                              }}
                              onClick={() => window.open(url, '_blank')}
                            />
                          ))}
                        </Box>
                      )}

                      {ii < items.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  ))}
                </Box>
              ))}

              {/* ── Overall notes ─────────────────────────────────────── */}
              {(data.inspectorNotes || data.tenantAcknowledgement) && (
                <>
                  <Divider sx={{ mb: 3 }} />
                  {data.inspectorNotes && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 0.5 }}>
                        Inspector Notes
                      </Typography>
                      <Typography variant='body2'>{data.inspectorNotes}</Typography>
                    </Box>
                  )}
                  {data.tenantAcknowledgement && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 0.5 }}>
                        Tenant Acknowledgement
                      </Typography>
                      <Typography variant='body2'>{data.tenantAcknowledgement}</Typography>
                    </Box>
                  )}
                </>
              )}

              {/* ── Summary counts ────────────────────────────────────── */}
              {data.items.length > 0 && (() => {
                const good = data.items.filter(i => i.condition === 'GOOD').length
                const fair = data.items.filter(i => i.condition === 'FAIR').length
                const poor = data.items.filter(i => i.condition === 'POOR').length
                return (
                  <Box sx={{ mt: 3, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                    <Typography variant='caption' color='text.secondary' sx={{ mb: 1, display: 'block' }}>
                      Summary — {data.items.length} item{data.items.length !== 1 ? 's' : ''} assessed
                    </Typography>
                    <Box className='flex gap-2'>
                      <Chip label={`${good} Good`}  size='small' color='success' variant='tonal' />
                      <Chip label={`${fair} Fair`}  size='small' color='warning' variant='tonal' />
                      <Chip label={`${poor} Poor`}  size='small' color='error'   variant='tonal' />
                    </Box>
                  </Box>
                )
              })()}
            </Box>
          )}
        </DialogContent>

        <DialogActions className='gap-2 pbs-4'>
          {/* Report download */}
          <Tooltip title='Download Report (opens in new tab → Ctrl+P to save as PDF)'>
            <span>
              <Button
                variant='outlined'
                size='small'
                startIcon={<i className='ri-file-download-line' />}
                component='a'
                href={data ? getInspectionReportUrl(data.id) : undefined}
                target='_blank'
                rel='noopener noreferrer'
                disabled={loading || !data}
              >
                Download Report
              </Button>
            </span>
          </Tooltip>
          <Button variant='contained' onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
