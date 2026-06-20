'use client'

import { useState, useEffect } from 'react'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

import OccupantDetails from './OccupantDetails'
import { getOccupantById } from '@/lib/api/occupants'
import type { OccupantRecord } from '@/lib/api/occupants'
import { advanceRentsApi } from '@/lib/api/advanceRents'
import { cautionFeesApi } from '@/lib/api/cautionFees'
import { getUnitById } from '@/lib/api/units'
import type { AdvanceRentResponse } from '@/types/advanceRent'
import type { CautionFeeResponse } from '@/types/cautionFee'
import type { Unit } from '@/types/property'
import { getStoredTenantId } from '@/lib/api/storage'
import { calculateLeasePeriod } from '@/utils/math'

function formatMoney(amount: number, currency = 'GHS'): string {
  return `${currency} ${amount.toLocaleString()}`
}

function transformOccupantData(
  record: OccupantRecord,
  advanceRents: AdvanceRentResponse[],
  cautionFees: CautionFeeResponse[],
  unit: Unit | null
) {
  const fullName = `${record.firstName} ${record.lastName}`
  const ec = record.emergencyContact || {}

  // Pick the most relevant advance rent (ACTIVE > EXPIRING)
  const activeAR =
    advanceRents.find(r => r.status === 'ACTIVE') ??
    advanceRents.find(r => r.status === 'EXPIRING')

  // costPerMonth: unit.rent is the master record; fall back to advance rent's monthlyRent
  const currency = unit?.currency || activeAR?.currency || 'GHS'
  const costPerMonth = unit?.rent
    ? formatMoney(unit.rent, currency)
    : activeAR
    ? formatMoney(activeAR.monthlyRent, activeAR.currency)
    : '-'

  // securityDeposit: active caution fee takes priority; fall back to unit.deposit
  const activeFee = cautionFees.find(
    f => f.status === 'HELD' || f.status === 'PARTIALLY_REFUNDED'
  )
  const securityDeposit = activeFee
    ? formatMoney(activeFee.amount, activeFee.currency)
    : unit?.deposit
    ? formatMoney(unit.deposit, currency)
    : '-'

  // lateFee: stored in unit.features if the landlord configured it
  const lateFeeRaw = unit?.features?.lateFee
  const lateFee = lateFeeRaw != null ? String(lateFeeRaw) : '-'

  // paymentDueDate: for advance-rent tenants this is when the current period ends
  // (= next time they need to pay). Fall back to '-'.
  const paymentDueDate = activeAR?.periodEnd
    ? new Date(activeAR.periodEnd).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    : '-'

  return {
    id: record.id,
    name: fullName,
    email: record.email,
    phone: record.phone,
    roomNo: record.unitNo || '-',
    propertyName: record.propertyName || record.property?.name || '-',
    numberOfUnits: 1,
    costPerMonth,
    leasePeriod: calculateLeasePeriod(record.moveInDate, record.moveOutDate),
    totalAmount: '-',
    status: (record.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
    avatar: record.avatar || undefined,
    age: undefined,
    familyMembers: ec.familyMembersCount ? Number(ec.familyMembersCount) : undefined,
    job: (ec.occupation as string) || undefined,
    previousAddress: (ec.previousAddress as any) || undefined,
    permanentAddress: (ec.permanentAddress as any) || undefined,
    propertyImage: undefined,
    propertyAddress: undefined,
    unitName: record.unitNo || '-',
    // Critical: pass through so AdvanceRentSection / CautionFeeSection receive their props
    unitId: record.unitId ?? undefined,
    propertyId: record.propertyId ?? undefined,
    ghanaCardId: record.ghanaCardId ?? undefined,
    idType: record.idType ?? undefined,
    idCardFrontUrl: record.idCardFrontUrl ?? undefined,
    idCardBackUrl: record.idCardBackUrl ?? undefined,
    securityDeposit,
    lateFee,
    rentType: 'Monthly',
    receipt: '-',  // needs GET /invoices?occupantId= endpoint — not available yet
    paymentDueDate,
  }
}

type Props = {
  /** The occupant UUID from the URL params */
  occupantId: string
}

/**
 * Client component that fetches the occupant (and related advance-rent / caution-fee
 * records) via the Axios client so the 401-refresh interceptor is active.
 * Advance-rent and caution-fee fetches are best-effort — a failure there won't
 * break the page; those fields just fall back to '-'.
 */
export default function OccupantViewClient({ occupantId }: Props) {
  const [occupant, setOccupant] = useState<ReturnType<typeof transformOccupantData> | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    const tenantId = getStoredTenantId()

    if (!tenantId) {
      setError('No tenant session found. Please log in again.')
      setLoading(false)
      return
    }

    Promise.allSettled([
      getOccupantById(tenantId, occupantId),
      advanceRentsApi.getByOccupant(occupantId),
      cautionFeesApi.getByOccupant(occupantId),
      // Unit fetch deferred until we know the unitId — handled below after occupant resolves
    ] as const)
      .then(async ([occupantResult, arResult, cfResult]) => {
        if (occupantResult.status === 'rejected') {
          setError(occupantResult.reason?.message ?? 'Failed to load occupant')
          return
        }

        const record      = occupantResult.value
        const advanceRents = arResult.status === 'fulfilled' ? arResult.value : []
        const cautionFees  = cfResult.status === 'fulfilled'  ? cfResult.value  : []

        // Fetch unit now that we have the unitId from the occupant record
        let unit: Unit | null = null
        if (record.unitId) {
          try {
            const unitRes = await getUnitById(tenantId, record.unitId)
            unit = unitRes?.data ?? null
          } catch {
            // best-effort — unit data is non-critical
          }
        }

        setOccupant(transformOccupantData(record, advanceRents, cautionFees, unit))
      })
      .finally(() => setLoading(false))
  }, [occupantId])

  if (loading) {
    return (
      <Box className='flex justify-center items-center' sx={{ minHeight: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !occupant) {
    return (
      <Box sx={{ m: 2 }}>
        <Alert
          severity='error'
          action={
            <Button color='inherit' size='small' onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        >
          {error ?? 'Occupant not found'}
        </Alert>
      </Box>
    )
  }

  return <OccupantDetails tenantData={occupant} tenantId={occupantId} />
}
