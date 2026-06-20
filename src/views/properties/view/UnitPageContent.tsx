'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import { getUnitById } from '@/lib/api/units'
import { getProperties } from '@/lib/api/properties'
import { getOccupantById } from '@/lib/api/occupants'
import { getStoredTenantId } from '@/lib/api/storage'
import type { Property } from '@/types/property'
import UnitDetails from './UnitDetails'

type UnitViewData = {
  id: string
  unitNumber: string
  propertyName: string
  propertyId: string
  tenantName: string | null
  status: 'occupied' | 'vacant' | 'maintenance' | 'available' | 'reserved'
  rent: string
  rentPeriod: string
  bedrooms: number
  bathrooms: number
  size: string
  floor: number | null
  type: string
  images: string[]
  amenities: string[]
  features: Record<string, any>
  metadata: Record<string, any>
}

interface Props {
  unitId: string
}

const UnitPageContent = ({ unitId }: Props) => {
  const [unitData, setUnitData] = useState<UnitViewData | undefined>(undefined)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const tenantId = getStoredTenantId()
      if (!tenantId) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      try {
        // Fetch unit + properties in parallel
        const [unitRes, propsRes] = await Promise.all([
          getUnitById(tenantId, unitId),
          getProperties(tenantId, { size: 100 })
        ])

        if (!unitRes.success || !unitRes.data) {
          setError('Unit not found')
          setLoading(false)
          return
        }

        const unit = unitRes.data
        const propsList: Property[] = propsRes.data ?? []

        // Resolve occupant name if the unit has an occupantId
        let tenantName: string | null = null
        const occupantId = unit.occupantId || unit.tenantRecordId
        if (occupantId) {
          try {
            const occupant = await getOccupantById(tenantId, occupantId)
            if (occupant?.firstName) {
              tenantName = `${occupant.firstName} ${occupant.lastName}`
            }
          } catch {
            // Non-critical — just skip the name
          }
        }

        // Find property name
        const unitProperty = propsList.find(p => p.id === unit.propertyId)

        const currencySymbol = unit.currency === 'USD' ? '$' : '₵'

        setUnitData({
          id: unit.id,
          unitNumber: unit.unitNo,
          propertyName: unitProperty?.name || 'Unknown Property',
          propertyId: unit.propertyId,
          tenantName,
          status: unit.status as any,
          rent: `${currencySymbol}${unit.rent.toLocaleString()}`,
          rentPeriod: unit.metadata?.rentPeriod || 'monthly',
          bedrooms: unit.bedrooms || 0,
          bathrooms: unit.bathrooms || 0,
          size: unit.sizeSqft ? `${unit.sizeSqft.toLocaleString()} sqft` : 'N/A',
          floor: unit.floor || null,
          type: unit.type,
          images: unit.images || [],
          amenities: unit.amenities || [],
          features: unit.features || {},
          metadata: unit.metadata || {}
        })
        setProperties(propsList)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load unit')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [unitId])

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight={400}>
        <Typography color='error'>{error}</Typography>
      </Box>
    )
  }

  return <UnitDetails unitData={unitData} unitId={unitId} properties={properties} />
}

export default UnitPageContent
