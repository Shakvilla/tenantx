'use client'

import { useState, useEffect } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

import { vacancyListingsApi } from '@/lib/api/vacancyListings'
import type { VacancyListing } from '@/types/vacancyListing'

interface Props {
  unitId: string
  unitNo?: string
  propertyName?: string
}

export default function AdvertiseUnitCard({ unitId, unitNo, propertyName }: Props) {
  const [listing,  setListing]  = useState<VacancyListing | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [toggling, setToggling] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // ── load existing listing for this unit ─────────────────────────────────

  useEffect(() => {
    setLoading(true)
    vacancyListingsApi
      .getByUnit(unitId)
      .then(list => setListing(list[0] ?? null))
      .catch(() => setListing(null))
      .finally(() => setLoading(false))
  }, [unitId])

  // The landlord's setting. Left alone by everything except this switch.
  const isActive = listing?.status === 'ACTIVE'

  /**
   * Whether the public can actually see it, which is not the same thing.
   *
   * The public queries require the unit to still be available on top of the
   * listing being ACTIVE, so signing an agreement — which reserves the unit —
   * takes the listing off the public page without touching it. This card used
   * to read `status` alone and go on saying "Listed for rent" regardless, so
   * the only symptom was silence from a page nobody could see.
   *
   * Nothing was deactivated, so it comes back by itself once the unit is free
   * again; the switch stays on because the setting really is on.
   */
  const pausedBy = isActive && listing && listing.unitStatus !== 'available' ? listing.unitStatus : null

  const PAUSE_REASON: Record<string, string> = {
    occupied: 'this unit is occupied',
    reserved: 'this unit is reserved',
    maintenance: 'this unit is under maintenance'
  }

  const pauseReason = pausedBy ? (PAUSE_REASON[pausedBy] ?? `this unit is ${pausedBy}`) : null

  // ── toggle handler ───────────────────────────────────────────────────────

  const handleToggle = async () => {
    setError(null)
    setToggling(true)

    try {
      if (!listing) {
        // No listing yet — create one
        const title = [unitNo && `Unit ${unitNo}`, propertyName]
          .filter(Boolean)
          .join(' — ') || 'Vacant Unit'

        const created = await vacancyListingsApi.create({
          unitId,
          title,
          status: 'ACTIVE',
        })
        setListing(created)
      } else if (isActive) {
        // Deactivate
        const updated = await vacancyListingsApi.update(listing.id, { status: 'INACTIVE' })
        setListing(updated)
      } else {
        // Re-activate
        const updated = await vacancyListingsApi.update(listing.id, { status: 'ACTIVE' })
        setListing(updated)
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to update listing')
    } finally {
      setToggling(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title='Advertise Unit'
        subheader='List this unit to attract prospective tenants'
        avatar={

          // Tracks what the public sees, not the switch — a success-green icon
          // beside a "Paused" chip contradicts it.
          <Box sx={{
            width: 40, height: 40, borderRadius: '50%',
            background: pausedBy
              ? 'var(--mui-palette-warning-lightOpacity)'
              : isActive
                ? 'var(--mui-palette-success-lightOpacity)'
                : 'var(--mui-palette-action-hover)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i
              className='ri-home-search-line'
              style={{
                fontSize: 20,
                color: pausedBy
                  ? 'var(--mui-palette-warning-main)'
                  : isActive
                    ? 'var(--mui-palette-success-main)'
                    : 'var(--mui-palette-text-secondary)',
              }}
            />
          </Box>
        }
      />

      <CardContent>
        {loading ? (
          <Box className='flex items-center gap-2'>
            <CircularProgress size={16} />
            <Typography variant='body2' color='text.secondary'>Checking status…</Typography>
          </Box>
        ) : (
          <Box className='flex flex-col gap-3'>
            <Box className='flex items-center justify-between'>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={handleToggle}
                    disabled={toggling}
                    color='success'
                  />
                }
                label={
                  <Typography variant='body2' fontWeight={500}>
                    {isActive ? 'Listed for rent' : 'Not advertised'}
                  </Typography>
                }
              />
              {toggling && <CircularProgress size={16} />}
            </Box>

            <Chip
              label={pausedBy ? 'Paused — not showing publicly' : isActive ? 'Active listing' : 'Inactive'}
              size='small'
              variant='tonal'
              color={pausedBy ? 'warning' : isActive ? 'success' : 'default'}
              sx={{ alignSelf: 'flex-start' }}
            />

            {error && (
              <Typography variant='caption' color='error'>{error}</Typography>
            )}

            <Typography variant='caption' color='text.secondary'>
              {pausedBy
                ? `Hidden from the public vacancy page while ${pauseReason}. It will start showing again on its own once the unit is available — you do not need to re-list it.`
                : isActive
                  ? 'This unit is showing on the public vacancy listing page.'
                  : 'Toggle on to include this unit in the public vacancy listing.'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
