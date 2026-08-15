import OccupantViewClient from '@/views/occupants/view/OccupantViewClient'

type Props = {
  params: Promise<{ id: string }>
}

/**
 * Occupant detail page.
 *
 * Deliberately does NOT fetch occupant data server-side.
 * Server-side fetches use the auth_token cookie which can't be refreshed
 * when the JWT expires — the Axios client interceptor handles that transparently.
 */
export default async function ViewOccupantPage(props: Props) {
  const { id } = await props.params

  return <OccupantViewClient occupantId={id} />
}
