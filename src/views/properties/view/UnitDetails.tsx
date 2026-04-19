// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import UnitDetailHeader from './UnitDetailHeader'
import UnitInfoCard from './UnitInfoCard'
import UnitImagesCard from './UnitImagesCard'
import UnitAmenitiesCard from './UnitAmenitiesCard'

// Type Imports
import type { Property } from '@/types/property'

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

const UnitDetails = ({
  unitData,
  unitId,
  properties = []
}: {
  unitData?: UnitViewData
  unitId: string
  properties?: Property[]
}) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <UnitDetailHeader unitData={unitData} unitId={unitId} properties={properties} />
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <UnitImagesCard unitData={unitData} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <UnitInfoCard unitData={unitData} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <UnitAmenitiesCard unitData={unitData} />
          </Grid>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Grid container spacing={6}>
          {/* Side content like Tenant Card can go here */}
        </Grid>
      </Grid>
    </Grid>
  )
}

export default UnitDetails

