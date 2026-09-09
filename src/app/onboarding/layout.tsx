import type { ChildrenType } from '@core/types'
import Providers from '@components/Providers'

type Props = ChildrenType

const Layout = async (props: Props) => {
  const { children } = props

  return <Providers direction='ltr'>{children}</Providers>
}

export default Layout
