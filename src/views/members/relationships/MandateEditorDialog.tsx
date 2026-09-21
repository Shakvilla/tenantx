'use client'

import { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import OutlinedInput from '@mui/material/OutlinedInput'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { getProperties } from '@/lib/api/properties'
import { getStoredTenantId } from '@/lib/api/storage'
import { createMandateDraft, updateMandate } from '@/lib/api/agent-network'
import { AGENT_CAPABILITY_LABELS, type AgentCapability } from '@/types/members/agentNetworkTypes'

interface FeeTermDraft {
  feeType: string
  payer: string
  basis: string
  amount: string
  rate: string
  description: string
}

interface Props {
  open: boolean
  relationshipId: string
  mandateId: string | null
  onClose: () => void
  onSaved: () => void
}

const CAPABILITIES = Object.keys(AGENT_CAPABILITY_LABELS) as AgentCapability[]

const MandateEditorDialog = ({ open, relationshipId, mandateId, onClose, onSaved }: Props) => {
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [capabilities, setCapabilities] = useState<string[]>([])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const [feeTerms, setFeeTerms] = useState<FeeTermDraft[]>([
    { feeType: 'COMMISSION', payer: 'LANDLORD', basis: 'PERCENT_OF_RENT', amount: '', rate: '', description: '' }
  ])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    const tenantId = getStoredTenantId()

    if (!tenantId) return
    getProperties(tenantId, { size: 200 })
      .then(res => setProperties(((res as any).data ?? []).map((p: any) => ({ id: p.id, name: p.name }))))
      .catch(() => setProperties([]))
  }, [open])

  useEffect(() => {
    if (open) {
      setSelectedProperties([])
      setCapabilities([])
      setStartTime('')
      setEndTime('')
      setFeeTerms([{ feeType: 'COMMISSION', payer: 'LANDLORD', basis: 'PERCENT_OF_RENT', amount: '', rate: '', description: '' }])
    }
  }, [open, mandateId])

  const toggleCapability = (cap: string) => {
    setCapabilities(prev => (prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]))
  }

  const handleSave = async () => {
    if (selectedProperties.length === 0) {
      setError('Select at least one property scope — a mandate with no scope cannot be activated')
      
return
    }

    if (capabilities.length === 0) {
      setError('Grant at least one capability')
      
return
    }

    setSaving(true)
    setError(null)

    try {
      const id =
        mandateId ??
        (await createMandateDraft(relationshipId, {
          startTime: startTime || undefined,
          endTime: endTime || undefined
        })).mandateId

      await updateMandate(id, {
        propertyIds: selectedProperties,
        capabilities,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        feeTerms: feeTerms.map(f => ({
          feeType: f.feeType,
          payer: f.payer,
          basis: f.basis,
          amount: f.amount ? Number(f.amount) : undefined,
          rate: f.rate ? Number(f.rate) : undefined,
          currency: 'GHS',
          description: f.description || undefined,
          disclosureStatus: 'PENDING'
        }))
      })
      onSaved()
    } catch (e: any) {
      setError(e?.message ?? 'Could not save mandate')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>{mandateId ? 'Edit mandate draft' : 'New mandate draft'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
        {error && (
          <Typography color='error' variant='body2' role='alert'>
            {error}
          </Typography>
        )}

        <FormControl fullWidth>
          <InputLabel id='mandate-properties-label'>Property scope</InputLabel>
          <Select
            labelId='mandate-properties-label'
            multiple
            value={selectedProperties}
            onChange={e => setSelectedProperties(e.target.value as string[])}
            input={<OutlinedInput label='Property scope' />}
            renderValue={selected => `${(selected as string[]).length} properties selected`}
          >
            {properties.map(p => (
              <MenuItem key={p.id} value={p.id}>
                <Checkbox checked={selectedProperties.includes(p.id)} />
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px' }}>
          <legend style={{ padding: '0 8px' }}>
            <Typography component='span' variant='subtitle2'>
              Capabilities
            </Typography>
          </legend>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
            Least privilege: grant only what this agent needs. Collection, wallet, invoicing and user administration can never be granted.
          </Typography>
          <FormGroup>
            {CAPABILITIES.map(cap => (
              <FormControlLabel
                key={cap}
                control={<Checkbox checked={capabilities.includes(cap)} onChange={() => toggleCapability(cap)} />}
                label={
                  <Box>
                    <Typography variant='body2'>{AGENT_CAPABILITY_LABELS[cap]}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {cap}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </FormGroup>
        </fieldset>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label='Start date'
            type='datetime-local'
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <TextField
            label='End date'
            type='datetime-local'
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1, minWidth: 200 }}
          />
        </Box>

        <Divider />
        <Typography variant='subtitle2'>Fee terms (no universal rate is implied)</Typography>
        {feeTerms.map((f, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 140, flex: 1 }}>
              <InputLabel>Fee type</InputLabel>
              <Select
                value={f.feeType}
                label='Fee type'
                onChange={e => setFeeTerms(prev => prev.map((t, j) => (j === i ? { ...t, feeType: e.target.value } : t)))}
              >
                {['COMMISSION', 'VIEWING', 'REGISTRATION', 'TRANSPORT', 'OTHER'].map(o => (
                  <MenuItem key={o} value={o}>{o}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 130, flex: 1 }}>
              <InputLabel>Payer</InputLabel>
              <Select
                value={f.payer}
                label='Payer'
                onChange={e => setFeeTerms(prev => prev.map((t, j) => (j === i ? { ...t, payer: e.target.value } : t)))}
              >
                {['LANDLORD', 'TENANT', 'SHARED', 'OTHER'].map(o => (
                  <MenuItem key={o} value={o}>{o}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150, flex: 1 }}>
              <InputLabel>Basis</InputLabel>
              <Select
                value={f.basis}
                label='Basis'
                onChange={e => setFeeTerms(prev => prev.map((t, j) => (j === i ? { ...t, basis: e.target.value } : t)))}
              >
                {['FIXED', 'PERCENT_OF_RENT', 'ONE_MONTH_RENT', 'OTHER'].map(o => (
                  <MenuItem key={o} value={o}>{o}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label='Amount (GHS)'
              value={f.amount}
              onChange={e => setFeeTerms(prev => prev.map((t, j) => (j === i ? { ...t, amount: e.target.value } : t)))}
              sx={{ width: 130 }}
            />
            <TextField
              label='Rate %'
              value={f.rate}
              onChange={e => setFeeTerms(prev => prev.map((t, j) => (j === i ? { ...t, rate: e.target.value } : t)))}
              sx={{ width: 110 }}
            />
          </Box>
        ))}

        <Divider />
        <Typography variant='body2' color='text.secondary'>
          Review: {selectedProperties.length} properties, {capabilities.length} capabilities
          {startTime || endTime ? `, ${startTime || '…'} → ${endTime || '…'}` : ''}. Saving keeps the
          mandate a draft — propose it from the record, and activation still needs the agent
          acceptance plus your explicit activation.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save draft'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MandateEditorDialog
