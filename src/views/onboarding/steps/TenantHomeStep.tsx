'use client'

import { useEffect, useMemo, useState } from 'react'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

import { getProperties } from '@/lib/api/properties'
import { getAllUnits } from '@/lib/api/units'
import { createOccupant, getOccupantByEmail } from '@/lib/api/occupants'
import type { OccupantRecord } from '@/lib/api/occupants'
import type { OnboardingEntityIds } from '../onboardingTypes'

export interface TenantHomeResult {
  ids: Partial<OnboardingEntityIds>
  rent: number
  moveInDate: string
  occupantName: string
}

interface Props {
  tenantId: string
  onComplete: (result: TenantHomeResult) => void

  // Closes the wizard and navigates to `route` — used by the "add property/unit" links.
  onExit: (route: string) => void
}

export default function TenantHomeStep({ tenantId, onComplete, onExit }: Props) {
  const [properties, setProperties] = useState<Array<{ id: string; name: string }>>([])
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [units, setUnits] = useState<Array<{ id: string; unitNo: string; rent: number }>>([])
  const [loadingUnits, setLoadingUnits] = useState(false)

  const [form, setForm] = useState({
    propertyId: '',
    unitId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    moveInDate: new Date().toISOString().split('T')[0]
  })

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [existingOccupant, setExistingOccupant] = useState<OccupantRecord | null>(null)

  useEffect(() => {
    setLoadingProperties(true)
    getProperties(tenantId, { size: 100 })
      .then(res => {
        if (res.success && res.data) setProperties(res.data.map(p => ({ id: p.id, name: p.name })))
      })
      .catch(() => setError('Could not load your properties. Please close and try again.'))
      .finally(() => setLoadingProperties(false))
  }, [tenantId])

  useEffect(() => {
    if (!form.propertyId) {
      setUnits([])

      return
    }

    setLoadingUnits(true)
    getAllUnits(tenantId, { propertyId: form.propertyId, status: 'available', size: 100 })
      .then(res => setUnits(res.success && res.data ? res.data.map(u => ({ id: u.id, unitNo: u.unitNo, rent: u.rent })) : []))
      .catch(() => setUnits([]))
      .finally(() => setLoadingUnits(false))
  }, [tenantId, form.propertyId])

  const selectedUnit = useMemo(() => units.find(u => u.id === form.unitId), [units, form.unitId])

  // Empty-state flags: a landlord can't onboard until a property with a vacant unit exists.
  const noProperties = !loadingProperties && properties.length === 0
  const noUnitsForProperty = Boolean(form.propertyId) && !loadingUnits && units.length === 0

  // Disable the tenant details + Continue whenever there's nothing to onboard into.
  const blocked = noProperties || noUnitsForProperty

  const valid = Boolean(
    form.propertyId && form.unitId && form.firstName && form.lastName && form.email && form.phone && form.moveInDate
  )

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)

    try {
      const existing = await getOccupantByEmail(tenantId, form.email)

      if (existing) {
        setExistingOccupant(existing)

        return
      }

      const record = await createOccupant(tenantId, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        status: 'active',
        propertyId: form.propertyId,
        unitId: form.unitId,
        unitNo: selectedUnit?.unitNo,
        moveInDate: new Date(form.moveInDate).toISOString()
      })

      if (!record?.id) {
        setError('Could not create the tenant. Please try again.')

        return
      }

      onComplete({
        ids: { occupantId: record.id, propertyId: form.propertyId, unitId: form.unitId, unitNo: selectedUnit?.unitNo },
        rent: selectedUnit?.rent ?? 0,
        moveInDate: form.moveInDate,
        occupantName: `${form.firstName} ${form.lastName}`.trim()
      })
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Could not create the tenant. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssignExisting = () => {
    if (!existingOccupant) return

    onComplete({
      ids: {
        occupantId: existingOccupant.id,
        propertyId: form.propertyId,
        unitId: form.unitId,
        unitNo: selectedUnit?.unitNo
      },
      rent: selectedUnit?.rent ?? 0,
      moveInDate: form.moveInDate,
      occupantName: `${existingOccupant.firstName} ${existingOccupant.lastName}`.trim()
    })
  }

  const handleUseDifferentEmail = () => {
    setExistingOccupant(null)
    setForm({ ...form, email: '' })
  }

  return (
    <Box>
      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {noProperties && (
        <Alert
          severity='warning'
          sx={{ mb: 4 }}
          action={
            <Button color='inherit' size='small' onClick={() => onExit('/properties?create=1')}>
              Add a property
            </Button>
          }
        >
          <AlertTitle>No properties yet</AlertTitle>
          You need to add a property and a unit before you can onboard a tenant.
        </Alert>
      )}

      {noUnitsForProperty && (
        <Alert
          severity='warning'
          sx={{ mb: 4 }}
          action={
            <Button color='inherit' size='small' onClick={() => onExit('/properties/units')}>
              Add a unit
            </Button>
          }
        >
          <AlertTitle>No available units in this property</AlertTitle>
          Add a vacant unit to this property (or pick another property) before onboarding a tenant.
        </Alert>
      )}

      {existingOccupant && (
        <Alert severity='info' sx={{ mb: 4 }}>
          <AlertTitle>This person is already an occupant</AlertTitle>
          {existingOccupant.firstName} {existingOccupant.lastName} · {existingOccupant.email} ·{' '}
          {existingOccupant.phone}
          <br />
          Currently in {existingOccupant.unitNo ? `Unit ${existingOccupant.unitNo}` : '—'}
          {existingOccupant.propertyName ? ` · ${existingOccupant.propertyName}` : ''}
          <br />
          You can assign them to the unit you selected.
        </Alert>
      )}

      <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
        Pick the home this tenant is moving into, then enter their basic details. You can add ID, a photo and an
        emergency contact later from the tenant&apos;s profile.
      </Typography>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            fullWidth
            required
            label='Property'
            disabled={noProperties}
            value={form.propertyId}
            onChange={e => setForm({ ...form, propertyId: e.target.value, unitId: '' })}
          >
            {properties.map(p => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            fullWidth
            required
            label='Unit'
            disabled={!form.propertyId || loadingUnits || noUnitsForProperty}
            helperText={loadingUnits ? 'Loading units…' : ' '}
            value={form.unitId}
            onChange={e => setForm({ ...form, unitId: e.target.value })}
          >
            {units.map(u => (
              <MenuItem key={u.id} value={u.id}>
                {u.unitNo}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            label='First name'
            disabled={blocked}
            value={form.firstName}
            onChange={e => setForm({ ...form, firstName: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            label='Last name'
            disabled={blocked}
            value={form.lastName}
            onChange={e => setForm({ ...form, lastName: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            type='email'
            label='Email'
            disabled={blocked}
            value={form.email}
            onChange={e => {
              setExistingOccupant(null)
              setForm({ ...form, email: e.target.value })
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            label='Phone number'
            disabled={blocked}
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            type='date'
            label='Move-in date'
            disabled={blocked}
            slotProps={{ inputLabel: { shrink: true } }}
            value={form.moveInDate}
            onChange={e => setForm({ ...form, moveInDate: e.target.value })}
          />
        </Grid>
        <Grid
          size={{ xs: 12 }}
          sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, alignItems: 'center' }}
        >
          {existingOccupant ? (
            <>
              <Button onClick={handleUseDifferentEmail}>Use a different email</Button>
              <Button variant='contained' disabled={!form.unitId} onClick={handleAssignExisting}>
                Assign to Unit {selectedUnit?.unitNo}
              </Button>
            </>
          ) : (
            <Button
              variant='contained'
              disabled={!valid || submitting || blocked}
              onClick={handleSubmit}
              endIcon={submitting ? <CircularProgress size={18} color='inherit' /> : undefined}
            >
              Continue
            </Button>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
