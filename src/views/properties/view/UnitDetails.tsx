// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import UnitDetailHeader from './UnitDetailHeader'
import UnitInfoCard from './UnitInfoCard'

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

const UnitDetails = ({
  unitData,
  unitId
}: {
  unitData?: UnitData
  unitId: string
}) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <UnitDetailHeader unitData={unitData} unitId={unitId} />
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <UnitInfoCard unitData={unitData} />
          </Grid>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Grid container spacing={6}>
          {/* Additional sidebar content can be added here */}
        </Grid>
      </Grid>
    </Grid>
  )
}

export default UnitDetails

