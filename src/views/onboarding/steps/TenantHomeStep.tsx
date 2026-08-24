'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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
import { createOccupant, lookupOccupants } from '@/lib/api/occupants'
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Ghana mobile numbers: local 0XXXXXXXXX (10 digits) or international +233XXXXXXXXX.
const PHONE_REGEX = /^(?:\+233|0)\d{9}$/

type FieldErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'phone' | 'moveInDate', string>>

// Validates the free-text person fields (property/unit are enforced separately by the pickers).
function validatePersonFields(f: {
  firstName: string
  lastName: string
  email: string
  phone: string
  moveInDate: string
}): FieldErrors {
  const e: FieldErrors = {}

  if (!f.firstName.trim()) e.firstName = 'First name is required.'
  else if (/\d/.test(f.firstName)) e.firstName = 'Name cannot contain numbers.'

  if (!f.lastName.trim()) e.lastName = 'Last name is required.'
  else if (/\d/.test(f.lastName)) e.lastName = 'Name cannot contain numbers.'

  // Email is OPTIONAL, deliberately. Most Ghanaian tenants do not have one — a trader at
  // Adenta market has a phone and nothing else — and demanding it forces the landlord to
  // invent an address. An invented address is worse than a blank one: it is what the system
  // will use to "send" her invoices and receipts, and if it happens to belong to a real
  // stranger it puts a tenant's rent details on their doorstep.
  //
  // The backend never wanted it either — CreateOccupantRequest carries @Email (format) with
  // no @NotBlank. This requirement was invented here. The guarantor and maintainer forms in
  // this same product get it right: phone required, email optional.
  //
  // A value that IS typed must still be a valid address.
  if (f.email.trim() && !EMAIL_REGEX.test(f.email.trim())) e.email = 'Enter a valid email address.'

  if (!f.phone.trim()) e.phone = 'Phone number is required.'
  else if (!PHONE_REGEX.test(f.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid Ghana phone number, e.g. 0244123456.'

  if (!f.moveInDate) e.moveInDate = 'Move-in date is required.'

  return e
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  // Duplicate-occupant detection: `matches` holds whatever the last lookup returned; the
  // landlord must explicitly confirm (or dismiss) before we reuse/prepopulate anything.
  const [matches, setMatches] = useState<OccupantRecord[]>([])
  const [checking, setChecking] = useState(false)
  const [confirmedOccupant, setConfirmedOccupant] = useState<OccupantRecord | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const lastLookupKey = useRef<string | null>(null)

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
    // No form.email here — the phone is the identity that matters (see validatePersonFields).
    form.propertyId && form.unitId && form.firstName && form.lastName && form.phone && form.moveInDate
  )

  // A hard duplicate — same email as an existing occupant.
  const emailMatch = useMemo(() => {
    const email = form.email.trim().toLowerCase()

    if (!email) return undefined

    return matches.find(m => m.email?.toLowerCase() === email)
  }, [matches, form.email])

  // Same phone, different email — could be the same person under a new address, or a coincidence.
  const phoneMatches = useMemo(() => {
    const phone = form.phone.trim()
    const email = form.email.trim().toLowerCase()

    if (!phone) return []

    return matches.filter(m => m.phone === phone && m.email?.toLowerCase() !== email)
  }, [matches, form.phone, form.email])

  const showConfirmPanel = !confirmedOccupant && !dismissed && Boolean(emailMatch || phoneMatches.length > 0)

  const runLookup = async () => {
    if (confirmedOccupant) return

    const email = form.email.trim()
    const phone = form.phone.trim()

    if (!email && !phone) return

    const key = `${email}|${phone}`

    if (lastLookupKey.current === key) return
    lastLookupKey.current = key

    setChecking(true)

    try {
      const results = await lookupOccupants(tenantId, email, phone)

      setMatches(results)
    } finally {
      setChecking(false)
    }
  }

  const resetDetection = () => {
    setConfirmedOccupant(null)
    setDismissed(false)
    setMatches([])
    lastLookupKey.current = null
  }

  const buildAssignResult = (occ: OccupantRecord): TenantHomeResult => ({
    ids: {
      occupantId: occ.id,
      propertyId: form.propertyId,
      unitId: form.unitId,
      unitNo: selectedUnit?.unitNo
    },
    rent: selectedUnit?.rent ?? 0,
    moveInDate: form.moveInDate,
    occupantName: `${occ.firstName} ${occ.lastName}`.trim()
  })

  // Landlord has confirmed identity: prepopulate the visible fields and report the assignment.
  const handleConfirmOccupant = (occ: OccupantRecord) => {
    setConfirmedOccupant(occ)
    setDismissed(false)
    setForm(f => ({ ...f, firstName: occ.firstName, lastName: occ.lastName, email: occ.email, phone: occ.phone }))
    onComplete(buildAssignResult(occ))
  }

  const handleAssignExisting = () => {
    if (!confirmedOccupant) return
    onComplete(buildAssignResult(confirmedOccupant))
  }

  const handleUseDifferentEmail = () => {
    resetDetection()
    setForm(f => ({ ...f, email: '' }))
  }

  const handleDismissPhoneMatches = () => {
    setDismissed(true)
  }

  const handleUndoConfirm = () => {
    setConfirmedOccupant(null)
    setMatches([])
    setDismissed(false)
    lastLookupKey.current = null
  }

  // Clears a single field's error (used as the user edits it).
  const clearFieldError = (field: keyof FieldErrors) => setFieldErrors(prev => ({ ...prev, [field]: undefined }))

  // Validates one field on blur so the landlord gets feedback before submitting. Returns validity.
  const validateField = (field: keyof FieldErrors): boolean => {
    const err = validatePersonFields(form)[field]

    setFieldErrors(prev => ({ ...prev, [field]: err }))

    return !err
  }

  const handleEmailChange = (value: string) => {
    resetDetection()
    clearFieldError('email')
    setForm(f => ({ ...f, email: value }))
  }

  const handlePhoneChange = (value: string) => {
    resetDetection()
    clearFieldError('phone')
    setForm(f => ({ ...f, phone: value }))
  }

  const handleSubmit = async () => {
    setError(null)

    // Validate the person fields up-front; surface all errors and stop before any API call.
    const errs = validatePersonFields(form)

    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)

    try {
      // Final safety net: catch an email duplicate even if the landlord never blurred the field.
      const email = form.email.trim()
      const phone = form.phone.trim()
      const dupCheck = email || phone ? await lookupOccupants(tenantId, email, phone) : []
      const dup = dupCheck.find(m => m.email?.toLowerCase() === email.toLowerCase())

      if (dup) {
        setMatches(dupCheck)
        setDismissed(false)

        return
      }

      const record = await createOccupant(tenantId, {
        firstName: form.firstName,
        lastName: form.lastName,
        // Send absent rather than '' when the tenant has no email, so the record carries no
        // address at all instead of an empty one that later reads as "we have it, it's blank".
        email: form.email.trim() || undefined,
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

  const personFieldsDisabled = blocked || Boolean(confirmedOccupant)

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

      {showConfirmPanel && (
        <Alert severity='info' sx={{ mb: 4 }}>
          {emailMatch ? (
            <>
              <AlertTitle>This email already belongs to an occupant</AlertTitle>
              {emailMatch.firstName} {emailMatch.lastName} · {emailMatch.email} · {emailMatch.phone}
              <br />
              Currently in {emailMatch.unitNo ? `Unit ${emailMatch.unitNo}` : '—'}
              {emailMatch.propertyName ? ` · ${emailMatch.propertyName}` : ''}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button variant='contained' size='small' onClick={() => handleConfirmOccupant(emailMatch)}>
                  Yes, assign {emailMatch.firstName} to Unit {selectedUnit?.unitNo}
                </Button>
                <Button size='small' onClick={handleUseDifferentEmail}>
                  Use a different email
                </Button>
              </Box>
            </>
          ) : (
            <>
              <AlertTitle>Someone with this phone already exists — is it the same person?</AlertTitle>
              {phoneMatches.map(m => (
                <Box
                  key={m.id}
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mt: 1 }}
                >
                  <Typography variant='body2'>
                    {m.firstName} {m.lastName} · {m.email} · {m.unitNo ? `Unit ${m.unitNo}` : '—'}
                  </Typography>
                  <Button variant='contained' size='small' onClick={() => handleConfirmOccupant(m)}>
                    Yes, it&apos;s them — assign to Unit {selectedUnit?.unitNo}
                  </Button>
                </Box>
              ))}
              <Box sx={{ mt: 2 }}>
                <Button size='small' onClick={handleDismissPhoneMatches}>
                  No, this is a new tenant
                </Button>
              </Box>
            </>
          )}
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
            type='email'
            label='Email (optional)'
            disabled={personFieldsDisabled}
            error={Boolean(fieldErrors.email)}
            helperText={fieldErrors.email || (checking ? 'Checking…' : ' ')}
            value={form.email}
            onChange={e => handleEmailChange(e.target.value)}
            onBlur={() => {
              if (validateField('email')) void runLookup()
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            label='Phone number'
            disabled={personFieldsDisabled}
            error={Boolean(fieldErrors.phone)}
            helperText={fieldErrors.phone || (checking ? 'Checking…' : ' ')}
            value={form.phone}
            onChange={e => handlePhoneChange(e.target.value)}
            onBlur={() => {
              if (validateField('phone')) void runLookup()
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            label='First name'
            disabled={personFieldsDisabled}
            error={Boolean(fieldErrors.firstName)}
            helperText={fieldErrors.firstName || ' '}
            value={form.firstName}
            onChange={e => {
              clearFieldError('firstName')
              setForm({ ...form, firstName: e.target.value })
            }}
            onBlur={() => validateField('firstName')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            label='Last name'
            disabled={personFieldsDisabled}
            error={Boolean(fieldErrors.lastName)}
            helperText={fieldErrors.lastName || ' '}
            value={form.lastName}
            onChange={e => {
              clearFieldError('lastName')
              setForm({ ...form, lastName: e.target.value })
            }}
            onBlur={() => validateField('lastName')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            type='date'
            label='Move-in date'
            disabled={blocked}
            error={Boolean(fieldErrors.moveInDate)}
            helperText={fieldErrors.moveInDate || ' '}
            slotProps={{ inputLabel: { shrink: true } }}
            value={form.moveInDate}
            onChange={e => {
              clearFieldError('moveInDate')
              setForm({ ...form, moveInDate: e.target.value })
            }}
            onBlur={() => validateField('moveInDate')}
          />
        </Grid>
        <Grid
          size={{ xs: 12 }}
          sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, alignItems: 'center' }}
        >
          {confirmedOccupant ? (
            <>
              <Button onClick={handleUndoConfirm}>Not them / choose again</Button>
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
