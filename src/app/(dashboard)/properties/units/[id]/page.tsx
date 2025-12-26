'use client'

// React Imports
import { useState } from 'react'

import { useParams } from 'next/navigation'

// Component Imports
import UnitDetails from '@/views/properties/view/UnitDetails'

type UnitData = {
  id: string
  unitNumber: string
  propertyName: string
  propertyId: string
  tenantName: string | null
  status: 'occupied' | 'vacant' | 'maintenance'
  rent: string
  bedrooms: number
  bathrooms: number
  size: string
}

const ViewUnitPage = () => {
  const params = useParams()
  const unitId = params.id as string

  // TODO: Fetch unit data from API using unitId
  // For now, using sample data - in a real app, this would come from an API
  const [unitData] = useState<UnitData | undefined>({
    id: unitId,
    unitNumber: 'Unit 101',
    propertyName: 'Xorla House',
    propertyId: '1',
    tenantName: 'John Doe',
    status: 'occupied',
    rent: '₵1,200',
    bedrooms: 2,
    bathrooms: 1,
    size: '850 sqft'
  })

  return <UnitDetails unitData={unitData} unitId={unitId} />
}

export default ViewUnitPage
