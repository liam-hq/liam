import { BaseLayout } from '@liam-hq/ui'
import type { FC, ReactNode } from 'react'
import { PublicAppBar } from './PublicAppBar'

type Props = {
  children: ReactNode
}

export const PublicLayout: FC<Props> = ({ children }) => {
  return <BaseLayout appBar={<PublicAppBar />}>{children}</BaseLayout>
}
