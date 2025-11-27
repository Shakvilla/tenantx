import PropertyDetails from '@/views/properties/view/PropertyDetails'

type Props = {
  params: Promise<{ id: string }>
}

const ViewPropertyPage = async (props: Props) => {
  const params = await props.params

  // TODO: Fetch property data from API using params.id
  // For now, using sample data
  const propertyData = {
    id: params.id,
    name: 'Xorla House',
    location: 'Adenta',
    type: 'House',
    stock: true,
    address: 'GD-081-0392',
    price: '₵92500',
    bedroom: 4,
    bathroom: 3,
    rooms: 6,
    facilities: ['wifi', 'bed', 'light'],
    condition: 'New',
    region: 'Greater Accra',
    district: 'Adenta',
    city: 'Accra',
    gpsCode: 'GD-081-0392',
    description: 'A beautiful modern house with all amenities',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=2148&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    ],
    thumbnailIndex: 0,
    amenities: {
      electricity: true,
      kitchenCabinets: true,
      tiledFloor: true,
      diningArea: true,
      parking: true,
      security: true,
      wifi: true
    }
  }

  return <PropertyDetails propertyData={propertyData} propertyId={params.id} />
}

export default ViewPropertyPage

