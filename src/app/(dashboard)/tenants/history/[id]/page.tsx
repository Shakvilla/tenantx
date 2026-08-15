import OccupantViewClient from '@/views/occupants/view/OccupantViewClient'

type Props = {
  params: Promise<{ id: string }>
}

/**
 * Former tenant / occupant history detail page.
 *
 * Reuses OccupantViewClient — same client-side fetch + 401-refresh pattern
 * as the active occupant detail page. The occupant's status (inactive/active)
 * is just data; the view is identical.
 */
export default async function ViewTenantHistoryPage(props: Props) {
  const { id } = await props.params

  return <OccupantViewClient occupantId={id} />
}
