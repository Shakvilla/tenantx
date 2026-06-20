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

  const isActive = listing?.status === 'ACTIVE'

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
          <Box sx={{
            width: 40, height: 40, borderRadius: '50%',
            background: isActive
              ? 'var(--mui-palette-success-lightOpacity)'
              : 'var(--mui-palette-action-hover)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i
              className='ri-home-search-line'
              style={{
                fontSize: 20,
                color: isActive
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
              label={isActive ? 'Active listing' : 'Inactive'}
              size='small'
              variant='tonal'
              color={isActive ? 'success' : 'default'}
              sx={{ alignSelf: 'flex-start' }}
            />

            {error && (
              <Typography variant='caption' color='error'>{error}</Typography>
            )}

            <Typography variant='caption' color='text.secondary'>
              {isActive
                ? 'This unit will appear on the public vacancy listing page when it goes live.'
                : 'Toggle on to include this unit in the public vacancy listing.'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
