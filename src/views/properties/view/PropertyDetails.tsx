// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import PropertyDetailHeader from './PropertyDetailHeader'
import PropertyImagesCard from './PropertyImagesCard'
import PropertyInfoCard from './PropertyInfoCard'
import PropertyFeaturesCard from './PropertyFeaturesCard'
import PropertyLocationCard from './PropertyLocationCard'
import PropertyUnitsTable from './PropertyUnitsTable'

type PropertyData = {
  id: string
  name: string
  location: string
  type: string
  stock: boolean
  address: string
  price: string
  bedroom: number
  bathroom: number
  rooms: number
  facilities: string[]
  condition: string
  region: string
  district: string
  city: string
  gpsCode: string
  description: string
  images: string[]
  thumbnailIndex: number
  amenities: Record<string, boolean>
}

const PropertyDetails = ({
  propertyData,
  propertyId
}: {
  propertyData?: PropertyData
  propertyId: string
}) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <PropertyDetailHeader propertyData={propertyData} propertyId={propertyId} />
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <PropertyImagesCard propertyData={propertyData} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <PropertyInfoCard propertyData={propertyData} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <PropertyFeaturesCard propertyData={propertyData} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <PropertyUnitsTable />
          </Grid>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <PropertyLocationCard propertyData={propertyData} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default PropertyDetails

