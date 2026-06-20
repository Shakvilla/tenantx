'use client'

/**
 * CreateInspectionDialog — 3-step wizard
 *
 * Step 1: Type (MOVE_IN / MOVE_OUT), date, inspector name
 * Step 2: Room-by-room checklist — accordion per room, condition chips, notes, photo upload
 * Step 3: Overall notes, tenant acknowledgement, sign-off date → submit
 */

import { useState, useRef } from 'react'

import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
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
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { inspectionsApi, uploadInspectionPhotos } from '@/lib/api/inspections'
import { getStoredTenantId } from '@/lib/api/storage'
import type {
  InspectionSummary,
  InspectionType,
  InspectionRoom,
  InspectionItemName,
  InspectionCondition,
  ItemUpsert,
} from '@/types/inspection'

// ─── constants ────────────────────────────────────────────────────────────────

const ROOMS: { value: InspectionRoom; label: string }[] = [
  { value: 'LIVING_ROOM',  label: 'Living Room' },
  { value: 'KITCHEN',      label: 'Kitchen' },
  { value: 'BEDROOM_1',    label: 'Bedroom 1' },
  { value: 'BEDROOM_2',    label: 'Bedroom 2' },
  { value: 'BEDROOM_3',    label: 'Bedroom 3' },
  { value: 'BATHROOM_1',   label: 'Bathroom 1' },
  { value: 'BATHROOM_2',   label: 'Bathroom 2' },
  { value: 'TOILET',       label: 'Toilet' },
  { value: 'CORRIDOR',     label: 'Corridor / Hallway' },
  { value: 'BALCONY',      label: 'Balcony' },
  { value: 'GARAGE',       label: 'Garage' },
  { value: 'COMPOUND',     label: 'Compound' },
  { value: 'OTHER',        label: 'Other' },
]

const ITEMS: { value: InspectionItemName; label: string }[] = [
  { value: 'WALLS',    label: 'Walls' },
  { value: 'FLOOR',    label: 'Floor' },
  { value: 'CEILING',  label: 'Ceiling' },
  { value: 'WINDOWS',  label: 'Windows' },
  { value: 'DOORS',    label: 'Doors' },
  { value: 'LIGHTING', label: 'Lighting' },
  { value: 'FIXTURES', label: 'Fixtures' },
  { value: 'OTHER',    label: 'Other' },
]

const CONDITIONS: { value: InspectionCondition; label: string; color: 'success' | 'warning' | 'error' }[] = [
  { value: 'GOOD', label: 'Good', color: 'success' },
  { value: 'FAIR', label: 'Fair', color: 'warning' },
  { value: 'POOR', label: 'Poor', color: 'error' },
]

const STEP_LABELS = ['Details', 'Room Checklist', 'Finalise']

// ─── types ────────────────────────────────────────────────────────────────────

/** Key into checklist state: "LIVING_ROOM__WALLS" */
type ItemKey = `${InspectionRoom}__${InspectionItemName}`

interface ItemState extends ItemUpsert {
  pendingFiles: File[]
  previewUrls: string[]
}

type ChecklistMap = Partial<Record<ItemKey, ItemState>>

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeKey(room: InspectionRoom, item: InspectionItemName): ItemKey {
  return `${room}__${item}` as ItemKey
}

function roomLabel(r: InspectionRoom) {
  return ROOMS.find(x => x.value === r)?.label ?? r
}

function defaultItem(room: InspectionRoom, itemName: InspectionItemName): ItemState {
  return { room, itemName, condition: undefined, notes: '', photoUrls: [], pendingFiles: [], previewUrls: [] }
}

// ─── ItemRow sub-component ────────────────────────────────────────────────────
// Must be a proper component (not an inline map callback) so useRef is always
// called unconditionally at the top of a component, never inside a loop.

type ItemRowProps = {
  room: InspectionRoom
  itm: { value: InspectionItemName; label: string }
  state: ItemState
  uploadingKey: ItemKey | null
  isLast: boolean
  onConditionToggle: (condition: InspectionCondition) => void
  onNotesChange: (notes: string) => void
  onPhotoUpload: (files: FileList | null) => void
  onRemovePhoto: (idx: number) => void
}

function ItemRow({
  itm, state, uploadingKey, isLast,
  onConditionToggle, onNotesChange, onPhotoUpload, onRemovePhoto,
  room,
}: ItemRowProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const key     = makeKey(room, itm.value)

  return (
    <Box sx={{ mb: 3 }}>
      <Box className='flex items-center justify-between gap-2 mbe-1'>
        <Typography variant='body2' fontWeight={500}>{itm.label}</Typography>
        <Box className='flex gap-1'>
          {CONDITIONS.map(c => (
            <Chip
              key={c.value}
              label={c.label}
              size='small'
              variant={state.condition === c.value ? 'filled' : 'outlined'}
              color={state.condition === c.value ? c.color : 'default'}
              onClick={() => onConditionToggle(c.value)}
              sx={{ cursor: 'pointer', fontSize: 11 }}
            />
          ))}
        </Box>
      </Box>

      {/* Notes */}
      <TextField
        size='small'
        fullWidth
        multiline
        rows={1}
        placeholder={`Notes for ${itm.label} (optional)`}
        value={state.notes}
        onChange={e => onNotesChange(e.target.value)}
        sx={{ mb: 1 }}
      />

      {/* Photo upload */}
      <Box className='flex items-center flex-wrap gap-2'>
        <Button
          size='small'
          variant='outlined'
          startIcon={
            uploadingKey === key
              ? <CircularProgress size={12} />
              : <i className='ri-image-add-line' />
          }
          disabled={uploadingKey === key}
          onClick={() => fileRef.current?.click()}
          sx={{ fontSize: 11 }}
        >
          {uploadingKey === key ? 'Uploading…' : 'Add Photos'}
        </Button>
        <input
          ref={fileRef}
          type='file'
          accept='image/*'
          multiple
          style={{ display: 'none' }}
          onChange={e => onPhotoUpload(e.target.files)}
        />
        {/* Preview thumbnails */}
        {state.previewUrls.map((url, idx) => (
          <Box key={idx} sx={{ position: 'relative', width: 40, height: 40 }}>
            <Box
              component='img'
              src={url}
              sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
            />
            <IconButton
              size='small'
              sx={{
                position: 'absolute', top: -6, right: -6, p: 0.2,
                bgcolor: 'error.main', color: '#fff',
                '&:hover': { bgcolor: 'error.dark' },
              }}
              onClick={() => onRemovePhoto(idx)}
            >
              <i className='ri-close-line' style={{ fontSize: 10 }} />
            </IconButton>
          </Box>
        ))}
      </Box>

      {!isLast && <Divider sx={{ mt: 2 }} />}
    </Box>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  unitId: string
  propertyId: string
  unitNo?: string | null
  propertyName?: string | null
  onClose: () => void
  onCreated: (summary: InspectionSummary) => void
}

export default function CreateInspectionDialog({
  open, unitId, propertyId, unitNo, propertyName, onClose, onCreated,
}: Props) {
  const [step, setStep]   = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  // Step 1
  const [type, setType]             = useState<InspectionType>('MOVE_IN')
  const [date, setDate]             = useState('')
  const [inspector, setInspector]   = useState('')

  // Step 2 — selected rooms + per-item state
  const [selectedRooms, setSelectedRooms]   = useState<InspectionRoom[]>(['LIVING_ROOM'])
  const [checklist, setChecklist]           = useState<ChecklistMap>({})
  const [expandedRoom, setExpandedRoom]     = useState<InspectionRoom | false>('LIVING_ROOM')
  const [uploadingKey, setUploadingKey]     = useState<ItemKey | null>(null)

  // Step 3
  const [notes, setNotes]         = useState('')
  const [acknowledgement, setAck] = useState('')
  const [signedOff, setSignedOff] = useState('')

  // Stored inspectionId after step-1 create
  const inspectionIdRef = useRef<string | null>(null)

  function reset() {
    setStep(0)
    setSaving(false)
    setError(null)
    setType('MOVE_IN')
    setDate('')
    setInspector('')
    setSelectedRooms(['LIVING_ROOM'])
    setChecklist({})
    setExpandedRoom('LIVING_ROOM')
    setNotes('')
    setAck('')
    setSignedOff('')
    inspectionIdRef.current = null
  }

  function close() {
    if (!saving) { reset(); onClose() }
  }

  // ── step 1 → create DRAFT ─────────────────────────────────────────────────
  async function handleNext1() {
    if (!inspector.trim()) { setError('Inspector name is required'); return }
    setError(null)
    setSaving(true)
    try {
      const created = await inspectionsApi.create({
        unitId, propertyId,
        unitNo:       unitNo  ?? undefined,
        propertyName: propertyName ?? undefined,
        type,
        inspectionDate: date || undefined,
        inspectorName:  inspector.trim(),
      })
      inspectionIdRef.current = created.id
      setStep(1)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to create inspection')
    } finally {
      setSaving(false)
    }
  }

  // ── room selection ─────────────────────────────────────────────────────────
  function toggleRoom(room: InspectionRoom) {
    setSelectedRooms(prev =>
      prev.includes(room) ? prev.filter(r => r !== room) : [...prev, room]
    )
  }

  // ── item state updates ────────────────────────────────────────────────────
  function getItem(room: InspectionRoom, itemName: InspectionItemName): ItemState {
    return checklist[makeKey(room, itemName)] ?? defaultItem(room, itemName)
  }

  function updateItem(room: InspectionRoom, itemName: InspectionItemName, patch: Partial<ItemState>) {
    const key = makeKey(room, itemName)
    setChecklist(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? defaultItem(room, itemName)), ...patch },
    }))
  }

  async function handlePhotoUpload(room: InspectionRoom, itemName: InspectionItemName, files: FileList | null) {
    if (!files || files.length === 0) return
    const key = makeKey(room, itemName)
    const fileArr = Array.from(files)

    // immediate previews
    const previews = fileArr.map(f => URL.createObjectURL(f))
    updateItem(room, itemName, {
      pendingFiles: [...getItem(room, itemName).pendingFiles, ...fileArr],
      previewUrls:  [...getItem(room, itemName).previewUrls,  ...previews],
    })

    // upload straight away so we have URLs before complete()
    const tenantId      = getStoredTenantId() ?? 'unknown'
    const inspectionId  = inspectionIdRef.current ?? 'draft'
    setUploadingKey(key)
    try {
      const uploaded = await uploadInspectionPhotos(fileArr, tenantId, inspectionId)
      updateItem(room, itemName, {
        photoUrls: [...(getItem(room, itemName).photoUrls ?? []), ...uploaded],
      })
    } catch {
      // upload failed — photos will still be in pendingFiles for retry
    } finally {
      setUploadingKey(null)
    }
  }

  function removePhoto(room: InspectionRoom, itemName: InspectionItemName, idx: number) {
    const item = getItem(room, itemName)
    updateItem(room, itemName, {
      photoUrls:   item.photoUrls?.filter((_, i) => i !== idx) ?? [],
      previewUrls: item.previewUrls.filter((_, i) => i !== idx),
      pendingFiles: item.pendingFiles.filter((_, i) => i !== idx),
    })
  }

  // ── step 3 → complete ─────────────────────────────────────────────────────
  async function handleComplete() {
    const inspectionId = inspectionIdRef.current
    if (!inspectionId) { setError('Inspection ID missing'); return }

    // build items from checklist — only include rooms that are selected
    const items: ItemUpsert[] = []
    for (const room of selectedRooms) {
      for (const itm of ITEMS) {
        const state = checklist[makeKey(room, itm.value)]
        if (!state?.condition) continue // skip unchecked items
        items.push({
          room,
          itemName:  itm.value,
          condition: state.condition,
          notes:     state.notes || undefined,
          photoUrls: state.photoUrls ?? [],
        })
      }
    }

    setSaving(true)
    setError(null)
    try {
      await inspectionsApi.complete(inspectionId, {
        inspectorNotes:       notes || undefined,
        tenantAcknowledgement: acknowledgement || undefined,
        signedOffDate:        signedOff || undefined,
        items,
      })
      // refresh summary from list
      const summaries = await inspectionsApi.getByUnit(unitId)
      const created   = summaries.find(s => s.id === inspectionId)
      if (created) onCreated(created)
      reset()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to complete inspection')
    } finally {
      setSaving(false)
    }
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onClose={close} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>New Inspection</span>
        <IconButton size='small' onClick={close} disabled={saving}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={step} sx={{ mb: 4, mt: 1 }}>
          {STEP_LABELS.map(label => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
        )}

        {/* ── Step 1: Details ──────────────────────────────────────────── */}
        {step === 0 && (
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                size='small'
                label='Inspection Type'
                value={type}
                onChange={e => setType(e.target.value as InspectionType)}
              >
                <MenuItem value='MOVE_IN'>Move-In</MenuItem>
                <MenuItem value='MOVE_OUT'>Move-Out</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size='small'
                type='date'
                label='Inspection Date'
                value={date}
                onChange={e => setDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size='small'
                required
                label='Inspector Name'
                placeholder='Name of person conducting the inspection'
                value={inspector}
                onChange={e => { setInspector(e.target.value); setError(null) }}
                error={!!error}
              />
            </Grid>
          </Grid>
        )}

        {/* ── Step 2: Room-by-room checklist ──────────────────────────── */}
        {step === 1 && (
          <Box>
            {/* Room selector */}
            <Typography variant='subtitle2' sx={{ mb: 1.5, color: 'text.secondary' }}>
              Select rooms to inspect:
            </Typography>
            <Box className='flex flex-wrap gap-2 mbe-4'>
              {ROOMS.map(r => (
                <Chip
                  key={r.value}
                  label={r.label}
                  size='small'
                  variant={selectedRooms.includes(r.value) ? 'filled' : 'outlined'}
                  color={selectedRooms.includes(r.value) ? 'primary' : 'default'}
                  onClick={() => toggleRoom(r.value)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Accordions per room */}
            {selectedRooms.map(room => (
              <Accordion
                key={room}
                expanded={expandedRoom === room}
                onChange={(_, open) => setExpandedRoom(open ? room : false)}
                disableGutters
                sx={{ mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}
              >
                <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
                  <Typography fontWeight={600}>{roomLabel(room)}</Typography>
                  <Box sx={{ ml: 'auto', mr: 2 }}>
                    {/* count of completed items */}
                    {(() => {
                      const done = ITEMS.filter(i => checklist[makeKey(room, i.value)]?.condition).length
                      return done > 0 ? (
                        <Chip label={`${done}/${ITEMS.length}`} size='small' color='success' variant='tonal' />
                      ) : null
                    })()}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  {ITEMS.map((itm, itmIdx) => (
                    <ItemRow
                      key={itm.value}
                      room={room}
                      itm={itm}
                      state={getItem(room, itm.value)}
                      uploadingKey={uploadingKey}
                      isLast={itmIdx === ITEMS.length - 1}
                      onConditionToggle={c => updateItem(room, itm.value, {
                        condition: getItem(room, itm.value).condition === c ? undefined : c,
                      })}
                      onNotesChange={notes => updateItem(room, itm.value, { notes })}
                      onPhotoUpload={files => handlePhotoUpload(room, itm.value, files)}
                      onRemovePhoto={idx => removePhoto(room, itm.value, idx)}
                    />
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* ── Step 3: Finalise ────────────────────────────────────────── */}
        {step === 2 && (
          <Grid container spacing={4}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size='small'
                multiline
                rows={3}
                label='Inspector Notes (Overall)'
                placeholder='General observations about the unit condition…'
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size='small'
                multiline
                rows={2}
                label='Tenant Acknowledgement (Optional)'
                placeholder='Tenant statement or acknowledgement…'
                value={acknowledgement}
                onChange={e => setAck(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size='small'
                type='date'
                label='Sign-off Date (Optional)'
                value={signedOff}
                onChange={e => setSignedOff(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            {/* summary stats */}
            <Grid size={{ xs: 12 }}>
              {(() => {
                let good = 0, fair = 0, poor = 0
                for (const v of Object.values(checklist)) {
                  if (v?.condition === 'GOOD') good++
                  else if (v?.condition === 'FAIR') fair++
                  else if (v?.condition === 'POOR') poor++
                }
                const total = good + fair + poor
                return total > 0 ? (
                  <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                    <Typography variant='caption' color='text.secondary' sx={{ mb: 1, display: 'block' }}>
                      Inspection summary — {total} item{total !== 1 ? 's' : ''} recorded
                    </Typography>
                    <Box className='flex gap-2'>
                      <Chip label={`${good} Good`}  size='small' color='success' variant='tonal' />
                      <Chip label={`${fair} Fair`}  size='small' color='warning' variant='tonal' />
                      <Chip label={`${poor} Poor`}  size='small' color='error'   variant='tonal' />
                    </Box>
                  </Box>
                ) : (
                  <Alert severity='warning'>
                    No items were assessed. Go back to Step 2 to rate room items.
                  </Alert>
                )
              })()}
            </Grid>
          </Grid>
        )}

        {saving && <LinearProgress sx={{ mt: 3 }} />}
      </DialogContent>

      <DialogActions className='gap-2 pbs-4'>
        {step > 0 && (
          <Button variant='outlined' color='secondary' onClick={() => setStep(s => s - 1)} disabled={saving}>
            Back
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button variant='outlined' color='secondary' onClick={close} disabled={saving}>
          Cancel
        </Button>

        {step < 2 && (
          <Button
            variant='contained'
            onClick={step === 0 ? handleNext1 : () => setStep(2)}
            disabled={saving}
            endIcon={saving && step === 0 ? <CircularProgress size={16} color='inherit' /> : <i className='ri-arrow-right-line' />}
          >
            {saving && step === 0 ? 'Creating…' : 'Next'}
          </Button>
        )}

        {step === 2 && (
          <Button
            variant='contained'
            color='success'
            onClick={handleComplete}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='ri-check-line' />}
          >
            {saving ? 'Saving…' : 'Complete Inspection'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
