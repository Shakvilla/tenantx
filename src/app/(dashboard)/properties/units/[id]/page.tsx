import UnitPageContent from '@/views/properties/view/UnitPageContent'

type Props = {
  params: Promise<{ id: string }>
}

const ViewUnitPage = async ({ params }: Props) => {
  const { id } = await params
  return <UnitPageContent unitId={id} />
}

export default ViewUnitPage
