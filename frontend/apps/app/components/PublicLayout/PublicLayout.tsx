import type { FC, ReactNode } from 'react'
import { PublicAppBar } from './PublicAppBar'
import { PublicGlobalNav } from './PublicGlobalNav'
import styles from './PublicLayout.module.css'

type Props = {
  children: ReactNode
}

export const PublicLayout: FC<Props> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <PublicGlobalNav />
      <div className={styles.mainContent}>
        <PublicAppBar />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
