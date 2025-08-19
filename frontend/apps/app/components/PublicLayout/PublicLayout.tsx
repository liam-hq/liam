import type { FC, ReactNode } from 'react'
import styles from './PublicLayout.module.css'
import { PublicGlobalNav } from './PublicGlobalNav'
import { PublicAppBar } from './PublicAppBar'

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