import { BaseLayout } from '@liam-hq/ui'
import type { FC, ReactNode } from 'react'
import { PublicAppBar } from './PublicAppBar'
import { PublicGlobalNav } from './PublicGlobalNav'
import styles from './PublicLayout.module.css'

type Props = {
  children: ReactNode
}

export const PublicLayout: FC<Props> = ({ children }) => {
  return (
    <BaseLayout
      className={styles.customLayout}
      globalNav={<PublicGlobalNav />}
      appBar={<PublicAppBar />}
    >
      {children}
    </BaseLayout>
  )
}
