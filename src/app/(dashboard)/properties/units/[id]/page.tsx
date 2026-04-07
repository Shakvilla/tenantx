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

type Props = {
  params: Promise<{ id: string }>
}

const ViewUnitPage = async (props: Props) => {
  const params = await props.params
  const unitId = params.id

  // TODO: Fetch unit data from API using unitId
  // For now, using sample data - in a real app, this would come from an API
  const unitData: UnitData = {
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
  }

  return <UnitDetails unitData={unitData} unitId={unitId} />
}

export default ViewUnitPage
