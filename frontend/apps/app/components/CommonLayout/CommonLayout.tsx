import type { ReactNode } from 'react'
import { AppBar } from '../AppBar/AppBar'
import styles from './CommonLayout.module.css'
import { GlobalNav } from './GlobalNav'

type CommonLayoutProps = {
  children: ReactNode
}

export async function CommonLayout({ children }: CommonLayoutProps) {
  return (
    <div className={styles.layout}>
      <GlobalNav />
      <div className={styles.mainContent}>
        <AppBar avatarInitial="L" avatarColor="var(--color-teal-800)" />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
