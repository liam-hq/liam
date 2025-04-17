import type { ReactNode } from 'react'
import styles from './CommonLayout.module.css'
import { GlobalNav } from './GlobalNav'
import { ServerAppBar } from './ServerAppBar'

type CommonLayoutProps = {
  children: ReactNode
}

export async function CommonLayout({ children }: CommonLayoutProps) {
  // In a Server Component, we can't directly access the URL path
  // We'll let the ClientAppBar handle path detection and project ID extraction

  return (
    <div className={styles.layout}>
      <GlobalNav />
      <div className={styles.mainContent}>
        <ServerAppBar avatarInitial="L" avatarColor="var(--color-teal-800)" />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
