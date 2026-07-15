'use client'

import { useState, useEffect, useCallback } from 'react'

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
import CardMedia from '@mui/material/CardMedia'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Tooltip from '@mui/material/Tooltip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

// API Imports
import {
  getComments, addComment, deleteComment,
  getParts, addPart, deletePart,
  getMaintenanceCategories,
  getMaintainers,
  assignMaintainerToRequest,
  updateMaintenanceRequestStatus,
  confirmMaintenanceRequest,
  disputeMaintenanceRequest,
  type MaintenanceRequest,
  type MaintenanceComment,
  type MaintenancePartItem,
  type MaintenanceCategory,
  type Maintainer
} from '@/lib/api/maintenance'
import { getUnitById } from '@/lib/api/units'
import { getStoredTenantId } from '@/lib/api/storage'
import { useAuth } from '@/contexts/AuthContext'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  request: MaintenanceRequest | null
  onEdit: () => void
  /** Called with the updated request after the occupant confirms or disputes. */
  onDecision?: (updated: MaintenanceRequest) => void
}

const formatDate = (d?: string | null) => {
  if (!d) return '-'
  const date = new Date(d)
  return `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`
}

const formatDateTime = (d?: string | null) => {
  if (!d) return '-'
  const date = new Date(d)
  return `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
}

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  pending:           { label: 'Pending',           color: 'warning'   },
  awaiting_approval: { label: 'Awaiting Approval', color: 'info'      },
  approved:          { label: 'Approved',          color: 'secondary' },
  in_progress:       { label: 'In Progress',       color: 'primary'   },
  // 'completed' now means the work is done but awaiting the tenant's confirmation.
  completed:         { label: 'Awaiting Confirmation', color: 'info'  },
  closed:            { label: 'Closed',            color: 'success'   },
  cancelled:         { label: 'Cancelled',         color: 'error'     },
}

function getAvailableTransitions(currentStatus: string, hasMaintainer: boolean): Array<{ value: string; label: string }> {
  switch (currentStatus) {
    case 'pending':
      return [
        ...(hasMaintainer ? [{ value: 'in_progress', label: 'In Progress' }] : []),
        { value: 'cancelled', label: 'Cancelled' },
      ]
    case 'awaiting_approval':
      return [
        { value: 'approved',  label: 'Approved'  },
        { value: 'cancelled', label: 'Cancelled' },
      ]
    case 'approved':
      return [
        { value: 'in_progress', label: 'In Progress' },
        { value: 'cancelled',   label: 'Cancelled'   },
      ]
    case 'in_progress':
      return [
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ]
    case 'completed':
      // Awaiting the tenant's confirmation. The landlord may force-close for an unresponsive
      // tenant (leaving tenantConfirmed false); the tenant's own path is Confirm / Dispute.
      return [
        { value: 'closed',    label: 'Close (no tenant confirmation)' },
        { value: 'cancelled', label: 'Cancelled' },
      ]
    case 'closed':
    case 'cancelled':
      return []
    default:
      return [{ value: 'cancelled', label: 'Cancelled' }]
  }
}

const PRIORITY_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'> = {
  low: 'info', medium: 'warning', high: 'error', urgent: 'error'
}

const COMPLAINT_CATEGORY_LABELS: Record<string, string> = {
  NOISE: 'Noise',
  NEIGHBOR_DISPUTE: 'Neighbor Dispute',
  SECURITY: 'Security',
  OTHER: 'Other'
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ViewMaintenanceRequestDialog = ({ open, setOpen, request, onEdit, onDecision }: Props) => {
  const { user } = useAuth()
  const [tab, setTab] = useState(0)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [unitNo, setUnitNo] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState<string | null>(null)

  // Tenant confirmation state (gap #6)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [decisionBusy, setDecisionBusy] = useState(false)
  const [decisionError, setDecisionError] = useState<string | null>(null)

  // Status change state
  const [localStatus, setLocalStatus] = useState<string>('')
  const [showStatusForm, setShowStatusForm] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [changingStatus, setChangingStatus] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  // Maintainer assignment state
  const [maintainers, setMaintainers] = useState<Maintainer[]>([])
  const [localMaintainerId, setLocalMaintainerId] = useState<string | null>(null)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [selectedMaintainerId, setSelectedMaintainerId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  // Comments state
  const [comments, setComments] = useState<MaintenanceComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentVisibility, setCommentVisibility] = useState<'public' | 'internal'>('public')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  // Parts state
  const [parts, setParts] = useState<MaintenancePartItem[]>([])
  const [loadingParts, setLoadingParts] = useState(false)
  const [newPart, setNewPart] = useState({ partName: '', quantity: '', unitCost: '', notes: '' })
  const [addingPart, setAddingPart] = useState(false)
  const [showAddPart, setShowAddPart] = useState(false)
  const [partsError, setPartsError] = useState<string | null>(null)

  // Load comments + parts + unit when dialog opens
  useEffect(() => {
    if (!open || !request) return
    setTab(0)
    setSelectedImageIndex(0)
    setUnitNo(null)
    setCategoryName(null)
    setLocalStatus(request.status ?? '')
    setShowStatusForm(false)
    setSelectedStatus(request.status ?? '')
    setStatusError(null)
    setLocalMaintainerId(request.maintainerId ?? null)
    setShowAssignForm(false)
    setSelectedMaintainerId(request.maintainerId ?? '')
    setAssignError(null)
    setCommentText('')
    setCommentError(null)
    setPartsError(null)
    setShowAddPart(false)
    setNewPart({ partName: '', quantity: '', unitCost: '', notes: '' })

    const tid = getStoredTenantId()

    // Resolve unit number from unitId
    if (request.unitId && tid) {
      getUnitById(tid, request.unitId)
        .then(res => { if (res.data?.unitNo) setUnitNo(res.data.unitNo) })
        .catch(() => {})
    }

    // Resolve category name from categoryId
    if (request.categoryId) {
      getMaintenanceCategories(false, tid ?? undefined)
        .then(cats => {
          const match = cats.find(c => c.id === request.categoryId)
          if (match) setCategoryName(match.name)
        })
        .catch(() => {})
    }

    // Load maintainers for assignment
    getMaintainers({ size: 200 }, tid ?? undefined)
      .then(res => setMaintainers(res.data ?? []))
      .catch(() => {})

    // Load comments
    setLoadingComments(true)
    getComments(request.id)
      .then(res => setComments(Array.isArray(res) ? res : []))
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false))

    // Load parts
    setLoadingParts(true)
    getParts(request.id)
      .then(res => setParts(Array.isArray(res) ? res : []))
      .catch(() => setParts([]))
      .finally(() => setLoadingParts(false))
  }, [open, request])

  const handleAddComment = useCallback(async () => {
    if (!request || !commentText.trim()) return
    setSubmittingComment(true)
    setCommentError(null)
    try {
      const created = await addComment(request.id, { content: commentText.trim(), visibility: commentVisibility })
      setComments(prev => [...prev, created])
      setCommentText('')
    } catch (err: any) {
      setCommentError(err?.message ?? 'Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }, [request, commentText, commentVisibility])

  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      await deleteComment(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (err: any) {
      setCommentError(err?.message ?? 'Failed to delete comment')
    }
  }, [])

  const handleAddPart = useCallback(async () => {
    if (!request || !newPart.partName.trim() || !newPart.quantity || !newPart.unitCost) return
    setAddingPart(true)
    setPartsError(null)
    try {
      const created = await addPart(request.id, {
        partName: newPart.partName.trim(),
        quantity: Number(newPart.quantity),
        unitCost: Number(newPart.unitCost),
        notes: newPart.notes || undefined
      })
      setParts(prev => [...prev, created])
      setNewPart({ partName: '', quantity: '', unitCost: '', notes: '' })
      setShowAddPart(false)
    } catch (err: any) {
      setPartsError(err?.message ?? 'Failed to add part')
    } finally {
      setAddingPart(false)
    }
  }, [request, newPart])

  const handleDeletePart = useCallback(async (partId: string) => {
    try {
      await deletePart(partId)
      setParts(prev => prev.filter(p => p.id !== partId))
    } catch (err: any) {
      setPartsError(err?.message ?? 'Failed to delete part')
    }
  }, [])

  const handleAssign = useCallback(async () => {
    if (!request || !selectedMaintainerId) return
    setAssigning(true)
    setAssignError(null)
    try {
      await assignMaintainerToRequest(request.id, selectedMaintainerId)
      setLocalMaintainerId(selectedMaintainerId)
      setShowAssignForm(false)
    } catch (err: any) {
      setAssignError(err?.message ?? 'Failed to assign maintainer')
    } finally {
      setAssigning(false)
    }
  }, [request, selectedMaintainerId])

  const handleChangeStatus = useCallback(async () => {
    if (!request || !selectedStatus || selectedStatus === localStatus) return
    setChangingStatus(true)
    setStatusError(null)
    try {
      await updateMaintenanceRequestStatus(request.id, selectedStatus)
      setLocalStatus(selectedStatus)
      setShowStatusForm(false)
    } catch (err: any) {
      setStatusError(err?.message ?? 'Failed to update status')
    } finally {
      setChangingStatus(false)
    }
  }, [request, selectedStatus, localStatus])

  if (!request) return null

  // issueType is the authoritative discriminator: a request that was switched
  // from Repair to Complaint (or back) on edit may still carry the opposite
  // type's fields in the DB (the null-guarded PATCH can't clear a column by
  // omission), so gate every type-specific row on issueType, not on field
  // presence — otherwise a complaint could render stale repair rows.
  const isComplaint = request.issueType === 'COMPLAINT'

  const images = request.images?.length ? request.images : []
  const statusConfig = STATUS_CONFIG[localStatus] ?? { label: localStatus, color: 'default' as const }
  const priorityColor = PRIORITY_COLORS[request.priority?.toLowerCase()] ?? 'secondary'
  const totalPartsCost = parts.reduce((sum, p) => sum + (p.totalCost ?? 0), 0)
  // 'completed' is no longer terminal — it awaits tenant confirmation.
  const isTerminal = localStatus === 'closed' || localStatus === 'cancelled'
  const availableTransitions = getAvailableTransitions(localStatus, !!localMaintainerId)

  // The occupant who owns the request may confirm or dispute a completed repair.
  const canDecide =
    localStatus === 'completed' &&
    user?.userType === 'OCCUPANT' &&
    !!request.occupantId &&
    request.occupantId === user?.id

  const handleConfirm = async () => {
    setDecisionBusy(true)
    setDecisionError(null)
    try {
      const updated = await confirmMaintenanceRequest(request.id)
      setLocalStatus(updated.status)
      onDecision?.(updated)
    } catch (err: any) {
      setDecisionError(err?.response?.data?.message ?? err?.message ?? 'Failed to confirm the repair')
    } finally {
      setDecisionBusy(false)
    }
  }

  const handleDispute = async () => {
    setDecisionBusy(true)
    setDecisionError(null)
    try {
      const updated = await disputeMaintenanceRequest(request.id, disputeReason || undefined)
      setLocalStatus(updated.status)
      setDisputeOpen(false)
      setDisputeReason('')
      onDecision?.(updated)
    } catch (err: any) {
      setDecisionError(err?.response?.data?.message ?? err?.message ?? 'Failed to reopen the request')
    } finally {
      setDecisionBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between pbs-5 pbe-3 pli-6'>
        <Box>
          <Typography variant='h6' component='span' className='font-medium'>{request.title}</Typography>
          {request.requestNumber && (
            <Typography variant='body2' color='text.secondary'>{request.requestNumber}</Typography>
          )}
        </Box>
        <IconButton size='small' onClick={() => setOpen(false)}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      {/* Status + Priority chips + inline status changer */}
      <Box className='flex flex-wrap items-center gap-2 pli-6 pbe-3'>
        <Chip variant='tonal' label={statusConfig.label} size='small' color={statusConfig.color} />
        <Chip variant='tonal' label={request.priority} size='small' color={priorityColor} className='capitalize' />
        {request.isSlaBreached && <Chip variant='tonal' label='SLA Breached' size='small' color='error' />}
        {!showStatusForm && (
          isTerminal ? (
            <Tooltip title='Status cannot be changed'>
              <span>
                <IconButton size='small' disabled>
                  <i className='ri-refresh-line text-sm' />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title='Change status'>
              <IconButton size='small' onClick={() => { setShowStatusForm(true); setSelectedStatus('') }}>
                <i className='ri-refresh-line text-sm' />
              </IconButton>
            </Tooltip>
          )
        )}
      </Box>

      {/* Inline status change form */}
      {showStatusForm && !isTerminal && (
        <Box className='flex items-center gap-2 pli-6 pbe-3'>
          <FormControl size='small' sx={{ minWidth: 160 }}>
            <InputLabel id='status-change-label'>New Status</InputLabel>
            <Select
              labelId='status-change-label'
              label='New Status'
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              {availableTransitions.map(o => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            size='small'
            variant='contained'
            onClick={handleChangeStatus}
            disabled={changingStatus || !selectedStatus || selectedStatus === localStatus}
            startIcon={changingStatus ? <CircularProgress size={14} /> : undefined}
          >
            Confirm
          </Button>
          <Button size='small' variant='outlined' color='secondary' onClick={() => { setShowStatusForm(false); setStatusError(null) }}>
            Cancel
          </Button>
          {statusError && <Typography variant='caption' color='error'>{statusError}</Typography>}
        </Box>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label='Details' />
          <Tab label={`Comments${comments.length > 0 ? ` (${comments.length})` : ''}`} />
          <Tab label={`Parts${parts.length > 0 ? ` (${parts.length})` : ''}`} />
        </Tabs>
      </Box>

      <DialogContent className='pbs-4' sx={{ minHeight: 340 }}>

        {/* ── Details Tab ── */}
        {tab === 0 && (
          <Box className='flex flex-col gap-4'>
            <Card variant='outlined'>
              <CardContent className='flex flex-col gap-3'>
                {request.description && (
                  <Box>
                    <Typography variant='body2' color='text.secondary' className='mbe-1'>Description</Typography>
                    <Typography variant='body1'>{request.description}</Typography>
                  </Box>
                )}
                {request.notes && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant='body2' color='text.secondary' className='mbe-1'>Notes</Typography>
                      <Typography variant='body1'>{request.notes}</Typography>
                    </Box>
                  </>
                )}
                <Divider />
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant='body2' color='text.secondary'>Requested</Typography>
                    <Typography variant='body1' className='font-medium'>{formatDate(request.createdAt)}</Typography>
                  </Grid>
                  {!isComplaint && request.targetResolutionDate && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant='body2' color='text.secondary'>Target Resolution</Typography>
                      <Typography variant='body1' className='font-medium'>{formatDate(request.targetResolutionDate)}</Typography>
                    </Grid>
                  )}
                  {!isComplaint && request.scheduledDate && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant='body2' color='text.secondary'>Scheduled Date</Typography>
                      <Typography variant='body1' className='font-medium'>{formatDate(request.scheduledDate)}</Typography>
                    </Grid>
                  )}
                  {request.completedDate && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant='body2' color='text.secondary'>Completed</Typography>
                      <Typography variant='body1' className='font-medium' color='success.main'>
                        {formatDate(request.completedDate)}
                      </Typography>
                    </Grid>
                  )}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant='caption' color='text.secondary'>Type</Typography>
                    <Typography variant='body2' color='text.primary'>
                      {request.issueType === 'COMPLAINT' ? 'Complaint' : 'Repair'}
                    </Typography>
                  </Grid>
                  {isComplaint && request.complaintCategory && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant='caption' color='text.secondary'>Complaint Category</Typography>
                      <Typography variant='body2' color='text.primary'>
                        {COMPLAINT_CATEGORY_LABELS[request.complaintCategory] ?? request.complaintCategory}
                      </Typography>
                    </Grid>
                  )}
                  {!isComplaint && request.categoryId && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant='body2' color='text.secondary'>Category</Typography>
                      <Typography variant='body1' className='font-medium'>
                        {categoryName ?? <Typography component='span' color='text.secondary' variant='body1'>—</Typography>}
                      </Typography>
                    </Grid>
                  )}
                  {request.unitId && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant='body2' color='text.secondary'>Unit</Typography>
                      <Typography variant='body1' className='font-medium'>
                        {unitNo ?? <Typography component='span' color='text.secondary' variant='body1'>Loading…</Typography>}
                      </Typography>
                    </Grid>
                  )}
                  {!isComplaint && request.billableTo && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant='body2' color='text.secondary'>Billable To</Typography>
                      <Typography variant='body1' className='font-medium capitalize'>{request.billableTo}</Typography>
                    </Grid>
                  )}
                  {!isComplaint && request.estimatedCost != null && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant='body2' color='text.secondary'>Estimated Cost</Typography>
                      <Typography variant='body1' className='font-medium'>
                        {request.currency ?? 'GHS'} {Number(request.estimatedCost).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                  {!isComplaint && request.actualCost != null && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant='body2' color='text.secondary'>Actual Cost</Typography>
                      <Typography variant='body1' className='font-medium'>
                        {request.currency ?? 'GHS'} {Number(request.actualCost).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                  {!isComplaint && request.permissionToEnter != null && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant='body2' color='text.secondary'>Permission to Enter</Typography>
                      <Typography variant='body1' className='font-medium'>
                        {request.permissionToEnter ? 'Yes' : 'No'}
                      </Typography>
                    </Grid>
                  )}
                  {!isComplaint && request.entryInstructions && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant='body2' color='text.secondary'>Entry Instructions</Typography>
                      <Typography variant='body1'>{request.entryInstructions}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Photos */}
            {/* ── Maintainer Assignment ── */}
            {!isComplaint && (
            <Card variant='outlined'>
              <CardContent className='flex flex-col gap-3'>
                <Box className='flex items-center justify-between'>
                  <Typography variant='subtitle2' className='font-medium'>Assigned Maintainer</Typography>
                  {!showAssignForm && (
                    <Button
                      size='small' variant='outlined'
                      startIcon={<i className={localMaintainerId ? 'ri-refresh-line' : 'ri-user-add-line'} />}
                      onClick={() => { setShowAssignForm(true); setSelectedMaintainerId(localMaintainerId ?? '') }}
                    >
                      {localMaintainerId ? 'Reassign' : 'Assign'}
                    </Button>
                  )}
                </Box>

                {/* Current assignee display */}
                {!showAssignForm && (
                  localMaintainerId
                    ? (() => {
                        const m = maintainers.find(x => x.id === localMaintainerId)
                        return m ? (
                          <Box className='flex items-center gap-2'>
                            <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Typography variant='caption' color='primary.main' className='font-bold'>
                                {m.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant='body2' className='font-medium'>{m.name}</Typography>
                              {m.companyName && <Typography variant='caption' color='text.secondary'>{m.companyName}</Typography>}
                            </Box>
                            <Chip label={m.status} size='small' variant='tonal' color={m.status === 'active' ? 'success' : 'secondary'} className='capitalize mls-auto' />
                          </Box>
                        ) : (
                          <Typography variant='body2' color='text.secondary'>Maintainer assigned (details loading…)</Typography>
                        )
                      })()
                    : <Typography variant='body2' color='text.secondary'>No maintainer assigned yet.</Typography>
                )}

                {/* Assign form */}
                {showAssignForm && (
                  <Box className='flex flex-col gap-2'>
                    {assignError && <Alert severity='error' onClose={() => setAssignError(null)}>{assignError}</Alert>}
                    <FormControl fullWidth size='small'>
                      <InputLabel>Select Maintainer</InputLabel>
                      <Select
                        label='Select Maintainer'
                        value={selectedMaintainerId}
                        onChange={e => setSelectedMaintainerId(e.target.value)}
                      >
                        <MenuItem value=''>— Choose a maintainer —</MenuItem>
                        {maintainers.filter(m => m.status === 'active').map(m => (
                          <MenuItem key={m.id} value={m.id}>
                            {m.name}{m.companyName ? ` (${m.companyName})` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box className='flex justify-end gap-2'>
                      <Button size='small' variant='outlined' color='secondary' onClick={() => setShowAssignForm(false)} disabled={assigning}>
                        Cancel
                      </Button>
                      <Button
                        size='small' variant='contained'
                        disabled={!selectedMaintainerId || assigning}
                        onClick={handleAssign}
                        startIcon={assigning ? <CircularProgress size={14} color='inherit' /> : <i className='ri-user-follow-line' />}
                      >
                        Confirm
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
            )}

            {images.length > 0 && (
              <Card variant='outlined'>
                <CardContent>
                  <Typography variant='subtitle2' className='font-medium mbe-3'>
                    Photos ({images.length})
                  </Typography>
                  <Box sx={{ position: 'relative', width: '100%', height: 260, borderRadius: 1, overflow: 'hidden', bgcolor: 'action.hover', mb: 1.5 }}>
                    <CardMedia
                      component='img'
                      image={images[selectedImageIndex]}
                      alt='Request image'
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  {images.length > 1 && (
                    <Grid container spacing={1}>
                      {images.map((img, i) => (
                        <Grid size={{ xs: 3, sm: 2 }} key={i}>
                          <Box
                            onClick={() => setSelectedImageIndex(i)}
                            sx={{
                              height: 64, borderRadius: 1, overflow: 'hidden', cursor: 'pointer',
                              border: i === selectedImageIndex ? '2px solid' : '1px solid',
                              borderColor: i === selectedImageIndex ? 'primary.main' : 'divider',
                              '&:hover': { borderColor: 'primary.main' }
                            }}
                          >
                            <CardMedia component='img' image={img} alt={`Image ${i + 1}`}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        {/* ── Comments Tab ── */}
        {tab === 1 && (
          <Box className='flex flex-col gap-3'>
            {commentError && <Alert severity='error' onClose={() => setCommentError(null)}>{commentError}</Alert>}

            {/* Add comment */}
            <Card variant='outlined'>
              <CardContent className='flex flex-col gap-2'>
                <Typography variant='subtitle2' className='font-medium'>Add Comment</Typography>
                <TextField
                  fullWidth multiline rows={2} size='small'
                  placeholder='Write a comment…'
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  disabled={submittingComment}
                />
                <Box className='flex items-center justify-between'>
                  <FormControl size='small' sx={{ minWidth: 130 }}>
                    <InputLabel>Visibility</InputLabel>
                    <Select
                      label='Visibility'
                      value={commentVisibility}
                      onChange={e => setCommentVisibility(e.target.value as 'public' | 'internal')}
                    >
                      <MenuItem value='public'>Public</MenuItem>
                      <MenuItem value='internal'>Internal</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant='contained' size='small'
                    disabled={!commentText.trim() || submittingComment}
                    onClick={handleAddComment}
                    startIcon={submittingComment ? <CircularProgress size={14} color='inherit' /> : <i className='ri-send-plane-line' />}
                  >
                    Post
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Comments list */}
            {loadingComments ? (
              <Box className='flex justify-center py-6'><CircularProgress size={28} /></Box>
            ) : comments.length === 0 ? (
              <Typography variant='body2' color='text.secondary' textAlign='center' className='py-6'>
                No comments yet.
              </Typography>
            ) : (
              <Box className='flex flex-col gap-2'>
                {comments.map(c => (
                  <Card key={c.id} variant='outlined'>
                    <CardContent sx={{ py: '12px !important', px: 2 }}>
                      <Box className='flex items-start justify-between gap-2'>
                        <Box className='flex-1'>
                          <Box className='flex items-center gap-2 mbe-1'>
                            <Typography variant='body2' className='font-medium'>{c.authorName}</Typography>
                            <Chip
                              label={c.visibility}
                              size='small'
                              variant='tonal'
                              color={c.visibility === 'internal' ? 'warning' : 'default'}
                              sx={{ fontSize: '0.65rem', height: 18 }}
                            />
                            <Typography variant='caption' color='text.secondary'>
                              {formatDateTime(c.createdAt)}
                            </Typography>
                          </Box>
                          <Typography variant='body2'>{c.content}</Typography>
                        </Box>
                        <Tooltip title='Delete comment'>
                          <IconButton size='small' color='error' onClick={() => handleDeleteComment(c.id)}>
                            <i className='ri-delete-bin-line text-sm' />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* ── Parts Tab ── */}
        {tab === 2 && (
          <Box className='flex flex-col gap-3'>
            {partsError && <Alert severity='error' onClose={() => setPartsError(null)}>{partsError}</Alert>}

            <Box className='flex items-center justify-between'>
              <Typography variant='subtitle2' className='font-medium'>
                Materials & Parts {parts.length > 0 && `— Total: ${request.currency ?? 'GHS'} ${totalPartsCost.toLocaleString()}`}
              </Typography>
              <Button
                size='small' variant='outlined'
                startIcon={<i className='ri-add-line' />}
                onClick={() => setShowAddPart(v => !v)}
              >
                Add Part
              </Button>
            </Box>

            {/* Add Part form */}
            {showAddPart && (
              <Card variant='outlined'>
                <CardContent className='flex flex-col gap-3'>
                  <Typography variant='subtitle2'>New Part</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size='small' label='Part Name *'
                        value={newPart.partName}
                        onChange={e => setNewPart(p => ({ ...p, partName: e.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField fullWidth size='small' label='Quantity *' type='number' inputProps={{ min: 1 }}
                        value={newPart.quantity}
                        onChange={e => setNewPart(p => ({ ...p, quantity: e.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField fullWidth size='small' label='Unit Cost *' type='number' inputProps={{ min: 0, step: '0.01' }}
                        value={newPart.unitCost}
                        onChange={e => setNewPart(p => ({ ...p, unitCost: e.target.value }))} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth size='small' label='Notes'
                        value={newPart.notes}
                        onChange={e => setNewPart(p => ({ ...p, notes: e.target.value }))} />
                    </Grid>
                  </Grid>
                  <Box className='flex justify-end gap-2'>
                    <Button size='small' variant='outlined' color='secondary' onClick={() => setShowAddPart(false)}>
                      Cancel
                    </Button>
                    <Button
                      size='small' variant='contained'
                      disabled={!newPart.partName.trim() || !newPart.quantity || !newPart.unitCost || addingPart}
                      onClick={handleAddPart}
                      startIcon={addingPart ? <CircularProgress size={14} color='inherit' /> : undefined}
                    >
                      Save Part
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Parts table */}
            {loadingParts ? (
              <Box className='flex justify-center py-6'><CircularProgress size={28} /></Box>
            ) : parts.length === 0 ? (
              <Typography variant='body2' color='text.secondary' textAlign='center' className='py-6'>
                No parts recorded yet.
              </Typography>
            ) : (
              <Card variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Part Name</TableCell>
                      <TableCell align='right'>Qty</TableCell>
                      <TableCell align='right'>Unit Cost</TableCell>
                      <TableCell align='right'>Total</TableCell>
                      <TableCell align='right'>Notes</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parts.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{p.partName}</TableCell>
                        <TableCell align='right'>{p.quantity}</TableCell>
                        <TableCell align='right'>{Number(p.unitCost).toLocaleString()}</TableCell>
                        <TableCell align='right'>{Number(p.totalCost).toLocaleString()}</TableCell>
                        <TableCell align='right'>
                          <Typography variant='caption' color='text.secondary'>{p.notes ?? '-'}</Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Tooltip title='Remove part'>
                            <IconButton size='small' color='error' onClick={() => handleDeletePart(p.id)}>
                              <i className='ri-delete-bin-line text-sm' />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3}><Typography variant='body2' className='font-medium'>Total</Typography></TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' className='font-medium'>
                          {request.currency ?? 'GHS'} {totalPartsCost.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </TableBody>
                </Table>
              </Card>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions className='gap-2 pbs-4'>
        {decisionError && <Alert severity='error' sx={{ mr: 'auto' }} onClose={() => setDecisionError(null)}>{decisionError}</Alert>}

        {/* Tenant confirmation: only the owning occupant, only while awaiting confirmation */}
        {canDecide && (
          <>
            <Button
              variant='outlined' color='error' disabled={decisionBusy}
              startIcon={<i className='ri-close-circle-line' />}
              onClick={() => setDisputeOpen(true)}
            >
              Not Fixed
            </Button>
            <Button
              variant='contained' color='success' disabled={decisionBusy}
              startIcon={decisionBusy ? <CircularProgress size={16} color='inherit' /> : <i className='ri-check-line' />}
              onClick={handleConfirm}
            >
              {decisionBusy ? 'Confirming…' : 'Confirm Fixed'}
            </Button>
          </>
        )}

        <Button variant='outlined' color='secondary' onClick={() => setOpen(false)}>Close</Button>
        {!canDecide && (
          <Button variant='contained' color='primary' startIcon={<i className='ri-pencil-line' />} onClick={onEdit}>
            Edit Request
          </Button>
        )}
      </DialogActions>

      {/* ── Dispute (reopen) ─────────────────────────────────────────────── */}
      <Dialog open={disputeOpen} onClose={() => !decisionBusy && setDisputeOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Repair not done?</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            This reopens the request so your property manager can follow up. Tell them what is still wrong.
          </Typography>
          <TextField
            size='small' fullWidth multiline rows={3} label='What is still wrong?'
            value={disputeReason}
            onChange={e => setDisputeReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions className='gap-2 pbs-4'>
          <Button variant='outlined' color='secondary' onClick={() => setDisputeOpen(false)} disabled={decisionBusy}>
            Cancel
          </Button>
          <Button
            variant='contained' color='error' onClick={handleDispute} disabled={decisionBusy}
            startIcon={decisionBusy ? <CircularProgress size={16} color='inherit' /> : undefined}
          >
            {decisionBusy ? 'Reopening…' : 'Reopen Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

export default ViewMaintenanceRequestDialog
