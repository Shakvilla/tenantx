'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Tooltip from '@mui/material/Tooltip'
import { styled } from '@mui/material/styles'

// API Imports
import { getProperties } from '@/lib/api/properties'
import { getUnitsByProperty } from '@/lib/api/units'
import { getOccupants, type OccupantRecord } from '@/lib/api/occupants'
import {
  getMaintainers,
  getMaintenanceCategories,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  assignMaintainerToRequest,
  updateMaintenanceRequestStatus,
  uploadMaintenanceImages,
  type MaintenanceRequest,
  type Maintainer,
  type MaintenanceCategory
} from '@/lib/api/maintenance'
import { getStoredTenantId } from '@/lib/api/storage'
import type { Property, Unit } from '@/types/property'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'

// ─── Styled Components ────────────────────────────────────────────────────────

const UploadArea = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border-color 0.2s, background-color 0.2s',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover
  }
}))

const ImagePreviewCard = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  border: `1px solid ${theme.palette.divider}`,
  '& .remove-button': {
    position: 'absolute',
    top: 8,
    right: 8,
    opacity: 0,
    transition: 'opacity 0.2s',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' }
  },
  '&:hover .remove-button': { opacity: 1 }
}))

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  handleClose: () => void
  onSuccess: () => void
  editData?: MaintenanceRequest | null
  mode?: 'add' | 'edit'
}

type FormData = {
  title: string
  description: string
  priority: string
  status: string
  propertyId: string
  unitId: string
  occupantId: string
  categoryId: string
  maintainerId: string
  notes: string
}

type NewImageItem = { file: File; preview: string }

const BLANK: FormData = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'NEW',
  propertyId: '',
  unitId: '',
  occupantId: '',
  categoryId: '',
  maintainerId: '',
  notes: ''
}

// ─── Component ───────────────────────────────────────────────────────────────

const AddMaintenanceRequestDialog = ({ open, handleClose, onSuccess, editData, mode = 'add' }: Props) => {
  const [activeTab, setActiveTab] = useState(0)
  const [formData, setFormData] = useState<FormData>(BLANK)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Image state
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [existingImageFileIds, setExistingImageFileIds] = useState<string[]>([])
  const [newImages, setNewImages] = useState<NewImageItem[]>([])
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dropdown data
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [occupants, setOccupants] = useState<OccupantRecord[]>([])
  const [maintainers, setMaintainers] = useState<Maintainer[]>([])
  const [categories, setCategories] = useState<MaintenanceCategory[]>([])

  // Loading states
  const [loadingInit, setLoadingInit] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [loadingOccupants, setLoadingOccupants] = useState(false)

  // ── Cleanup blob URLs on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      newImages.forEach(img => URL.revokeObjectURL(img.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Fetch properties + maintainers + categories when dialog opens ─────────
  useEffect(() => {
    if (!open) return

    setApiError(null)
    setErrors({})
    setActiveTab(0)

    // Revoke any leftover blob URLs
    newImages.forEach(img => URL.revokeObjectURL(img.preview))
    setNewImages([])

    // Populate form and images
    if (mode === 'edit' && editData) {
      setFormData({
        title: editData.title ?? '',
        description: editData.description ?? '',
        priority: editData.priority ?? 'MEDIUM',
        status: editData.status ?? 'NEW',
        propertyId: editData.propertyId ?? '',
        unitId: editData.unitId ?? '',
        occupantId: editData.occupantId ?? '',
        categoryId: editData.categoryId ?? '',
        maintainerId: editData.maintainerId ?? '',
        notes: editData.notes ?? ''
      })
      setExistingImages(editData.images || [])
      setExistingImageFileIds(editData.imageFileIds || [])
    } else {
      setFormData(BLANK)
      setExistingImages([])
      setExistingImageFileIds([])
    }

    const tenantId = getStoredTenantId() ?? ''

    setLoadingInit(true)
    Promise.all([
      getProperties(tenantId, { size: 200 }),
      getMaintainers({ size: 200 }, tenantId),
      getMaintenanceCategories(true, tenantId)
    ])
      .then(([propsRes, maintainersRes, catsRes]) => {
        setProperties(propsRes.data ?? [])
        setMaintainers(maintainersRes.data ?? [])
        setCategories(Array.isArray(catsRes) ? catsRes : [])
      })
      .catch(() => {})
      .finally(() => setLoadingInit(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData, mode])

  // ── Fetch units when property changes ──────────────────────────────────────
  useEffect(() => {
    if (!formData.propertyId) {
      setUnits([])
      return
    }
    const tenantId = getStoredTenantId() ?? ''
    setLoadingUnits(true)
    setUnits([])
    getUnitsByProperty(tenantId, formData.propertyId, { size: 200 })
      .then(res => setUnits(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingUnits(false))
  }, [formData.propertyId])

  // ── Fetch occupants when property/unit changes ────────────────────────────
  useEffect(() => {
    if (!formData.propertyId) {
      setOccupants([])
      return
    }
    const tenantId = getStoredTenantId() ?? ''
    setLoadingOccupants(true)
    setOccupants([])
    getOccupants(tenantId, { propertyId: formData.propertyId, size: 200 })
      .then(res => {
        let list = res.data ?? []
        if (formData.unitId) {
          list = list.filter(o => o.unitId === formData.unitId)
        }
        setOccupants(list)
      })
      .catch(() => {})
      .finally(() => setLoadingOccupants(false))
  }, [formData.propertyId, formData.unitId])

  // ── Field setter — resets dependent fields ─────────────────────────────────
  const set = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'propertyId') { next.unitId = ''; next.occupantId = '' }
      if (field === 'unitId') { next.occupantId = '' }
      return next
    })
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  // ── Image handling ─────────────────────────────────────────────────────────
  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    const newItems: NewImageItem[] = arr.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    setNewImages(prev => [...prev, ...newItems])
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files)
    }
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingOver(true) }
  const handleDragLeave = () => setIsDraggingOver(false)

  const removeExistingImage = (idx: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx))
    setExistingImageFileIds(prev => prev.filter((_, i) => i !== idx))
  }

  const removeNewImage = (idx: number) => {
    setNewImages(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!formData.propertyId) e.propertyId = 'Property is required'
    if (!formData.title.trim()) e.title = 'Title is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setApiError(null)

    try {
      const tenantId = getStoredTenantId() ?? ''
      let requestId: string

      if (mode === 'edit' && editData) {
        // Upload any new images first (no requestId folder yet — use existing id)
        let allImages = [...existingImages]
        let allFileIds = [...existingImageFileIds]

        if (newImages.length > 0) {
          const uploaded = await uploadMaintenanceImages(tenantId, newImages.map(i => i.file), editData.id)
          newImages.forEach(img => URL.revokeObjectURL(img.preview))
          setNewImages([])
          allImages = [...allImages, ...uploaded.map(u => u.url)]
          allFileIds = [...allFileIds, ...uploaded.map(u => u.fileId)]
        }

        await updateMaintenanceRequest(editData.id, {
          title: formData.title,
          description: formData.description || undefined,
          priority: formData.priority,
          propertyId: formData.propertyId,
          unitId: formData.unitId || undefined,
          occupantId: formData.occupantId || undefined,
          categoryId: formData.categoryId || undefined,
          notes: formData.notes || undefined,
          images: allImages,
          imageFileIds: allFileIds
        })
        requestId = editData.id

        if (formData.status && formData.status !== editData.status) {
          await updateMaintenanceRequestStatus(requestId, formData.status)
        }
      } else {
        // Create first (need ID for folder), then upload, then update with image URLs
        const created = await createMaintenanceRequest({
          title: formData.title,
          description: formData.description || '',
          priority: formData.priority,
          propertyId: formData.propertyId,
          unitId: formData.unitId || undefined,
          occupantId: formData.occupantId || undefined,
          categoryId: formData.categoryId || undefined,
          notes: formData.notes || undefined
        })
        requestId = created.id

        if (newImages.length > 0) {
          const uploaded = await uploadMaintenanceImages(tenantId, newImages.map(i => i.file), requestId)
          newImages.forEach(img => URL.revokeObjectURL(img.preview))
          setNewImages([])
          await updateMaintenanceRequest(requestId, {
            images: uploaded.map(u => u.url),
            imageFileIds: uploaded.map(u => u.fileId)
          })
        }
      }

      // Assign maintainer if one is selected
      if (formData.maintainerId) {
        await assignMaintainerToRequest(requestId, formData.maintainerId)
      }

      onSuccess()
      handleClose()
    } catch (err: any) {
      setApiError(err?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const occupantFullName = (o: OccupantRecord) => `${o.firstName} ${o.lastName}`
  const occupantLabel = (o: OccupantRecord) =>
    `${occupantFullName(o)}${o.email ? ` (${o.email})` : ''}`
  const maintainerLabel = (m: Maintainer) =>
    `${m.name}${m.specializations?.length ? ` — ${m.specializations[0]}` : ''}`

  const totalImages = existingImages.length + newImages.length

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span className='font-medium'>
          {mode === 'edit' ? 'Edit Maintenance Request' : 'Add Maintenance Request'}
        </span>
        <IconButton size='small' onClick={handleClose} disabled={submitting}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label='Details' />
          <Tab label={`Photos${totalImages > 0 ? ` (${totalImages})` : ''}`} />
        </Tabs>
      </Box>

      <DialogContent className='flex flex-col gap-4 pbs-4'>
        {apiError && (
          <Alert severity='error' onClose={() => setApiError(null)}>{apiError}</Alert>
        )}

        {/* ── Details tab ── */}
        {activeTab === 0 && (
          <Grid container spacing={4}>
            {/* Property */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size='small' error={Boolean(errors.propertyId)} disabled={loadingInit}>
                <InputLabel id='property-label'>Property *</InputLabel>
                <Select
                  labelId='property-label'
                  label='Property *'
                  value={formData.propertyId}
                  onChange={e => set('propertyId', e.target.value)}
                >
                  <MenuItem value=''>Select Property</MenuItem>
                  {properties.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </Select>
                {errors.propertyId && (
                  <Typography variant='caption' color='error' className='mts-1'>
                    {errors.propertyId}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Unit */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size='small' disabled={!formData.propertyId || loadingUnits}>
                <InputLabel id='unit-label'>Unit</InputLabel>
                <Select
                  labelId='unit-label'
                  label='Unit'
                  value={formData.unitId}
                  onChange={e => set('unitId', e.target.value)}
                >
                  <MenuItem value=''>
                    {loadingUnits ? 'Loading units…' : 'Select Unit'}
                  </MenuItem>
                  {units.map(u => (
                    <MenuItem key={u.id} value={u.id}>{u.unitNo}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Occupant */}
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                size='small'
                fullWidth
                loading={loadingOccupants}
                disabled={!formData.propertyId}
                options={occupants}
                getOptionLabel={occupantLabel}
                value={occupants.find(o => o.id === formData.occupantId) ?? null}
                onChange={(_, v) => set('occupantId', v?.id ?? '')}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Occupant / Tenant'
                    placeholder='Search occupant…'
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position='start'>
                              <i className='ri-search-line text-textSecondary' />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <div className='flex items-center gap-2'>
                      <CustomAvatar skin='light' size={28}>
                        {getInitials(occupantFullName(option))}
                      </CustomAvatar>
                      <div className='flex flex-col'>
                        <Typography className='font-medium' color='text.primary'>
                          {occupantFullName(option)}
                        </Typography>
                        <Typography variant='caption'>{option.email}</Typography>
                      </div>
                    </div>
                  </li>
                )}
              />
            </Grid>

            {/* Title */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size='small'
                label='Title *'
                placeholder='Brief description of the issue'
                value={formData.title}
                onChange={e => set('title', e.target.value)}
                error={Boolean(errors.title)}
                helperText={errors.title}
              />
            </Grid>

            {/* Description */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                size='small'
                label='Description'
                placeholder='Detailed description of the issue'
                value={formData.description}
                onChange={e => set('description', e.target.value)}
              />
            </Grid>

            {/* Priority */}
            <Grid size={{ xs: 12, sm: mode === 'edit' ? 4 : 6 }}>
              <FormControl fullWidth size='small'>
                <InputLabel id='priority-label'>Priority</InputLabel>
                <Select
                  labelId='priority-label'
                  label='Priority'
                  value={formData.priority}
                  onChange={e => set('priority', e.target.value)}
                >
                  <MenuItem value='LOW'>Low</MenuItem>
                  <MenuItem value='MEDIUM'>Medium</MenuItem>
                  <MenuItem value='HIGH'>High</MenuItem>
                  <MenuItem value='URGENT'>Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Status — edit mode only */}
            {mode === 'edit' && (
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='status-label'>Status</InputLabel>
                  <Select
                    labelId='status-label'
                    label='Status'
                    value={formData.status}
                    onChange={e => set('status', e.target.value)}
                  >
                    <MenuItem value='NEW'>New</MenuItem>
                    <MenuItem value='PENDING'>Pending</MenuItem>
                    <MenuItem value='IN_PROGRESS'>In Progress</MenuItem>
                    <MenuItem value='ON_HOLD'>On Hold</MenuItem>
                    <MenuItem value='COMPLETED'>Completed</MenuItem>
                    <MenuItem value='CANCELLED'>Cancelled</MenuItem>
                    <MenuItem value='REJECTED'>Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Category */}
            <Grid size={{ xs: 12, sm: mode === 'edit' ? 4 : 6 }}>
              <FormControl fullWidth size='small' disabled={loadingInit}>
                <InputLabel id='category-label'>Category</InputLabel>
                <Select
                  labelId='category-label'
                  label='Category'
                  value={formData.categoryId}
                  onChange={e => set('categoryId', e.target.value)}
                >
                  <MenuItem value=''>None</MenuItem>
                  {categories.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Assign To */}
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                size='small'
                fullWidth
                loading={loadingInit}
                options={maintainers}
                getOptionLabel={maintainerLabel}
                value={maintainers.find(m => m.id === formData.maintainerId) ?? null}
                onChange={(_, v) => set('maintainerId', v?.id ?? '')}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Assign To (Optional)'
                    placeholder='Search maintainer…'
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position='start'>
                              <i className='ri-search-line text-textSecondary' />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <div className='flex items-center gap-2'>
                      <CustomAvatar skin='light' size={28}>
                        {getInitials(option.name)}
                      </CustomAvatar>
                      <div className='flex flex-col'>
                        <Typography className='font-medium' color='text.primary'>
                          {option.name}
                        </Typography>
                        <Typography variant='caption'>
                          {option.specializations?.join(', ') || 'General'}
                        </Typography>
                      </div>
                    </div>
                  </li>
                )}
              />
            </Grid>

            {/* Notes */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size='small'
                label='Notes'
                placeholder='Additional notes or instructions'
                value={formData.notes}
                onChange={e => set('notes', e.target.value)}
              />
            </Grid>
          </Grid>
        )}

        {/* ── Photos tab ── */}
        {activeTab === 1 && (
          <Box className='flex flex-col gap-4'>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              multiple
              hidden
              onChange={handleFileInputChange}
            />

            {/* Drop zone */}
            <UploadArea
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              sx={isDraggingOver ? { borderColor: 'primary.main', backgroundColor: 'action.hover' } : {}}
            >
              <i className='ri-upload-cloud-2-line text-4xl text-textSecondary mb-2 block' />
              <Typography variant='body1' fontWeight={500}>
                Drop photos here or click to browse
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                PNG, JPG, WEBP — multiple files supported
              </Typography>
            </UploadArea>

            {/* Image grid */}
            {totalImages > 0 && (
              <Box>
                <Typography variant='caption' color='text.secondary' className='mb-2 block'>
                  {totalImages} photo{totalImages !== 1 ? 's' : ''} attached
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1.5 }}>
                  {/* Existing images */}
                  {existingImages.map((url, idx) => (
                    <ImagePreviewCard key={`existing-${idx}`}>
                      <Box
                        component='img'
                        src={url}
                        alt={`Image ${idx + 1}`}
                        sx={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                      />
                      <Tooltip title='Remove'>
                        <IconButton
                          size='small'
                          className='remove-button'
                          onClick={() => removeExistingImage(idx)}
                          disabled={submitting}
                        >
                          <i className='ri-close-line text-sm' />
                        </IconButton>
                      </Tooltip>
                    </ImagePreviewCard>
                  ))}

                  {/* New images (not yet uploaded) */}
                  {newImages.map((item, idx) => (
                    <ImagePreviewCard key={`new-${idx}`}>
                      <Box
                        component='img'
                        src={item.preview}
                        alt={`New ${idx + 1}`}
                        sx={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                      />
                      {/* Pending badge */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 4,
                          left: 4,
                          bgcolor: 'warning.main',
                          color: 'white',
                          borderRadius: 0.5,
                          px: 0.5,
                          py: 0.25,
                          fontSize: '0.6rem',
                          lineHeight: 1
                        }}
                      >
                        new
                      </Box>
                      <Tooltip title='Remove'>
                        <IconButton
                          size='small'
                          className='remove-button'
                          onClick={() => removeNewImage(idx)}
                          disabled={submitting}
                        >
                          <i className='ri-close-line text-sm' />
                        </IconButton>
                      </Tooltip>
                    </ImagePreviewCard>
                  ))}
                </Box>
              </Box>
            )}

            {totalImages === 0 && (
              <Typography variant='body2' color='text.secondary' textAlign='center'>
                No photos added yet.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={
            submitting
              ? <CircularProgress size={16} color='inherit' />
              : <i className={mode === 'edit' ? 'ri-save-line' : 'ri-add-line'} />
          }
        >
          {submitting ? 'Saving…' : mode === 'edit' ? 'Update Request' : 'Add Request'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddMaintenanceRequestDialog
