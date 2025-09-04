import { BaseLayout } from '@liam-hq/ui'
import type { FC, ReactNode } from 'react'
import { PublicAppBar } from './PublicAppBar'
import { PublicGlobalNav } from './PublicGlobalNav'

type Props = {
  children: ReactNode
}

export const PublicLayout: FC<Props> = ({ children }) => {
  return (
    <BaseLayout globalNav={<PublicGlobalNav />} appBar={<PublicAppBar />}>
      {children}
    </BaseLayout>
  )
}
